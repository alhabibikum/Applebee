import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Clear all application data
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get current user to check if they're admin
    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if user has admin role
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "admin") {
      throw new Error("Only administrators can reset application data");
    }

    // Clear all tables except users and auth-related tables
    const tablesToClear = [
      "products",
      "categories", 
      "customers",
      "suppliers",
      "sales",
      "purchases",
      "stockMovements",
      "userProfiles",
      "userRoles"
    ];

    const results = [];
    
    for (const tableName of tablesToClear) {
      try {
        const records = await ctx.db.query(tableName as any).collect();
        for (const record of records) {
          await ctx.db.delete(record._id);
        }
        results.push({ table: tableName, cleared: records.length });
      } catch (error) {
        console.error(`Error clearing ${tableName}:`, error);
        results.push({ table: tableName, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return {
      success: true,
      message: "Application data has been reset successfully",
      results
    };
  },
});

// Enhanced restore data from backup with complete validation
export const restoreFromBackup = mutation({
  args: {
    backupData: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin role
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "admin") {
      throw new Error("Only administrators can restore data");
    }

    try {
      const backup = JSON.parse(args.backupData);

      if (!backup.data) {
        throw new Error("Invalid backup format: missing data section");
      }

      // Validate backup metadata
      if (!backup.metadata || !backup.metadata.version) {
        throw new Error("Invalid backup format: missing metadata");
      }

      // Clear existing data before restore (optional - can be made configurable)
      const tablesToClear = [
        "products",
        "categories", 
        "customers",
        "suppliers",
        "sales",
        "purchases",
        "stockMovements"
      ];

      // Clear existing data
      for (const tableName of tablesToClear) {
        try {
          const records = await ctx.db.query(tableName as any).collect();
          for (const record of records) {
            await ctx.db.delete(record._id);
          }
        } catch (error) {
          console.error(`Error clearing ${tableName} before restore:`, error);
        }
      }

      const results = [];
      let totalRestored = 0;

      // Restore each table's data in specific order to handle dependencies
      const restoreOrder = [
        "categories",
        "suppliers", 
        "customers",
        "products",
        "purchases",
        "sales",
        "stockMovements"
      ];

      for (const tableName of restoreOrder) {
        const records = backup.data[tableName];
        if (!Array.isArray(records)) continue;
        
        try {
          let insertedCount = 0;
          
          for (const record of records) {
            // Remove system fields that shouldn't be restored
            const { _id, _creationTime, ...cleanRecord } = record;
            
            // Skip if record is empty or invalid
            if (!cleanRecord || Object.keys(cleanRecord).length === 0) continue;
            
            // Validate required fields based on table
            if (!validateRecord(tableName, cleanRecord)) {
              console.warn(`Skipping invalid record in ${tableName}:`, cleanRecord);
              continue;
            }
            
            try {
              await ctx.db.insert(tableName as any, cleanRecord);
              insertedCount++;
              totalRestored++;
            } catch (insertError) {
              console.error(`Error inserting record in ${tableName}:`, insertError);
            }
          }
          
          results.push({ 
            table: tableName, 
            restored: insertedCount,
            total: records.length 
          });
        } catch (error) {
          console.error(`Error restoring ${tableName}:`, error);
          results.push({ 
            table: tableName, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return {
        success: true,
        message: `Data restored successfully from backup. Total records restored: ${totalRestored}`,
        results,
        metadata: backup.metadata,
        totalRestored
      };
    } catch (error) {
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Enhanced get restore statistics with detailed analysis
export const getRestoreStats = mutation({
  args: {
    backupData: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      const backup = JSON.parse(args.backupData);

      if (!backup.data) {
        throw new Error("Invalid backup format: missing data section");
      }

      const stats = {
        metadata: backup.metadata || {
          timestamp: "Unknown",
          version: "Unknown",
          appName: "Unknown",
          backupType: "Unknown",
          totalRecords: 0
        },
        statistics: backup.statistics || {},
        tables: {} as Record<string, number>,
        isValid: true,
        validationErrors: [] as string[]
      };

      let totalRecords = 0;

      // Count records in each table and validate structure
      for (const [tableName, records] of Object.entries(backup.data)) {
        if (Array.isArray(records)) {
          stats.tables[tableName] = records.length;
          totalRecords += records.length;

          // Validate a sample of records
          const sampleSize = Math.min(5, records.length);
          for (let i = 0; i < sampleSize; i++) {
            const record = records[i] as any;
            if (!validateRecord(tableName, record)) {
              stats.validationErrors.push(`Invalid record structure in ${tableName}`);
              break;
            }
          }
        }
      }

      // Update total records if not present in metadata
      if (!stats.metadata.totalRecords) {
        stats.metadata.totalRecords = totalRecords;
      }

      // Check if backup is compatible
      if (backup.metadata?.version && !isCompatibleVersion(backup.metadata.version)) {
        stats.isValid = false;
        stats.validationErrors.push(`Incompatible backup version: ${backup.metadata.version}`);
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to analyze backup: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Create comprehensive backup
export const createFullBackup = mutation({
  args: {
    includeProducts: v.optional(v.boolean()),
    includeCategories: v.optional(v.boolean()),
    includeCustomers: v.optional(v.boolean()),
    includeSales: v.optional(v.boolean()),
    includePurchases: v.optional(v.boolean()),
    includeSuppliers: v.optional(v.boolean()),
    includeStockMovements: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin role
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "admin") {
      throw new Error("Only administrators can create backups");
    }

    try {
      const backupData: any = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: "2.1",
          appName: "CELLO CITY POS",
          backupType: "full",
          totalRecords: 0,
          createdBy: userId,
        },
        data: {},
        statistics: {}
      };

      let totalRecords = 0;

      // Backup each table if requested
      if (args.includeProducts !== false) {
        const products = await ctx.db.query("products").collect();
        backupData.data.products = products;
        backupData.statistics.productsCount = products.length;
        totalRecords += products.length;
      }

      if (args.includeCategories !== false) {
        const categories = await ctx.db.query("categories").collect();
        backupData.data.categories = categories;
        backupData.statistics.categoriesCount = categories.length;
        totalRecords += categories.length;
      }

      if (args.includeCustomers !== false) {
        const customers = await ctx.db.query("customers").collect();
        backupData.data.customers = customers;
        backupData.statistics.customersCount = customers.length;
        totalRecords += customers.length;
      }

      if (args.includeSales !== false) {
        const sales = await ctx.db.query("sales").collect();
        backupData.data.sales = sales;
        backupData.statistics.salesCount = sales.length;
        totalRecords += sales.length;
      }

      if (args.includePurchases !== false) {
        const purchases = await ctx.db.query("purchases").collect();
        backupData.data.purchases = purchases;
        backupData.statistics.purchasesCount = purchases.length;
        totalRecords += purchases.length;
      }

      if (args.includeSuppliers !== false) {
        const suppliers = await ctx.db.query("suppliers").collect();
        backupData.data.suppliers = suppliers;
        backupData.statistics.suppliersCount = suppliers.length;
        totalRecords += suppliers.length;
      }

      if (args.includeStockMovements !== false) {
        const stockMovements = await ctx.db.query("stockMovements").collect();
        backupData.data.stockMovements = stockMovements;
        backupData.statistics.stockMovementsCount = stockMovements.length;
        totalRecords += stockMovements.length;
      }

      backupData.metadata.totalRecords = totalRecords;

      return {
        success: true,
        backupData: JSON.stringify(backupData, null, 2),
        statistics: backupData.statistics,
        totalRecords
      };
    } catch (error) {
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Clear specific table
export const clearTable = mutation({
  args: {
    tableName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has admin role
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userRole || userRole.role !== "admin") {
      throw new Error("Only administrators can clear tables");
    }

    // Prevent clearing critical tables
    const protectedTables = ["users", "authSessions", "authAccounts", "authVerificationCodes"];
    if (protectedTables.includes(args.tableName)) {
      throw new Error("Cannot clear protected system tables");
    }

    try {
      const records = await ctx.db.query(args.tableName as any).collect();
      let deletedCount = 0;
      
      for (const record of records) {
        await ctx.db.delete(record._id);
        deletedCount++;
      }

      return {
        success: true,
        message: `Cleared ${deletedCount} records from ${args.tableName}`,
        deletedCount
      };
    } catch (error) {
      throw new Error(`Failed to clear table ${args.tableName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Verify backup integrity
export const verifyBackupIntegrity = mutation({
  args: {
    backupData: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      const backup = JSON.parse(args.backupData);
      
      const integrity = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        summary: {
          totalTables: 0,
          totalRecords: 0,
          validTables: 0,
          invalidTables: 0
        }
      };

      // Check basic structure
      if (!backup.metadata) {
        integrity.errors.push("Missing metadata section");
        integrity.isValid = false;
      }

      if (!backup.data) {
        integrity.errors.push("Missing data section");
        integrity.isValid = false;
        return integrity;
      }

      // Validate each table
      for (const [tableName, records] of Object.entries(backup.data)) {
        integrity.summary.totalTables++;
        
        if (!Array.isArray(records)) {
          integrity.errors.push(`Table ${tableName} is not an array`);
          integrity.summary.invalidTables++;
          continue;
        }

        integrity.summary.totalRecords += records.length;
        
        // Validate sample records
        let validRecords = 0;
        const sampleSize = Math.min(10, records.length);
        
        for (let i = 0; i < sampleSize; i++) {
          const record = records[i] as any;
          if (validateRecord(tableName, record)) {
            validRecords++;
          }
        }

        if (validRecords === sampleSize) {
          integrity.summary.validTables++;
        } else {
          integrity.warnings.push(`Table ${tableName} has some invalid records`);
          integrity.summary.invalidTables++;
        }
      }

      return integrity;
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to parse backup: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        summary: { totalTables: 0, totalRecords: 0, validTables: 0, invalidTables: 0 }
      };
    }
  },
});

// Helper function to validate record structure
function validateRecord(tableName: string, record: any): boolean {
  if (!record || typeof record !== 'object') return false;

  switch (tableName) {
    case "products":
      return !!(record.name && record.brand && record.sku);
    case "categories":
      return !!(record.name);
    case "customers":
      return !!(record.name);
    case "suppliers":
      return !!(record.name);
    case "sales":
      return !!(record.items && Array.isArray(record.items));
    case "purchases":
      return !!(record.items && Array.isArray(record.items));
    case "stockMovements":
      return !!(record.productId && record.type);
    default:
      return true; // Allow unknown tables
  }
}

// Helper function to check version compatibility
function isCompatibleVersion(version: string): boolean {
  const supportedVersions = ["2.0", "2.1"];
  return supportedVersions.includes(version);
}
