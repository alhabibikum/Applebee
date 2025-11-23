import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { InvoiceModal } from "./InvoiceModal";

export function Sales() {
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all"); // New filter for condition
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedIMEI, setSelectedIMEI] = useState("");

  const sales = useQuery(api.sales.list, {}) || [];
  const products = useQuery(api.products.list, {}) || [];

  // Get all unique IMEI numbers from sales
  const allIMEIs = Array.from(new Set(
    sales.flatMap(sale => 
      (sale.items || [])
        .filter((item: any) => item.imei)
        .map((item: any) => item.imei)
    )
  )).sort();

  const handleViewInvoice = (sale: any) => {
    setSelectedSale(sale);
    setShowInvoiceModal(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter sales based on search term, filter, date range, condition, and selected IMEI
  const filteredSales = sales.filter(sale => {
    const matchesSearch = !searchTerm || 
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.items || []).some((item: any) => 
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.imei?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesFilter = filterBy === "all" || sale.paymentMethod === filterBy;
    
    const matchesCondition = conditionFilter === "all" || 
      (sale.items || []).some((item: any) => (item.condition || "used") === conditionFilter);

    const matchesDateRange = (!dateRange.start || new Date(sale._creationTime) >= new Date(dateRange.start)) &&
                            (!dateRange.end || new Date(sale._creationTime) <= new Date(dateRange.end));

    const matchesIMEI = !selectedIMEI || 
      (sale.items || []).some((item: any) => item.imei === selectedIMEI);

    return matchesSearch && matchesFilter && matchesCondition && matchesDateRange && matchesIMEI;
  });

  // Separate new and used sales
  const newSales = filteredSales.filter(sale => 
    (sale.items || []).some((item: any) => (item.condition || "used") === "new")
  );
  
  const usedSales = filteredSales.filter(sale => 
    (sale.items || []).some((item: any) => (item.condition || "used") === "used")
  );

  // Calculate separate totals
  const newSalesRevenue = newSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const usedSalesRevenue = usedSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

  // Get sales history for selected IMEI
  const imeiSalesHistory = selectedIMEI ? 
    sales.filter(sale => 
      (sale.items || []).some((item: any) => item.imei === selectedIMEI)
    ).map(sale => ({
      ...sale,
      matchingItems: (sale.items || []).filter((item: any) => item.imei === selectedIMEI)
    })) : [];

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalSales = filteredSales.length;
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl lg:text-3xl font-bold text-teal-900">Sales Management</h1>
        <p className="text-teal-600 mt-2">Track and manage all sales transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">৳{totalRevenue.toLocaleString('en-BD')}</p>
            </div>
            <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">New Mobile Sales</p>
              <p className="text-2xl font-bold">{newSales.length}</p>
              <p className="text-xs text-blue-100">৳{newSalesRevenue.toLocaleString('en-BD')}</p>
            </div>
            <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Used Mobile Sales</p>
              <p className="text-2xl font-bold">{usedSales.length}</p>
              <p className="text-xs text-orange-100">৳{usedSalesRevenue.toLocaleString('en-BD')}</p>
            </div>
            <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Average Sale</p>
              <p className="text-2xl font-bold">৳{averageSale.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* IMEI Tracking Section */}
      <div className="bg-white rounded-xl shadow-sm border border-teal-200 p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-indigo-600 text-xl">🔍</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-teal-900">IMEI Tracking</h3>
            <p className="text-sm text-teal-600">Track sales history by device IMEI number</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IMEI Selection */}
          <div>
            <label className="block text-sm font-medium text-teal-700 mb-2">
              Select IMEI Number
            </label>
            <select
              value={selectedIMEI}
              onChange={(e) => setSelectedIMEI(e.target.value)}
              className="form-input"
            >
              <option value="">Select an IMEI to track...</option>
              {allIMEIs.map(imei => (
                <option key={imei} value={imei}>{imei}</option>
              ))}
            </select>
          </div>

          {/* IMEI Info */}
          {selectedIMEI && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h4 className="font-medium text-indigo-900 mb-2">IMEI: {selectedIMEI}</h4>
              <div className="text-sm text-indigo-700">
                <p>Total Sales: {imeiSalesHistory.length}</p>
                <p>Revenue: ৳{imeiSalesHistory.reduce((sum, sale) => 
                  sum + sale.matchingItems.reduce((itemSum: number, item: any) => 
                    itemSum + ((item.unitPrice || 0) * (item.quantity || 0)), 0), 0
                ).toLocaleString('en-BD')}</p>
              </div>
            </div>
          )}
        </div>

        {/* IMEI Sales History */}
        {selectedIMEI && imeiSalesHistory.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-teal-900 mb-3">Sales History for IMEI: {selectedIMEI}</h4>
            <div className="overflow-x-auto">
              <table className="w-full border border-teal-200 rounded-lg">
                <thead className="bg-teal-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-teal-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-teal-500 uppercase">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-teal-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-teal-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-teal-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-teal-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {imeiSalesHistory.map((sale) => (
                    <tr key={sale._id} className="hover:bg-teal-50">
                      <td className="px-4 py-3 text-sm text-teal-900">
                        {formatDate(sale._creationTime)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-teal-900">
                        INV-{sale._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-sm text-teal-900">
                        {sale.matchingItems.map((item: any, idx: number) => (
                          <div key={idx} className="mb-1">
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-xs text-teal-500">
                              IMEI: {item.imei} | Qty: {item.quantity} | ৳{item.unitPrice?.toLocaleString('en-BD')}
                            </div>
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-sm text-teal-900">
                        {sale.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-teal-900">
                        ৳{sale.matchingItems.reduce((sum: number, item: any) => 
                          sum + ((item.unitPrice || 0) * (item.quantity || 0)), 0
                        ).toLocaleString('en-BD')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewInvoice(sale)}
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                        >
                          View Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-teal-200 p-6">
        <h3 className="text-lg font-semibold text-teal-900 mb-4">Filter Sales</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-teal-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by customer, invoice, product, or IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-teal-700 mb-2">
              Mobile Condition
            </label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Conditions</option>
              <option value="new">New Mobiles</option>
              <option value="used">Used Mobiles</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-teal-700 mb-2">
              Payment Method
            </label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="form-input"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile Payment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-teal-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-teal-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-xl shadow-sm border border-teal-200">
        <div className="p-6 border-b border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-teal-900">
                {conditionFilter === "new" ? "New Mobile Sales" : 
                 conditionFilter === "used" ? "Used Mobile Sales" : "Recent Sales"}
              </h3>
              <p className="text-sm text-teal-600 mt-1">
                Showing {filteredSales.length} of {sales.length} sales
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-teal-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-teal-500 uppercase tracking-wider">
                  Date & Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-teal-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-teal-500 uppercase tracking-wider">
                  Items & IMEI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-teal-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-teal-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-teal-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale._id} className="hover:bg-teal-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-teal-900">
                        {formatDate(sale._creationTime)}
                      </div>
                      <div className="text-sm text-teal-500 font-mono">
                        INV-{sale._id.slice(-8).toUpperCase()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-teal-900">
                      {sale.customerName || 'Walk-in Customer'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-teal-900">
                      {(sale.items || []).map((item: any, index: number) => (
                        <div key={index} className="mb-2 last:mb-0">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium">{item.productName}</div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              (item.condition || "used") === "new" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {(item.condition || "used") === "new" ? "New" : "Used"}
                            </span>
                          </div>
                          <div className="text-xs text-teal-500">
                            Qty: {item.quantity} × ৳{(item.unitPrice || 0).toLocaleString('en-BD')}
                          </div>
                          {item.imei && (
                            <div className="text-xs font-mono bg-teal-100 px-2 py-1 rounded mt-1 inline-block">
                              IMEI: {item.imei}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {sale.paymentMethod || 'Cash'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-teal-900">
                      ৳{(sale.total || 0).toLocaleString('en-BD')}
                    </div>
                    {(sale.discount || 0) > 0 && (
                      <div className="text-xs text-amber-600">
                        Discount: ৳{(sale.discount || 0).toLocaleString('en-BD')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleViewInvoice(sale)}
                      className="text-amber-600 hover:text-red-900 text-sm font-medium"
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-teal-900 mb-2">No sales found</h3>
              <p className="text-teal-500">
                {searchTerm || filterBy !== "all" || conditionFilter !== "all" || dateRange.start || dateRange.end || selectedIMEI
                  ? "Try adjusting your filters to see more results."
                  : "No sales have been recorded yet."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedSale && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          sale={selectedSale}
          customer={null}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedSale(null);
          }}
        />
      )}
    </div>
  );
}
