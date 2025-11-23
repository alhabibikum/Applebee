import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface DashboardProps {
  onNavigate: (section: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const stats = useQuery(api.dashboard.getStats);
  const recentActivity = useQuery(api.dashboard.getRecentActivity);
  const salesChart = useQuery(api.dashboard.getSalesChart);
  const topProducts = useQuery(api.dashboard.getTopSellingProducts);
  const monthlyStats = useQuery(api.dashboard.getMonthlyStats);

  if (!stats || !recentActivity || !salesChart) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-teal-900">Dashboard</h1>
          <p className="text-teal-600 mt-1">Welcome to Cello City Mobile Shop Management</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => onNavigate("regular-pos")}
            className="btn-primary"
          >
            🛒 New Sale
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 text-white card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-green-100 text-xs font-medium truncate">Revenue</p>
              <p className="text-sm sm:text-2xl font-bold truncate">{formatCurrency(stats.totalRevenue)}</p>
              <div className="hidden sm:flex items-center space-x-2 mt-1">
                <p className="text-green-100 text-xs">Profit: {formatCurrency(stats.totalProfit)}</p>
                <span className="text-green-200 text-xs">
                  ({stats.profitMargin.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-base sm:text-xl">💰</span>
            </div>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 text-white card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-teal-100 text-xs font-medium truncate">Today</p>
              <p className="text-sm sm:text-2xl font-bold truncate">{formatCurrency(stats.todayRevenue)}</p>
              <div className="hidden sm:flex items-center space-x-2 mt-1">
                <p className="text-teal-100 text-xs">{stats.todaySales} sales</p>
                <span className="text-teal-200 text-xs">
                  Profit: {formatCurrency(stats.todayProfit)}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-teal-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-base sm:text-xl">📈</span>
            </div>
          </div>
        </div>

        {/* Monthly Growth */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 text-white card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-purple-100 text-xs font-medium truncate">Growth</p>
              <p className="text-sm sm:text-2xl font-bold truncate">
                {monthlyStats ? formatPercentage(monthlyStats.growth.revenue) : '0%'}
              </p>
              <p className="hidden sm:block text-purple-100 text-xs mt-1 truncate">
                vs last month
              </p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-base sm:text-xl">📊</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 text-white card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-amber-100 text-xs font-medium truncate">Stock</p>
              <p className="text-sm sm:text-2xl font-bold truncate">{stats.lowStockAlerts}</p>
              <p className="hidden sm:block text-amber-100 text-xs mt-1 truncate">Restock needed</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-base sm:text-xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      {/* New vs Used Products Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Products Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-teal-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-teal-900">New Mobile Phones</h3>
            <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              📱 New Stock
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{stats.newProducts.count}</p>
              <p className="text-sm text-teal-600">Products</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{stats.newProducts.stock}</p>
              <p className="text-sm text-teal-600">Total Stock</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-xl font-bold text-teal-600">{formatCurrency(stats.newProducts.value)}</p>
              <p className="text-sm text-teal-600">Investment Value</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-xl font-bold text-teal-600">{formatCurrency(stats.newProducts.revenue)}</p>
              <p className="text-sm text-teal-600">Total Revenue</p>
            </div>
          </div>
          {stats.newProducts.lowStock > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <span className="font-medium">{stats.newProducts.lowStock}</span> new products are low in stock
              </p>
            </div>
          )}
        </div>

        {/* Used Products Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-900">Used Mobile Phones</h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              📱 Used Stock
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{stats.usedProducts.count}</p>
              <p className="text-sm text-amber-600">Products</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{stats.usedProducts.stock}</p>
              <p className="text-sm text-amber-600">Total Stock</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.usedProducts.value)}</p>
              <p className="text-sm text-amber-600">Investment Value</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.usedProducts.revenue)}</p>
              <p className="text-sm text-amber-600">Total Revenue</p>
            </div>
          </div>
          {stats.usedProducts.lowStock > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <span className="font-medium">{stats.usedProducts.lowStock}</span> used products are low in stock
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sales Chart and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-teal-200 p-6">
          <h3 className="text-lg font-semibold text-teal-900 mb-4">Sales Overview (Last 7 Days)</h3>
          <div className="space-y-4">
            {salesChart.map((day, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-20 text-sm text-teal-600">{day.date}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="text-sm font-medium text-teal-900">{formatCurrency(day.total)}</div>
                    <div className="text-xs text-teal-500">({day.count} sales)</div>
                  </div>
                  <div className="w-full bg-teal-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-amber-500 h-2 rounded-full"
                      style={{ width: `${Math.min((day.total / Math.max(...salesChart.map(d => d.total))) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-teal-500 mt-1">
                    <span>📱 New: {formatCurrency(day.newPhones)}</span>
                    <span>📱 Used: {formatCurrency(day.usedPhones)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-900">Top Selling Products</h3>
            <button
              onClick={() => onNavigate("reports")}
              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
            >
              View Reports →
            </button>
          </div>
          <div className="space-y-3">
            {topProducts?.slice(0, 5).map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-amber-900 text-sm">{product.productName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      product.condition === "new" 
                        ? "bg-teal-100 text-teal-800" 
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {product.condition}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-amber-900 text-sm">{product.quantity} sold</p>
                  <p className="text-xs text-amber-500">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
            {(!topProducts || topProducts.length === 0) && (
              <div className="text-center py-4">
                <p className="text-amber-500 text-sm">No sales data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-teal-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-teal-900">Recent Sales</h3>
            <button
              onClick={() => onNavigate("sales")}
              className="text-teal-600 hover:text-teal-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {stats.recentSales.map((sale) => (
              <div key={sale._id} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                <div>
                  <p className="font-medium text-teal-900">#{sale.saleNumber}</p>
                  <p className="text-sm text-teal-600">{sale.customerName || "Walk-in Customer"}</p>
                  <div className="flex space-x-2 mt-1">
                    {sale.items.map((item, idx) => (
                      <span 
                        key={idx}
                        className={`text-xs px-2 py-1 rounded-full ${
                          (item.condition || "new") === "new" 
                            ? "bg-teal-100 text-teal-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        📱 {item.condition || "new"}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-teal-900">{formatCurrency(sale.total)}</p>
                  <p className="text-xs text-teal-500">
                    {new Date(sale._creationTime).toLocaleDateString('en-BD')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-900">Low Stock Alert</h3>
            <button
              onClick={() => onNavigate("inventory")}
              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
            >
              View Inventory →
            </button>
          </div>
          <div className="space-y-3">
            {[...stats.newProducts.lowStockProducts, ...stats.usedProducts.lowStockProducts].map((product) => (
              <div key={product._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div>
                  <p className="font-medium text-amber-900">{product.name}</p>
                  <p className="text-sm text-amber-600">{product.brand}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.condition === "new" 
                      ? "bg-teal-100 text-teal-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    📱 {product.condition}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-amber-600">{product.currentStock}</p>
                  <p className="text-xs text-amber-500">Min: {product.minStockLevel}</p>
                </div>
              </div>
            ))}
            {stats.lowStockAlerts === 0 && (
              <div className="text-center py-4">
                <div className="text-teal-500 text-4xl mb-2">✅</div>
                <p className="text-teal-600">All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
