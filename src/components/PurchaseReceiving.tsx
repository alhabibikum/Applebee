import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function PurchaseReceiving() {
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [receivingItems, setReceivingItems] = useState<any[]>([]);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const pendingPurchases = useQuery(api.purchases.list, { status: "pending" });
  const receivePurchase = useMutation(api.purchases.receive);

  if (!pendingPurchases) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const handleReceivePurchase = (purchase: any) => {
    setSelectedPurchase(purchase);
    setReceivingItems(
      purchase.items.map((item: any) => ({
        ...item,
        receivedQuantity: item.quantity,
        imeiNumbers: item.imeiNumbers || [],
        newImeiNumbers: Array(item.quantity).fill(""),
      }))
    );
    setShowReceiveModal(true);
  };

  const handleSubmitReceiving = async () => {
    try {
      const receivedItems = receivingItems.map((item) => ({
        productId: item.productId,
        receivedQuantity: item.receivedQuantity,
        imeiNumbers: item.newImeiNumbers.filter((imei: string) => imei.trim() !== ""),
      }));

      await receivePurchase({
        purchaseId: selectedPurchase._id,
        receivedItems,
      });

      toast.success("Purchase received successfully!");
      setShowReceiveModal(false);
      setSelectedPurchase(null);
      setReceivingItems([]);
    } catch (error) {
      toast.error("Failed to receive purchase: " + (error as Error).message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Purchase Receiving</h2>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {pendingPurchases.map((purchase) => (
          <div key={purchase._id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{purchase.purchaseNumber}</h3>
                <p className="text-xs text-gray-600">{purchase.supplierName}</p>
              </div>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                Pending
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <p className="text-gray-500">Items</p>
                <p className="font-medium">{purchase.items.length} items</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-semibold text-red-600">৳{purchase.total.toLocaleString('en-BD')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{new Date(purchase._creationTime).toLocaleDateString('en-BD')}</p>
              </div>
            </div>
            
            <button
              onClick={() => handleReceivePurchase(purchase)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Receive Purchase
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Purchase Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingPurchases.map((purchase) => (
                <tr key={purchase._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {purchase.purchaseNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.supplierName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ৳{purchase.total.toLocaleString('en-BD')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(purchase._creationTime).toLocaleDateString('en-BD')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleReceivePurchase(purchase)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Receive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Purchase Modal - Mobile Responsive */}
      {showReceiveModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Receive Purchase - {selectedPurchase.purchaseNumber}
            </h3>
            
            <div className="space-y-4">
              {receivingItems.map((item, index) => (
                <div key={item.productId} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">{item.productName}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Ordered: {item.quantity} units</p>
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Received Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={item.receivedQuantity}
                        onChange={(e) => {
                          const newQuantity = Number(e.target.value);
                          const updatedItems = [...receivingItems];
                          updatedItems[index].receivedQuantity = newQuantity;
                          updatedItems[index].newImeiNumbers = Array(newQuantity).fill("");
                          setReceivingItems(updatedItems);
                        }}
                        className="w-full sm:w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* IMEI Numbers Input - Mobile Responsive */}
                  {item.receivedQuantity > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IMEI Numbers (For Mobile Phones)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Array.from({ length: item.receivedQuantity }).map((_, imeiIndex) => (
                          <input
                            key={imeiIndex}
                            type="text"
                            placeholder={`IMEI ${imeiIndex + 1} (optional)`}
                            value={item.newImeiNumbers[imeiIndex] || ""}
                            onChange={(e) => {
                              const updatedItems = [...receivingItems];
                              updatedItems[index].newImeiNumbers[imeiIndex] = e.target.value;
                              setReceivingItems(updatedItems);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-6">
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReceiving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Receive Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
