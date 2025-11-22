import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    return await ctx.db.query("categories").collect();
  },
});

export const get = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    // Check if category name already exists
    const existing = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    if (existing) {
      throw new Error("A category with this name already exists");
    }
    
    return await ctx.db.insert("categories", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const { id, ...updates } = args;
    
    // Check if category name already exists (excluding current category)
    const existing = await ctx.db
      .query("categories")
      .filter((q) => q.and(
        q.eq(q.field("name"), args.name),
        q.neq(q.field("_id"), id)
      ))
      .first();
    
    if (existing) {
      throw new Error("A category with this name already exists");
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    // Check if category has any products
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .first();
    
    if (products) {
      throw new Error("Cannot delete category that contains products. Please move or delete all products in this category first.");
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const getProductCount = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
    
    return products.length;
  },
});
