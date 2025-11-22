import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { searchTerm: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let suppliers = await ctx.db.query("suppliers").collect();
    
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      suppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchLower) ||
        (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchLower)) ||
        (supplier.phone && supplier.phone.includes(args.searchTerm!)) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchLower))
      );
    }
    
    return suppliers;
  },
});

export const get = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db.insert("suppliers", {
      ...args,
      isActive: args.isActive ?? true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("suppliers"),
    name: v.string(),
    contactPerson: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    // Check if supplier has pending purchases
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.id))
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .collect();
    
    if (purchases.length > 0) {
      throw new Error("Cannot delete supplier with existing purchase orders");
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});
