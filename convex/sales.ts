import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    customerId: v.optional(v.id("customers")),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitPrice: v.number(),
      imei: v.optional(v.string()),
    })),
    discount: v.number(),
    paymentMethod: v.string(),
    paymentDetails: v.optional(v.object({
      transactionId: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      reference: v.optional(v.string()),
      status: v.optional(v.string()),
    })),
    deliveryInfo: v.optional(v.object({
      type: v.string(),
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      charges: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    
    // Generate sale number
    const saleNumber = `SALE-${Date.now()}`;
    
    // Process items and calculate totals
    const processedItems = [];
    let subtotal = 0;
    
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      
      // Check stock availability
      if ((product.currentStock || 0) < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock || 0}`);
      }
      
      const totalPrice = item.quantity * item.unitPrice;
      processedItems.push({
        productId: item.productId,
        productName: product.name,
        condition: product.condition || "used", // Treat products without condition as "used"
        imei: item.imei,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      });
      
      subtotal += totalPrice;
      
      // Update product stock
      await ctx.db.patch(item.productId, {
        currentStock: (product.currentStock || 0) - item.quantity,
      });
      
      // Record stock movement
      await ctx.db.insert("stockMovements", {
        productId: item.productId,
        productName: product.name,
        condition: product.condition || "used", // Treat products without condition as "used"
        imei: item.imei,
        type: "out",
        quantity: item.quantity,
        reason: "Sale",
        reference: saleNumber,
        userId,
        userName: user.name || user.email || "Unknown",
        previousStock: product.currentStock || 0,
        newStock: (product.currentStock || 0) - item.quantity,
      });
    }
    
    const tax = subtotal * 0.0; // 0% VAT
    const deliveryCharges = args.deliveryInfo?.charges || 0;
    const total = subtotal + tax - args.discount + deliveryCharges;
    
    const saleId = await ctx.db.insert("sales", {
      saleNumber,
      customerId: args.customerId,
      customerName: args.customerName || "Walk-in Customer",
      customerPhone: args.customerPhone,
      items: processedItems,
      subtotal,
      tax,
      discount: args.discount,
      total,
      paymentMethod: args.paymentMethod,
      paymentDetails: args.paymentDetails,
      status: args.paymentMethod === "cod" ? "pending" : "completed",
      cashierId: userId,
      cashierName: user.name || user.email || "Unknown",
      deliveryInfo: args.deliveryInfo,
    });
    
    // Create transaction record for mobile banking
    if (["bkash", "nagad", "rocket", "upay"].includes(args.paymentMethod) && args.paymentDetails?.transactionId) {
      await ctx.db.insert("transactions", {
        saleId,
        saleNumber,
        transactionId: args.paymentDetails.transactionId,
        amount: total,
        paymentMethod: args.paymentMethod,
        status: "completed",
        customerId: args.customerId,
        customerName: args.customerName || "Walk-in Customer",
        cashierId: userId,
        cashierName: user.name || user.email || "Unknown",
      });
    }
    
    // Update customer if provided
    if (args.customerId) {
      const customer = await ctx.db.get(args.customerId);
      if (customer) {
        await ctx.db.patch(args.customerId, {
          totalPurchases: customer.totalPurchases + total,
          lastPurchaseDate: Date.now(),
        });
      }
    }
    
    return saleId;
  },
});

export const list = query({
  args: {
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let sales = await ctx.db.query("sales").order("desc").take(args.limit || 50);
    
    if (args.startDate && args.endDate) {
      sales = sales.filter(sale => 
        sale._creationTime >= args.startDate! &&
        sale._creationTime <= args.endDate!
      );
    }
    
    if (args.paymentMethod) {
      sales = sales.filter(sale => sale.paymentMethod === args.paymentMethod);
    }
    
    return sales;
  },
});

export const get = query({
  args: { id: v.id("sales") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getDailySummary = query({
  args: { date: v.number() },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const sales = await ctx.db
      .query("sales")
      .filter((q) => 
        q.gte(q.field("_creationTime"), startOfDay.getTime()) &&
        q.lte(q.field("_creationTime"), endOfDay.getTime())
      )
      .collect();
    
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    
    // Payment method breakdown
    const paymentBreakdown = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalSales,
      totalRevenue,
      totalItems,
      sales,
      paymentBreakdown,
    };
  },
});

export const getPaymentStats = query({
  args: {},
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    const sales = await ctx.db.query("sales").collect();
    
    const paymentStats = sales.reduce((acc, sale) => {
      const method = sale.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count += 1;
      acc[method].total += sale.total;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);
    
    return paymentStats;
  },
});

export const updateStatus = mutation({
  args: {
    saleId: v.id("sales"),
    status: v.union(v.literal("completed"), v.literal("refunded"), v.literal("cancelled"), v.literal("pending")),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    await ctx.db.patch(args.saleId, {
      status: args.status,
    });
    
    return args.saleId;
  },
});
