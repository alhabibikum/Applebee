import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get all products with optimized queries
    const products = await ctx.db.query("products").collect();
    const sales = await ctx.db.query("sales").collect();
    const customers = await ctx.db.query("customers").collect();

    // Separate new and used products - treat products without condition as "used" (existing products)
    const newProducts = products.filter(p => p.condition === "new");
    const usedProducts = products.filter(p => p.condition === "used" || !p.condition);

    // Calculate stock values
    const newProductsValue = newProducts.reduce((sum, product) => 
      sum + ((product.currentStock || 0) * product.costPrice), 0
    );
    const usedProductsValue = usedProducts.reduce((sum, product) => 
      sum + ((product.currentStock || 0) * product.costPrice), 0
    );

    // Calculate stock counts
    const newProductsStock = newProducts.reduce((sum, product) => sum + (product.currentStock || 0), 0);
    const usedProductsStock = usedProducts.reduce((sum, product) => sum + (product.currentStock || 0), 0);

    // Low stock alerts (separate for new and used)
    const newLowStockProducts = newProducts.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 0) && (p.currentStock || 0) > 0);
    const usedLowStockProducts = usedProducts.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 0) && (p.currentStock || 0) > 0);

    // Sales calculations
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todaySales = sales.filter(sale => sale._creationTime >= todayStart.getTime());
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

    // Calculate revenue by condition - treat items without condition as "used"
    const newPhoneRevenue = sales.reduce((sum, sale) => {
      const newPhoneItems = sale.items.filter(item => item.condition === "new");
      return sum + newPhoneItems.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
    }, 0);

    const usedPhoneRevenue = sales.reduce((sum, sale) => {
      const usedPhoneItems = sale.items.filter(item => item.condition === "used" || !item.condition);
      return sum + usedPhoneItems.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
    }, 0);

    // Recent sales with condition info
    const recentSales = await ctx.db
      .query("sales")
      .order("desc")
      .take(5);

    // Calculate profit margins
    const totalProfit = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        const product = products.find(p => p._id === item.productId);
        if (product) {
          const profit = (item.unitPrice - product.costPrice) * item.quantity;
          return itemSum + profit;
        }
        return itemSum;
      }, 0);
    }, 0);

    const todayProfit = todaySales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        const product = products.find(p => p._id === item.productId);
        if (product) {
          const profit = (item.unitPrice - product.costPrice) * item.quantity;
          return itemSum + profit;
        }
        return itemSum;
      }, 0);
    }, 0);

    return {
      totalProducts: products.length,
      newProducts: {
        count: newProducts.length,
        stock: newProductsStock,
        value: newProductsValue,
        revenue: newPhoneRevenue,
        lowStock: newLowStockProducts.length,
        lowStockProducts: newLowStockProducts.slice(0, 5)
      },
      usedProducts: {
        count: usedProducts.length,
        stock: usedProductsStock,
        value: usedProductsValue,
        revenue: usedPhoneRevenue,
        lowStock: usedLowStockProducts.length,
        lowStockProducts: usedLowStockProducts.slice(0, 5)
      },
      totalCustomers: customers.length,
      totalSales: sales.length,
      totalRevenue: totalSales,
      todayRevenue,
      todaySales: todaySales.length,
      recentSales,
      lowStockAlerts: newLowStockProducts.length + usedLowStockProducts.length,
      totalProfit,
      todayProfit,
      profitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
      todayProfitMargin: todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0
    };
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const stockMovements = await ctx.db
      .query("stockMovements")
      .order("desc")
      .take(10);

    const recentSales = await ctx.db
      .query("sales")
      .order("desc")
      .take(5);

    return {
      stockMovements,
      recentSales,
    };
  },
});

export const getSalesChart = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const sales = await ctx.db.query("sales").collect();
    
    // Group sales by date for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const chartData = last7Days.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const daySales = sales.filter(sale => 
        sale._creationTime >= date.getTime() && 
        sale._creationTime < nextDay.getTime()
      );

      // Calculate revenue by condition for each day - treat items without condition as "used"
      const newPhoneRevenue = daySales.reduce((sum, sale) => {
        const newPhoneItems = sale.items.filter(item => item.condition === "new");
        return sum + newPhoneItems.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
      }, 0);

      const usedPhoneRevenue = daySales.reduce((sum, sale) => {
        const usedPhoneItems = sale.items.filter(item => item.condition === "used" || !item.condition);
        return sum + usedPhoneItems.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
      }, 0);

      return {
        date: date.toLocaleDateString('en-BD'),
        total: daySales.reduce((sum, sale) => sum + sale.total, 0),
        newPhones: newPhoneRevenue,
        usedPhones: usedPhoneRevenue,
        count: daySales.length,
      };
    });

    return chartData;
  },
});

export const getTopSellingProducts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const sales = await ctx.db.query("sales").collect();
    const products = await ctx.db.query("products").collect();

    // Calculate product sales
    const productSales = new Map();
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productSales.get(item.productId) || { quantity: 0, revenue: 0 };
        productSales.set(item.productId, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.totalPrice,
          productName: item.productName,
          condition: item.condition || "used" // Treat items without condition as "used"
        });
      });
    });

    // Convert to array and sort by quantity
    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        ...data
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return topProducts;
  },
});

export const getMonthlyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const sales = await ctx.db.query("sales").collect();
    
    // Get current month data
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthSales = sales.filter(sale => 
      sale._creationTime >= currentMonthStart.getTime()
    );

    // Get previous month data
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const previousMonthSales = sales.filter(sale => 
      sale._creationTime >= previousMonthStart.getTime() && 
      sale._creationTime <= previousMonthEnd.getTime()
    );

    const currentMonthRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total, 0);
    const previousMonthRevenue = previousMonthSales.reduce((sum, sale) => sum + sale.total, 0);

    const revenueGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    return {
      currentMonth: {
        sales: currentMonthSales.length,
        revenue: currentMonthRevenue
      },
      previousMonth: {
        sales: previousMonthSales.length,
        revenue: previousMonthRevenue
      },
      growth: {
        sales: previousMonthSales.length > 0 
          ? ((currentMonthSales.length - previousMonthSales.length) / previousMonthSales.length) * 100 
          : 0,
        revenue: revenueGrowth
      }
    };
  },
});
