import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Reports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const dailySummary = useQuery(api.sales.getDailySummary, {
    date: new Date(selectedDate).getTime()
  });
  
  const stats = useQuery(api.dashboard.getStats);

  if (!dailySummary || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-teal-900">Reports & Analytics</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm w-full sm:w-auto"
        />
      </div>

      {/* Daily Summary - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-teal-200">
        <h3 className="text-base sm:text-lg font-semibold text-teal-900 mb-4">
          Daily Summary - {new Date(selectedDate).toLocaleDateString('en-BD')}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-amber-600">{dailySummary.totalSales}</p>
            <p className="text-sm text-teal-500 mt-1">Total Sales</p>
          </div>
          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">৳{dailySummary.totalRevenue.toLocaleString('en-BD')}</p>
            <p className="text-sm text-teal-500 mt-1">Revenue</p>
          </div>
          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{dailySummary.totalItems}</p>
            <p className="text-sm text-teal-500 mt-1">Items Sold</p>
          </div>
        </div>
      </div>

      {/* New vs Used Mobile Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* New Mobile Statistics */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-teal-200">
          <h3 className="text-base sm:text-lg font-semibold text-teal-900 mb-4 flex items-center">
            <span className="mr-2">📱</span>
            New Mobile Phones
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.newProducts.count}</p>
              <p className="text-xs sm:text-sm text-teal-500 mt-1">Total Products</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.newProducts.stock}</p>
              <p className="text-xs sm:text-sm text-teal-500 mt-1">Current Stock</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-lg sm:text-xl font-bold text-green-600">৳{stats.newProducts.value.toLocaleString('en-BD')}</p>
              <p className="text-xs sm:text-sm text-teal-500 mt-1">Investment Value</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-lg sm:text-xl font-bold text-green-600">৳{stats.newProducts.revenue.toLocaleString('en-BD')}</p>
              <p className="text-xs sm:text-sm text-teal-500 mt-1">Total Revenue</p>
            </div>
          </div>
          
          {stats.newProducts.lowStock > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <span className="font-medium">{stats.newProducts.lowStock}</span> new products are low in stock
              </p>
            </div>
          )}
        </div>

        {/* Used Mobile Statistics */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-teal-200">
          <h3 className="text-base sm:text-lg font-semibold text-teal-900 mb-4 flex items-center">
            <span className="mr-2">📱</span>
            Used Mobile Phones
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.usedProducts.count}</p>
              <p className="text-xs sm:text-sm text-teal-500 mt-1">Total Products</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.usedProducts.stock}</p>
              <p className="text-xs sm:text-sm text-teal-500 mt-1">Current Stock</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-lg sm:text-xl font-bold text-orange-600">৳{stats.usedProducts.value.toLocaleString('en-BD')}</p>
              <p className="text-xs sm:text-sm text-teal-500 mt-1">Investment Value</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-lg sm:text-xl font-bold text-orange-600">৳{stats.usedProducts.revenue.toLocaleString('en-BD')}</p>
              <p className="text-xs sm:text-sm text-teal-500 mt-1">Total Revenue</p>
            </div>
          </div>
          
          {stats.usedProducts.lowStock > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <span className="font-medium">{stats.usedProducts.lowStock}</span> used products are low in stock
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Overall Statistics - Mobile Grid */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-teal-200">
        <h3 className="text-base sm:text-lg font-semibold text-teal-900 mb-4">Overall Business Statistics</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center p-3 sm:p-4 bg-teal-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-amber-600">{stats.totalProducts}</p>
            <p className="text-xs sm:text-sm text-teal-500 mt-1">Total Products</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-teal-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.newProducts.count + stats.usedProducts.count}</p>
            <p className="text-xs sm:text-sm text-teal-500 mt-1">Product Types</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-teal-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.totalCustomers}</p>
            <p className="text-xs sm:text-sm text-teal-500 mt-1">Customers</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-teal-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-amber-600">{stats.lowStockAlerts}</p>
            <p className="text-xs sm:text-sm text-teal-500 mt-1">Low Stock Items</p>
          </div>
        </div>
      </div>

      {/* Investment Analysis - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-teal-200">
        <h3 className="text-base sm:text-lg font-semibold text-teal-900 mb-4">Investment & Revenue Analysis</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600">৳{(stats.newProducts.value + stats.usedProducts.value).toLocaleString('en-BD')}</p>
            <p className="text-sm text-teal-500 mt-1">Total Investment</p>
            <div className="mt-2 text-xs text-gray-400">
              <div>New: ৳{stats.newProducts.value.toLocaleString('en-BD')}</div>
              <div>Used: ৳{stats.usedProducts.value.toLocaleString('en-BD')}</div>
            </div>
          </div>
          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">৳{(stats.newProducts.revenue + stats.usedProducts.revenue).toLocaleString('en-BD')}</p>
            <p className="text-sm text-teal-500 mt-1">Total Revenue</p>
            <div className="mt-2 text-xs text-gray-400">
              <div>New: ৳{stats.newProducts.revenue.toLocaleString('en-BD')}</div>
              <div>Used: ৳{stats.usedProducts.revenue.toLocaleString('en-BD')}</div>
            </div>
          </div>
          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">
              ৳{stats.totalRevenue > 0 ? Math.round(stats.totalRevenue / stats.totalSales) : 0}
            </p>
            <p className="text-sm text-teal-500 mt-1">Average Sale Value</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alert - Mobile Cards */}
      {(stats.newProducts.lowStockProducts.length + stats.usedProducts.lowStockProducts.length) > 0 && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-teal-200">
          <h3 className="text-base sm:text-lg font-semibold text-teal-900 mb-4 flex items-center">
            <span className="mr-2">⚠️</span>
            Low Stock Alert
          </h3>
          
          <div className="space-y-3">
            {/* New Products Low Stock */}
            {stats.newProducts.lowStockProducts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2">📱 New Mobile Phones</h4>
                {stats.newProducts.lowStockProducts.map((product: any) => (
                  <div key={product._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-green-100 rounded-lg bg-green-50 space-y-2 sm:space-y-0 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-teal-900 text-sm">{product.name}</p>
                      <p className="text-xs sm:text-sm text-teal-500">SKU: {product.sku}</p>
                    </div>
                    <div className="flex justify-between sm:block sm:text-right">
                      <div>
                        <p className="font-medium text-green-600 text-sm">{product.currentStock} {product.unit}</p>
                        <p className="text-xs text-teal-500">Min: {product.minStockLevel}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Used Products Low Stock */}
            {stats.usedProducts.lowStockProducts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-orange-700 mb-2">📱 Used Mobile Phones</h4>
                {stats.usedProducts.lowStockProducts.map((product: any) => (
                  <div key={product._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-orange-100 rounded-lg bg-orange-50 space-y-2 sm:space-y-0 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-teal-900 text-sm">{product.name}</p>
                      <p className="text-xs sm:text-sm text-teal-500">SKU: {product.sku}</p>
                    </div>
                    <div className="flex justify-between sm:block sm:text-right">
                      <div>
                        <p className="font-medium text-orange-600 text-sm">{product.currentStock} {product.unit}</p>
                        <p className="text-xs text-teal-500">Min: {product.minStockLevel}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
