import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { InvoiceModal } from "./InvoiceModal";

interface CartItem {
  productId: Id<"products">;
  name: string;
  brand: string | undefined;
  imei: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export function RegularPOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | "all">("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWalkingCustomer, setIsWalkingCustomer] = useState(true);

  const products = useQuery(api.products.list, {
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    searchTerm: searchTerm || undefined,
    brand: selectedBrand === "all" ? undefined : selectedBrand,
  });
  
  const categories = useQuery(api.categories.list);
  const brands = useQuery(api.products.getBrands);
  const createSale = useMutation(api.sales.create);
  const sellProduct = useMutation(api.products.sellProduct);

  // Filter products to only show those with stock > 0
  const availableProducts = products?.filter(product => (product.currentStock || 0) > 0) || [];

  const addToCart = (product: any, price: number) => {
    // Check if product is already in cart
    const existingItemIndex = cart.findIndex(item => item.productId === product._id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        unitPrice: price,
        totalPrice: price * updatedCart[existingItemIndex].quantity
      };
      setCart(updatedCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: product._id,
        name: product.name,
        brand: product.brand,
        imei: product.imei,
        unitPrice: price,
        quantity: 1,
        totalPrice: price
      };
      setCart([...cart, newItem]);
    }
    
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId: Id<"products">) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: Id<"products">, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const updatedCart = cart.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity,
          totalPrice: item.unitPrice * quantity
        };
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  const updatePrice = (productId: Id<"products">, price: number) => {
    const updatedCart = cart.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          unitPrice: price,
          totalPrice: price * item.quantity
        };
      }
      return item;
    });
    
    setCart(updatedCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const customerNameToUse = isWalkingCustomer ? "Walking Customer" : customerName;

    if (!isWalkingCustomer && !customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create sale record
      const saleData = {
        customerName: customerNameToUse || "Walking Customer",
        customerPhone: customerPhone || undefined,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          imei: item.imei,
        })),
        discount: discountAmount,
        paymentMethod,
      };

      const saleId = await createSale(saleData);

      // Update product stock
      const stockUpdatePromises = cart.map(item => 
        sellProduct({
          imei: item.imei,
          quantity: item.quantity
        }).catch(error => {
          console.error("Error updating stock for item:", item, error);
          // Continue with other items even if one fails
          return Promise.resolve();
        })
      );

      // Wait for all stock updates to complete
      await Promise.all(stockUpdatePromises);

      setLastSale({
        _id: saleId,
        customerName: customerNameToUse || "Walking Customer",
        customerPhone,
        items: [...cart],
        subtotal,
        discount: discountAmount,
        total,
        paymentMethod,
        createdAt: Date.now()
      });

      // Reset form
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscount(0);
      setShowInvoice(true);
      
      toast.success("Sale completed successfully");
    } catch (error: any) {
      console.error("Error processing sale:", error);
      toast.error("Failed to process sale: " + (error.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Regular POS System</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search and Cart - Show first on mobile */}
        <div className="lg:col-span-1 order-first lg:order-last">
          {/* Search Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex flex-col gap-2 mb-4">
              <input
                type="text"
                placeholder="Search products..."
                className="flex-1 px-3 py-2 border border-teal-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="px-3 py-2 border border-teal-300 rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as Id<"categories"> | "all")}
              >
                <option value="all">All Categories</option>
                {categories?.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-teal-300 rounded-md"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="all">All Brands</option>
                {brands?.map(brand => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart and Checkout */}
          <div className="bg-white rounded-lg shadow p-4 h-fit"
          <h2 className="text-xl font-bold mb-4">Cart ({cart.length})</h2>
          
          {cart.length === 0 ? (
            <p className="text-teal-500 text-center py-4">No items in cart</p>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto mb-4">
                {cart.map(item => (
                  <div key={item.productId} className="border-b py-3">
                    <div className="flex justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <p className="text-sm text-teal-500 truncate">IMEI: {item.imei}</p>
                        <p className="text-sm text-teal-500">Brand: {item.brand || "N/A"}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-500 hover:text-amber-700 ml-2 flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
                      <div className="flex items-center">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center border rounded-l"
                        >
                          -
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center border-t border-b">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border rounded-r"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="mr-1">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-right"
                        />
                      </div>
                    </div>
                    
                    <div className="text-right font-medium mt-1">
                      ${(item.totalPrice).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3">
                <div className="flex flex-wrap justify-between mb-1 gap-2">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex flex-wrap justify-between mb-1 gap-2">
                  <span>Discount:</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-16 px-1 py-1 border rounded text-right mr-1"
                    />
                    <span>%</span>
                    <span className="ml-2">${discountAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-between font-bold text-lg mb-3 gap-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="walkingCustomer"
                      checked={isWalkingCustomer}
                      onChange={(e) => {
                        setIsWalkingCustomer(e.target.checked);
                        if (e.target.checked) {
                          setCustomerName("");
                        }
                      }}
                      className="mr-2 h-4 w-4"
                    />
                    <label htmlFor="walkingCustomer" className="text-sm font-medium">
                      Walking Customer
                    </label>
                  </div>
                  
                  <label className="block text-sm font-medium mb-1">
                    {isWalkingCustomer ? "Customer Name (Optional)" : "Customer Name *"}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-teal-300 rounded-md"
                    placeholder={isWalkingCustomer ? "Optional" : "Enter customer name"}
                    disabled={isWalkingCustomer}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Customer Phone</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-teal-300 rounded-md"
                    placeholder="Enter customer phone"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-teal-300 rounded-md"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile_banking">Mobile Banking</option>
                  </select>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Complete Sale"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Product List - Show after cart on mobile */}
        <div className="lg:col-span-2 order-last lg:order-first">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableProducts.map(product => (
              <ProductCard 
                key={product._id} 
                product={product} 
                onAddToCart={addToCart}
                isInCart={cart.some(item => item.productId === product._id)}
              />
            ))}
          </div>
        </div>
      </div>
      
      {showInvoice && lastSale && (
        <InvoiceModal 
          isOpen={showInvoice}
          sale={lastSale} 
          customer={null}
          onClose={() => setShowInvoice(false)} 
        />
      )}
    </div>
  );
}

function ProductCard({ product, onAddToCart, isInCart }: { 
  product: any; 
  onAddToCart: (product: any, price: number) => void;
  isInCart: boolean;
}) {
  const [price, setPrice] = useState(product.sellingPrice || product.costPrice * 1.2);
  
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-teal-200 hover:shadow-md transition-shadow w-full">
      <div className="mb-3">
        <h3 className="font-bold text-lg truncate">{product.name}</h3>
        <p className="text-sm text-teal-600">Brand: {product.brand || "N/A"}</p>
        <p className="text-sm text-teal-600 truncate">IMEI: {product.imei}</p>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-teal-500">Stock:</span>
          <span className="font-medium">{product.currentStock || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-teal-500">Cost Price:</span>
          <span className="font-medium">${product.costPrice.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Sell Price</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-teal-300 bg-teal-50 text-teal-500">
            $
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-md border border-teal-300"
          />
        </div>
      </div>
      
      <button
        onClick={() => onAddToCart(product, price)}
        disabled={isInCart}
        className={`w-full py-2 px-4 rounded-md ${
          isInCart 
            ? "bg-green-100 text-green-800 cursor-not-allowed" 
            : "bg-amber-600 text-white hover:bg-amber-700"
        }`}
      >
        {isInCart ? "Added to Cart" : "Add to Cart"}
      </button>
    </div>
  );
}