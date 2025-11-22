import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { searchTerm: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let customers = await ctx.db.query("customers").collect();
    
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      customers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.includes(args.searchTerm!)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower))
      );
    }
    
    return customers;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db.insert("customers", {
      ...args,
      totalPurchases: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("customers"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("customers"),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});
