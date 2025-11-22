import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    supplierId: v.optional(v.id("suppliers")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let purchases;
    
    if (args.supplierId) {
      purchases = await ctx.db
        .query("purchases")
        .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      purchases = await ctx.db
        .query("purchases")
        .order("desc")
        .take(args.limit || 50);
    }
    
    if (args.status) {
      purchases = purchases.filter(purchase => purchase.status === args.status);
    }
    
    return purchases;
  },
});

export const get = query({
  args: { id: v.id("purchases") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    supplierId: v.id("suppliers"),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitCost: v.number(),
      imeiNumbers: v.optional(v.array(v.string())),
    })),
    tax: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new Error("Supplier not found");
    
    // Generate purchase number
    const purchaseNumber = `PO-${Date.now()}`;
    
    // Process items and calculate totals
    const processedItems = [];
    let subtotal = 0;
    
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      
      const totalCost = item.quantity * item.unitCost;
      processedItems.push({
        productId: item.productId,
        productName: product.name,
        condition: product.condition || "new",
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost,
      });
      
      subtotal += totalCost;
    }
    
    const total = subtotal + args.tax;
    
    const purchaseId = await ctx.db.insert("purchases", {
      purchaseNumber,
      supplierId: args.supplierId,
      supplierName: supplier.name,
      items: processedItems,
      subtotal,
      tax: args.tax,
      total,
      status: "pending",
      orderDate: Date.now(),
      userId,
      userName: user.name || user.email || "Unknown",
    });
    
    return purchaseId;
  },
});

export const receive = mutation({
  args: {
    purchaseId: v.id("purchases"),
    receivedItems: v.array(v.object({
      productId: v.id("products"),
      receivedQuantity: v.number(),
      imeiNumbers: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const user = await ctx.db.get(userId);
    const purchase = await ctx.db.get(args.purchaseId);
    
    if (!purchase || !user) throw new Error("Purchase or user not found");
    
    if (purchase.status !== "pending") {
      throw new Error("Purchase order is not pending");
    }
    
    // Update stock for received items
    for (const receivedItem of args.receivedItems) {
      const product = await ctx.db.get(receivedItem.productId);
      if (!product) continue;
      
      const newStock = (product.currentStock || 0) + receivedItem.receivedQuantity;
      
      await ctx.db.patch(receivedItem.productId, {
        currentStock: newStock,
      });
      
      // Record stock movement with IMEI tracking
      if (receivedItem.imeiNumbers && receivedItem.imeiNumbers.length > 0) {
        for (const imei of receivedItem.imeiNumbers) {
          await ctx.db.insert("stockMovements", {
            productId: receivedItem.productId,
            productName: product.name,
            condition: product.condition || "new",
            imei,
            type: "in",
            quantity: 1,
            reason: "Purchase received",
            reference: purchase.purchaseNumber,
            userId,
            userName: user.name || user.email || "Unknown",
            previousStock: product.currentStock || 0,
            newStock,
          });
        }
      } else {
        await ctx.db.insert("stockMovements", {
        productId: receivedItem.productId,
        productName: product.name,
        condition: product.condition || "new",
        type: "in",
        quantity: receivedItem.receivedQuantity,
        reason: "Purchase received",
        reference: purchase.purchaseNumber,
        userId,
        userName: user.name || user.email || "Unknown",
        previousStock: product.currentStock || 0,
        newStock,
      });
      }
    }
    
    // Update purchase status
    await ctx.db.patch(args.purchaseId, {
      status: "received",
      receivedDate: Date.now(),
    });
    
    return args.purchaseId;
  },
});

export const cancel = mutation({
  args: { id: v.id("purchases") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const purchase = await ctx.db.get(args.id);
    if (!purchase) throw new Error("Purchase not found");
    
    if (purchase.status !== "pending") {
      throw new Error("Can only cancel pending purchases");
    }
    
    await ctx.db.patch(args.id, {
      status: "cancelled",
    });
    
    return args.id;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const purchases = await ctx.db.query("purchases").collect();
    
    const pendingPurchases = purchases.filter(p => p.status === "pending");
    const receivedPurchases = purchases.filter(p => p.status === "received");
    
    const totalPurchaseValue = receivedPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
    const pendingValue = pendingPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
    
    return {
      totalPurchases: purchases.length,
      pendingPurchases: pendingPurchases.length,
      receivedPurchases: receivedPurchases.length,
      totalPurchaseValue,
      pendingValue,
    };
  },
});
