import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User roles and permissions
  userRoles: defineTable({
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"), 
      v.literal("cashier"),
      v.literal("viewer")
    ),
    permissions: v.array(v.string()),
    isActive: v.boolean(),
    assignedBy: v.id("users"),
    assignedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_role", ["role"]),

  // User profiles with additional information
  userProfiles: defineTable({
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    hireDate: v.optional(v.string()),
    department: v.optional(v.string()),
    salary: v.optional(v.number()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    })),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()),
    createdBy: v.id("users"),
  }).index("by_user", ["userId"])
    .index("by_phone", ["phone"]),

  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  }),

  products: defineTable({
    name: v.string(),
    imei: v.string(),
    costPrice: v.number(),
    categoryId: v.id("categories"),
    // Optional fields
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    description: v.optional(v.string()),
    sku: v.optional(v.string()),
    barcode: v.optional(v.string()),
    // Phone condition: "new" or "used" - optional for migration
    condition: v.optional(v.union(v.literal("new"), v.literal("used"))),
    sellingPrice: v.optional(v.number()),
    minStockLevel: v.optional(v.number()),
    currentStock: v.optional(v.number()),
    unit: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    supplierName: v.optional(v.string()),
    supplierMobile: v.optional(v.string()),
    supplierNid: v.optional(v.string()),
    // Used phone specific fields
    usedPhoneDetails: v.optional(v.object({
      previousOwner: v.optional(v.string()),
      purchaseDate: v.optional(v.string()),
      purchasePrice: v.optional(v.number()),
      conditionNotes: v.optional(v.string()),
      functionalIssues: v.optional(v.array(v.string())),
      cosmeticCondition: v.optional(v.union(
        v.literal("excellent"),
        v.literal("good"),
        v.literal("fair"),
        v.literal("poor")
      )),
      batteryHealth: v.optional(v.number()), // percentage
      screenCondition: v.optional(v.union(
        v.literal("perfect"),
        v.literal("minor_scratches"),
        v.literal("major_scratches"),
        v.literal("cracked")
      )),
      accessories: v.optional(v.array(v.string())), // charger, box, etc.
    })),
    specifications: v.optional(v.object({
      display: v.optional(v.object({
        size: v.optional(v.string()),
        resolution: v.optional(v.string()),
        type: v.optional(v.string()),
      })),
      processor: v.optional(v.object({
        chipset: v.optional(v.string()),
        cpu: v.optional(v.string()),
        gpu: v.optional(v.string()),
      })),
      memory: v.optional(v.object({
        ram: v.optional(v.string()),
        storage: v.optional(v.string()),
        expandable: v.optional(v.boolean()),
      })),
      camera: v.optional(v.object({
        rear: v.optional(v.string()),
        front: v.optional(v.string()),
        features: v.optional(v.array(v.string())),
      })),
      battery: v.optional(v.object({
        capacity: v.optional(v.string()),
        charging: v.optional(v.string()),
        wireless: v.optional(v.boolean()),
      })),
      connectivity: v.optional(v.object({
        network: v.optional(v.string()),
        wifi: v.optional(v.string()),
        bluetooth: v.optional(v.string()),
        nfc: v.optional(v.boolean()),
      })),
      physical: v.optional(v.object({
        dimensions: v.optional(v.string()),
        weight: v.optional(v.string()),
        colors: v.optional(v.array(v.string())),
        waterproof: v.optional(v.string()),
      })),
      os: v.optional(v.object({
        name: v.optional(v.string()),
        version: v.optional(v.string()),
      })),
    })),
    warranty: v.optional(v.object({
      duration: v.optional(v.string()),
      type: v.optional(v.string()),
    })),
  })
    .index("by_category", ["categoryId"])
    .index("by_sku", ["sku"])
    .index("by_barcode", ["barcode"])
    .index("by_imei", ["imei"])
    .index("by_brand", ["brand"])
    .index("by_condition", ["condition"])
    .index("by_condition_and_category", ["condition", "categoryId"]),

  stockMovements: defineTable({
    productId: v.id("products"),
    productName: v.string(),
    imei: v.optional(v.string()),
    condition: v.optional(v.union(v.literal("new"), v.literal("used"))),
    type: v.union(v.literal("in"), v.literal("out")),
    quantity: v.number(),
    reason: v.string(),
    userId: v.id("users"),
    userName: v.string(),
    previousStock: v.number(),
    newStock: v.number(),
    reference: v.optional(v.string()),
  }).index("by_product", ["productId"]),

  customers: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    notes: v.optional(v.string()),
    totalPurchases: v.number(),
    lastPurchaseDate: v.optional(v.number()),
  })
    .index("by_phone", ["phone"])
    .index("by_email", ["email"]),

  sales: defineTable({
    saleNumber: v.string(),
    customerId: v.optional(v.id("customers")),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      condition: v.optional(v.union(v.literal("new"), v.literal("used"))),
      imei: v.optional(v.string()),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
    })),
    subtotal: v.number(),
    discount: v.number(),
    tax: v.number(),
    total: v.number(),
    paymentMethod: v.string(),
    paymentDetails: v.optional(v.object({
      transactionId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      reference: v.optional(v.string()),
      status: v.optional(v.string()),
      cardLast4: v.optional(v.string()),
      bankName: v.optional(v.string()),
    })),
    deliveryInfo: v.optional(v.object({
      type: v.string(),
      address: v.optional(v.string()),
      charges: v.optional(v.number()),
      phone: v.optional(v.string()),
    })),
    cashierId: v.id("users"),
    cashierName: v.string(),
    status: v.union(v.literal("completed"), v.literal("refunded"), v.literal("cancelled"), v.literal("pending")),
  })
    .index("by_customer", ["customerId"])
    .index("by_cashier", ["cashierId"])
    .index("by_sale_number", ["saleNumber"]),

  transactions: defineTable({
    saleId: v.id("sales"),
    saleNumber: v.string(),
    transactionId: v.string(),
    amount: v.number(),
    paymentMethod: v.string(),
    status: v.string(),
    customerId: v.optional(v.id("customers")),
    customerName: v.optional(v.string()),
    cashierId: v.id("users"),
    cashierName: v.string(),
  })
    .index("by_sale", ["saleId"])
    .index("by_customer", ["customerId"])
    .index("by_cashier", ["cashierId"]),

  suppliers: defineTable({
    name: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  }),

  purchases: defineTable({
    purchaseNumber: v.string(),
    supplierId: v.id("suppliers"),
    supplierName: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      condition: v.optional(v.union(v.literal("new"), v.literal("used"))),
      quantity: v.number(),
      unitCost: v.number(),
      totalCost: v.number(),
    })),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    status: v.union(v.literal("pending"), v.literal("received"), v.literal("cancelled")),
    orderDate: v.optional(v.number()),
    expectedDate: v.optional(v.number()),
    receivedDate: v.optional(v.number()),
    userId: v.id("users"),
    userName: v.string(),
    notes: v.optional(v.string()),
  })
    .index("by_supplier", ["supplierId"])
    .index("by_user", ["userId"])
    .index("by_purchase_number", ["purchaseNumber"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
