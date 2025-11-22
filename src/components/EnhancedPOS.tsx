import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { InvoiceModal } from "./InvoiceModal";

type Product = Doc<"products">;
type Customer = Doc<"customers">;
type Sale = Doc<"sales">;

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export function EnhancedPOS() {
  const [imeiInput, setImeiInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile_banking">("cash");
  const [discount, setDiscount] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const customers = useQuery(api.customers.list, { searchTerm: customerSearch || undefined });
  
  // Mutations
  const sellProduct = useMutation(api.products.sellProduct);
  const createSale = useMutation(api.sales.create);
  const createCustomer = useMutation(api.customers.create);

  // Add product to cart by IMEI
  const handleAddToCart = async () => {
    if (!imeiInput.trim()) {
      alert("Please enter an IMEI number");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Try to sell the product to get product details and reduce stock
      const result = await sellProduct({ 
        imei: imeiInput.trim(),
        quantity: 1 
      });

      if (result && result.product) {
        const existingItem = cart.find(item => item.product.imei === result.product.imei);
        
        if (existingItem) {
          // Update quantity if product already in cart
          setCart(cart.map(item =>
            item.product.imei === result.product.imei
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  totalPrice: (item.quantity + 1) * item.unitPrice
                }
              : item
          ));
        } else {
          // Add new item to cart
          const unitPrice = result.product.sellingPrice || result.product.costPrice;
          setCart([...cart, {
            product: result.product,
            quantity: 1,
            unitPrice: unitPrice,
            totalPrice: unitPrice
          }]);
        }
        
        setImeiInput("");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add product to cart");
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove item from cart
  const removeFromCart = (productId: Id<"products">) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId: Id<"products">, newQuantity: number) => {
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

      // Create sale record
      const saleData = {
        customerId: selectedCustomer._id,
        items: cart.map(item => ({
          productId: item.product._id,
          productName: item.product.name,
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

      const saleId = await createSale(saleData);
      
      // Create a sale object for the invoice
      const saleForInvoice = {
        _id: saleId,
        _creationTime: Date.now(),
        saleNumber: `SALE-${Date.now()}`,
        tax: 0,
        cashierId: "temp" as any,
        cashierName: "Current User",
        ...saleData,
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
          <h2 className="text-2xl font-bold text-gray-900">Point of Sale</h2>
          <p className="text-gray-600">Scan or enter IMEI to add products</p>
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
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
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
            const customerId = await createCustomer(customerData);
            const customerForState = {
              _id: customerId,
              _creationTime: Date.now(),
              totalPurchases: 0,
              ...customerData,
            };
            setSelectedCustomer(customerForState);
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

// Customer Modal Component
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
