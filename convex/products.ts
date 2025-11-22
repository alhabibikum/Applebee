import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    searchTerm: v.optional(v.string()),
    brand: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    includeOutOfStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let products = await ctx.db.query("products").collect();
    
    // Apply filters
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower)) ||
        (product.model && product.model.toLowerCase().includes(searchLower)) ||
        (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
        (product.imei && product.imei.includes(args.searchTerm!))
      );
    }
    
    if (args.brand) {
      products = products.filter(product => product.brand === args.brand);
    }
    
    if (args.categoryId) {
      products = products.filter(product => product.categoryId === args.categoryId);
    }
    
    if (!args.includeOutOfStock) {
      products = products.filter(product => (product.currentStock || 0) > 0);
    }
    
    return products.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getByImei = query({
  args: { imei: v.string() },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const product = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("imei"), args.imei))
      .first();
    
    return product;
  },
});

export const getBrands = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const products = await ctx.db.query("products").collect();
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return brands.sort();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    imei: v.string(),
    costPrice: v.number(),
    categoryId: v.id("categories"),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    sku: v.optional(v.string()),
    condition: v.optional(v.union(v.literal("new"), v.literal("used"))),
    sellingPrice: v.optional(v.number()),
    minStockLevel: v.optional(v.number()),
    unit: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    supplierName: v.optional(v.string()),
    supplierMobile: v.optional(v.string()),
    supplierNid: v.optional(v.string()),
    specifications: v.optional(v.object({
      memory: v.optional(v.object({
        ram: v.optional(v.string()),
        storage: v.optional(v.string()),
      })),
      battery: v.optional(v.object({
        capacity: v.optional(v.string()),
      })),
    })),
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
      batteryHealth: v.optional(v.number()),
      screenCondition: v.optional(v.union(
        v.literal("perfect"),
        v.literal("minor_scratches"),
        v.literal("major_scratches"),
        v.literal("cracked")
      )),
      accessories: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    // Check if IMEI already exists with stock > 0
    const existingProduct = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("imei"), args.imei))
      .first();
    
    if (existingProduct && (existingProduct.currentStock || 0) > 0) {
      throw new Error("A product with this IMEI already exists and is in stock");
    }
    
    // If product exists but stock is 0, we can add it again
    const productData = {
      ...args,
      currentStock: 1, // New product starts with 1 stock
      isActive: args.isActive ?? true,
      condition: args.condition || "new",
    };
    
    return await ctx.db.insert("products", productData);
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    imei: v.string(),
    costPrice: v.number(),
    categoryId: v.id("categories"),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    sku: v.optional(v.string()),
    condition: v.optional(v.union(v.literal("new"), v.literal("used"))),
    sellingPrice: v.optional(v.number()),
    minStockLevel: v.optional(v.number()),
    unit: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    supplierName: v.optional(v.string()),
    supplierMobile: v.optional(v.string()),
    supplierNid: v.optional(v.string()),
    specifications: v.optional(v.object({
      memory: v.optional(v.object({
        ram: v.optional(v.string()),
        storage: v.optional(v.string()),
      })),
      battery: v.optional(v.object({
        capacity: v.optional(v.string()),
      })),
    })),
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
      batteryHealth: v.optional(v.number()),
      screenCondition: v.optional(v.union(
        v.literal("perfect"),
        v.literal("minor_scratches"),
        v.literal("major_scratches"),
        v.literal("cracked")
      )),
      accessories: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const { id, ...updates } = args;
    
    // Check if IMEI is being changed and if it conflicts with another product
    const currentProduct = await ctx.db.get(id);
    if (!currentProduct) {
      throw new Error("Product not found");
    }
    
    if (args.imei !== currentProduct.imei) {
      const existingProduct = await ctx.db
        .query("products")
        .filter((q) => q.and(
          q.eq(q.field("imei"), args.imei),
          q.neq(q.field("_id"), id)
        ))
        .first();
      
      if (existingProduct && (existingProduct.currentStock || 0) > 0) {
        throw new Error("Another product with this IMEI already exists and is in stock");
      }
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("products"),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const updateStock = mutation({
  args: {
    id: v.id("products"),
    quantity: v.number(),
    operation: v.union(v.literal("add"), v.literal("subtract"), v.literal("set")),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const product = await ctx.db.get(args.id);
    if (!product) {
      throw new Error("Product not found");
    }
    
    let newStock = product.currentStock || 0;
    
    switch (args.operation) {
      case "add":
        newStock += args.quantity;
        break;
      case "subtract":
        newStock = Math.max(0, newStock - args.quantity);
        break;
      case "set":
        newStock = Math.max(0, args.quantity);
        break;
    }
    
    await ctx.db.patch(args.id, { currentStock: newStock });
    return newStock;
  },
});

export const sellProduct = mutation({
  args: {
    imei: v.string(),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const product = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("imei"), args.imei))
      .first();
    
    if (!product) {
      throw new Error("Product with this IMEI not found");
    }
    
    const currentStock = product.currentStock || 0;
    const quantityToSell = args.quantity || 1;
    
    if (currentStock < quantityToSell) {
      throw new Error("Insufficient stock for this product");
    }
    
    const newStock = currentStock - quantityToSell;
    await ctx.db.patch(product._id, { currentStock: newStock });
    
    return {
      productId: product._id,
      product: product,
      newStock: newStock,
      soldQuantity: quantityToSell
    };
  },
});
