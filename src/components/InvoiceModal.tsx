import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface InvoiceModalProps {
  isOpen: boolean;
  sale: any;
  customer: any;
  onClose: () => void;
}

export function InvoiceModal({ isOpen, sale, customer, onClose }: InvoiceModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // Safety check for sale object
  if (!isOpen || !sale) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6">
          <p className="text-red-600">Error: Sale data not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 print:hidden">
          <h2 className="text-xl font-bold text-gray-900">Invoice Receipt</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              {isPrinting ? "Preparing..." : "Print"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-6 print:p-4" id="invoice-content">
          {/* Company Header */}
          <div className="text-center mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-red-600 mb-2">CELLO CITY</h1>
            <p className="text-sm text-gray-600">Mobile Phone Shop</p>
            <p className="text-sm text-gray-600">123 Mobile Street, Tech City</p>
            <p className="text-sm text-gray-600">Phone: +1 (555) 123-4567</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Invoice Details</h3>
              <p className="text-sm text-gray-600">Invoice #: INV-{sale._id.slice(-8).toUpperCase()}</p>
              <p className="text-sm text-gray-600">Date: {formatDate(sale._creationTime)}</p>
              <p className="text-sm text-gray-600">Payment: {sale.paymentMethod || 'Cash'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Customer Details</h3>
              <p className="text-sm text-gray-600">Name: {sale.customerName || 'Walk-in Customer'}</p>
              {sale.customerPhone && (
                <p className="text-sm text-gray-600">Phone: {sale.customerPhone}</p>
              )}
              {sale.customerEmail && (
                <p className="text-sm text-gray-600">Email: {sale.customerEmail}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Items Purchased</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">IMEI</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-b">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase border-b">Price</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase border-b">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(sale.items || []).map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-sm text-gray-900 border-b">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.brand && (
                            <p className="text-xs text-gray-500">{item.brand} {item.model}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm font-mono text-gray-900 border-b">
                        {item.imei ? (
                          <div className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {item.imei}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-center text-gray-900 border-b">
                        {item.quantity || 0}
                      </td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900 border-b">
                        ৳{(item.price || 0).toLocaleString('en-BD')}
                      </td>
                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 border-b">
                        ৳{((item.price || 0) * (item.quantity || 0)).toLocaleString('en-BD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium">৳{(sale.subtotal || 0).toLocaleString('en-BD')}</span>
                </div>
                {(sale.discount || 0) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Discount:</span>
                    <span className="text-sm font-medium text-red-600">-৳{(sale.discount || 0).toLocaleString('en-BD')}</span>
                  </div>
                )}
                {(sale.tax || 0) > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="text-sm font-medium">৳{(sale.tax || 0).toLocaleString('en-BD')}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-red-600">৳{(sale.total || 0).toLocaleString('en-BD')}</span>
                </div>
                {sale.amountPaid && (
                  <>
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-gray-600">Amount Paid:</span>
                      <span className="text-sm font-medium">৳{(sale.amountPaid || 0).toLocaleString('en-BD')}</span>
                    </div>
                    {(sale.change || 0) > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Change:</span>
                        <span className="text-sm font-medium text-green-600">৳{(sale.change || 0).toLocaleString('en-BD')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* IMEI Summary */}
          {(sale.items || []).some((item: any) => item.imei) && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Device IMEI Numbers</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {(sale.items || [])
                  .filter((item: any) => item.imei)
                  .map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                      <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                        {item.imei}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>Thank you for your business!</p>
            <p>For support, please contact us at info@cellocity.com</p>
            <p className="mt-2">This is a computer-generated invoice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
