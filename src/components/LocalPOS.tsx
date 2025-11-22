import { useState, useEffect } from "react";
import { localDB } from "../lib/localDatabase";
import { syncManager } from "../lib/syncManager";
import { useLocalProductByIMEI, useLocalCustomerQuery } from "../hooks/useLocalQuery";
import { useCustomers, useSales } from "../hooks/useLocalDatabase";
import { InvoiceModal } from "./InvoiceModal";

interface CartItem {
  product: any;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export function LocalPOS() {
  const [imeiInput, setImeiInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile_banking">("cash");
  const [discount, setDiscount] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Use local database hooks
  const { data: customers } = useLocalCustomerQuery(customerSearch);
  const { create: createCustomer } = useCustomers();
  const { create: createSale } = useSales();

  // Add product to cart by IMEI
  const handleAddToCart = async () => {
    if (!imeiInput.trim()) {
      alert("Please enter an IMEI number");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Find product by IMEI in local database
      const product = await localDB.getProductByIMEI(imeiInput.trim());
      
      if (!product) {
        alert("Product not found with this IMEI");
        return;
      }

      // Check stock
      if ((product.currentStock || 0) <= 0) {
        alert("Product is out of stock");
        return;
      }

      const existingItem = cart.find(item => item.product._id === product._id);
      
      if (existingItem) {
        // Update quantity if product already in cart
        setCart(cart.map(item =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice
              }
            : item
        ));
      } else {
        // Add new item to cart
        const unitPrice = product.sellingPrice || product.costPrice;
        setCart([...cart, {
          product,
          quantity: 1,
          unitPrice: unitPrice,
          totalPrice: unitPrice
        }]);
      }
      
      setImeiInput("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add product to cart");
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.product._id === productId
        ? {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice
          }
        : item
    ));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  // Process sale
  const handleProcessSale = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }

    try {
      setIsProcessing(true);

      // Create sale record in local database
      const saleData = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        items: cart.map(item => ({
          productId: item.product._id,
          productName: item.product.name,
          condition: item.product.condition || "new",
          imei: item.product.imei,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        subtotal,
        discount: discountAmount,
        total,
        paymentMethod,
        status: "completed" as const,
      };

      const sale = await createSale(saleData);
      
      // Update product stock in local database
      for (const item of cart) {
        const currentProduct = await localDB.get('products', item.product._id);
        if (currentProduct) {
          await localDB.put('products', {
            ...currentProduct,
            currentStock: (currentProduct.currentStock || 0) - item.quantity,
            lastSynced: 0,
            isOffline: true
          });
        }
      }

      // Update customer total purchases
      const updatedCustomer = {
        ...selectedCustomer,
        totalPurchases: selectedCustomer.totalPurchases + total,
        lastPurchaseDate: Date.now(),
        lastSynced: 0,
        isOffline: true
      };
      await localDB.put('customers', updatedCustomer);
      
      // Create a sale object for the invoice
      const saleForInvoice = {
        ...sale,
        saleNumber: `SALE-${Date.now()}`,
        tax: 0,
        cashierId: "local",
        cashierName: "Local User",
      };
      
      // Clear cart and show invoice
      setLastSale(saleForInvoice);
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setShowInvoice(true);
      
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to process sale");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle IMEI input with Enter key
  const handleImeiKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddToCart();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Point of Sale (Local)</h2>
          <p className="text-gray-600">Scan or enter IMEI to add products (Works Offline)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Input & Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* IMEI Input */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Product by IMEI</h3>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={imeiInput}
                  onChange={(e) => setImeiInput(e.target.value)}
                  onKeyPress={handleImeiKeyPress}
                  placeholder="Enter or scan IMEI number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
                  disabled={isProcessing}
                />
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isProcessing || !imeiInput.trim()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          </div>

          {/* Shopping Cart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Shopping Cart ({cart.length} items)</h3>
            </div>
            
            {cart.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">🛒</div>
                <p>Cart is empty. Add products by scanning or entering IMEI.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={item.product._id} className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">
                        {item.product.brand} {item.product.model} • IMEI: {item.product.imei}
                      </p>
                      <p className="text-sm text-gray-500">৳{item.unitPrice.toLocaleString('en-BD')} each</p>
                      {item.product.isOffline && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          📱 Offline
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">৳{item.totalPrice.toLocaleString('en-BD')}</p>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Customer & Checkout */}
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer</h3>
            
            {selectedCustomer ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-green-900">{selectedCustomer.name}</p>
                    <p className="text-sm text-green-700">{selectedCustomer.phone}</p>
                    {selectedCustomer.email && (
                      <p className="text-sm text-green-700">{selectedCustomer.email}</p>
                    )}
                    {selectedCustomer.isOffline && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                        👤 Offline
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                
                {customers && customers.length > 0 && customerSearch && (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {customers.slice(0, 5).map((customer) => (
                      <button
                        key={customer._id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerSearch("");
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                          </div>
                          {customer.isOffline && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Offline
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  + Add New Customer
                </button>
              </div>
            )}
          </div>

          {/* Payment & Checkout */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
            
            <div className="space-y-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "cash" | "card" | "mobile_banking")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_banking">Mobile Banking</option>
                </select>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>৳{subtotal.toLocaleString('en-BD')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({discount}%):</span>
                    <span>-৳{discountAmount.toLocaleString('en-BD')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>৳{total.toLocaleString('en-BD')}</span>
                </div>
              </div>

              {/* Process Sale Button */}
              <button
                onClick={handleProcessSale}
                disabled={cart.length === 0 || !selectedCustomer || isProcessing}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isProcessing ? "Processing..." : `Process Sale (৳${total.toLocaleString('en-BD')})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <CustomerModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onSubmit={async (customerData) => {
            const customer = await createCustomer(customerData);
            setSelectedCustomer(customer);
            setShowCustomerModal(false);
          }}
        />
      )}

      {/* Invoice Modal */}
      {showInvoice && lastSale && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          sale={lastSale}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
}

// Customer Modal Component (same as before but using local database)
interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
}

function CustomerModal({ isOpen, onClose, onSubmit }: CustomerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        totalPurchases: 0,
      });
      setFormData({ name: "", phone: "", email: "", address: "" });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add New Customer</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Customer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
