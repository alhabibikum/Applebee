import { useState, useEffect } from "react";
import { useOfflineQuery } from "../hooks/useOfflineQuery";
import { useOfflineMutation } from "../hooks/useOfflineMutation";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";

type Product = Doc<"products">;

export function OfflineInventory() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<"" | "new" | "used">("");
  const [includeOutOfStock, setIncludeOutOfStock] = useState(false);
  const [productType, setProductType] = useState<"new" | "used">("new");

  // Use offline-enabled hooks
  const products = useOfflineQuery(api.products.list, {
    searchTerm: searchTerm || undefined,
    brand: selectedBrand || undefined,
    categoryId: selectedCategory ? selectedCategory as Id<"categories"> : undefined,
    includeOutOfStock,
  }, 'products');

  const categories = useOfflineQuery(api.categories.list, {}, 'categories');
  const brands = useOfflineQuery(api.products.getBrands, {}, 'brands');

  const createProduct = useOfflineMutation(api.products.create, 'products');
  const updateProduct = useOfflineMutation(api.products.update, 'products');
  const deleteProduct = useOfflineMutation(api.products.remove, 'products');
  const createCategory = useOfflineMutation(api.categories.create, 'categories');

  // Filter products by condition
  const filteredProducts = products?.filter((product: any) => {
    if (selectedCondition === "") return true;
    return (product.condition || "new") === selectedCondition;
  }) || [];

  // Separate new and used products for display
  const newProducts = filteredProducts.filter((p: any) => (p.condition || "new") === "new");
  const usedProducts = filteredProducts.filter((p: any) => (p.condition || "new") === "used");

  const handleAddProduct = () => {
    setProductType("new");
    setShowAddModal(true);
  };

  const handleAddUsedProduct = () => {
    setProductType("used");
    setShowAddModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = async (productId: Id<"products">) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct({ id: productId });
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to delete product");
      }
    }
  };

  if (!products || !categories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600">Manage your mobile phone inventory (অফলাইন সাপোর্ট)</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <span>📂</span>
            <span>Add Category</span>
          </button>
          <button
            onClick={handleAddProduct}
            className="btn-primary flex items-center space-x-2"
          >
            <span>📱</span>
            <span>Add New Mobile</span>
          </button>
          <button
            onClick={handleAddUsedProduct}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <span>📱</span>
            <span>Add Used Mobile</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Brands</option>
              {brands?.map((brand: any) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories?.map((category: any) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value as "" | "new" | "used")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Conditions</option>
              <option value="new">New Mobiles</option>
              <option value="used">Used Mobiles</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeOutOfStock}
                onChange={(e) => setIncludeOutOfStock(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Include out of stock</span>
            </label>
          </div>
        </div>
      </div>

      {/* Products Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">📱</span>
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">New Mobiles</p>
              <p className="text-2xl font-bold text-green-700">{newProducts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">📱</span>
            </div>
            <div>
              <p className="text-sm text-orange-600 font-medium">Used Mobiles</p>
              <p className="text-2xl font-bold text-orange-700">{usedProducts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Low Stock</p>
              <p className="text-2xl font-bold text-red-700">
                {filteredProducts.filter((p: any) => (p.currentStock || 0) <= (p.minStockLevel || 0)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU/IMEI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product: any) => (
                <tr key={product._id} className={`hover:bg-gray-50 ${product.isOffline ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {product.name}
                        {product.isOffline && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            অফলাইন
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{product.brand} {product.model}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (product.condition || "new") === "new" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-orange-100 text-orange-800"
                    }`}>
                      📱 {(product.condition || "new") === "new" ? "New" : "Used"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.sku || "N/A"}</div>
                    {product.imei && (
                      <div className="text-sm text-gray-500">IMEI: {product.imei}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">৳{product.sellingPrice?.toLocaleString('en-BD') || "N/A"}</div>
                    <div className="text-sm text-gray-500">Cost: ৳{product.costPrice.toLocaleString('en-BD')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      (product.currentStock || 0) <= (product.minStockLevel || 0)
                        ? "text-red-600" 
                        : "text-gray-900"
                    }`}>
                      {product.currentStock || 0} {product.unit || "pcs"}
                    </div>
                    <div className="text-sm text-gray-500">Min: {product.minStockLevel || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (product.currentStock || 0) <= (product.minStockLevel || 0)
                        ? "bg-red-100 text-red-800"
                        : (product.currentStock || 0) === 0
                        ? "bg-gray-100 text-gray-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {(product.currentStock || 0) <= (product.minStockLevel || 0) && (product.currentStock || 0) > 0
                        ? "Low Stock"
                        : (product.currentStock || 0) === 0
                        ? "Out of Stock"
                        : "In Stock"
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <ProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          categories={categories}
          productType={productType}
          onSubmit={createProduct}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <ProductModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          categories={categories}
          product={editingProduct}
          onSubmit={updateProduct}
        />
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <AddCategoryModal
          isOpen={showAddCategoryModal}
          onClose={() => setShowAddCategoryModal(false)}
          onSubmit={createCategory}
        />
      )}
    </div>
  );
}

// Keep the existing ProductModal and AddCategoryModal components unchanged
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  product?: Product;
  productType?: "new" | "used";
  onSubmit: (data: any) => Promise<any>;
}

function ProductModal({ isOpen, onClose, categories, product, productType, onSubmit }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    brand: product?.brand || "",
    model: product?.model || "",
    sku: product?.sku || "",
    imei: product?.imei || "",
    categoryId: product?.categoryId || "",
    condition: product?.condition || productType || "new",
    costPrice: product?.costPrice || 0,
    sellingPrice: product?.sellingPrice || 0,
    minStockLevel: product?.minStockLevel || 0,
    unit: product?.unit || "",
    isActive: product?.isActive ?? true,
    supplierName: product?.supplierName || "",
    supplierMobile: product?.supplierMobile || "",
    supplierNid: product?.supplierNid || "",
    // Quick Specifications - simplified for form
    ram: product?.specifications?.memory?.ram || "",
    storage: product?.specifications?.memory?.storage || "",
    battery: product?.specifications?.battery?.capacity || "",
    // Used phone specific fields
    previousOwner: product?.usedPhoneDetails?.previousOwner || "",
    purchaseDate: product?.usedPhoneDetails?.purchaseDate || "",
    purchasePrice: product?.usedPhoneDetails?.purchasePrice || 0,
    conditionNotes: product?.usedPhoneDetails?.conditionNotes || "",
    functionalIssues: product?.usedPhoneDetails?.functionalIssues?.join(", ") || "",
    cosmeticCondition: product?.usedPhoneDetails?.cosmeticCondition || "good",
    batteryHealth: product?.usedPhoneDetails?.batteryHealth || 100,
    screenCondition: product?.usedPhoneDetails?.screenCondition || "perfect",
    accessories: product?.usedPhoneDetails?.accessories?.join(", ") || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-split product name into brand and model
  const handleNameChange = (name: string) => {
    const words = name.trim().split(' ');
    const brand = words[0] || '';
    const model = words.slice(1).join(' ') || '';
    
    setFormData(prev => ({
      ...prev,
      name,
      brand,
      model
    }));
  };

  // Auto-generate SKU when brand, condition, or IMEI changes
  const generateSKU = (brand: string, condition: string, imei: string) => {
    if (brand && condition && imei && imei.length >= 4) {
      const brandPrefix = brand.substring(0, 3).toUpperCase();
      const conditionSuffix = condition === "new" ? "New" : "Used";
      const imeiSuffix = imei.slice(-4);
      return `${brandPrefix}${conditionSuffix}${imeiSuffix}`;
    }
    return "";
  };

  // Update SKU when relevant fields change
  const handleBrandChange = (brand: string) => {
    const newSKU = generateSKU(brand, formData.condition, formData.imei);
    setFormData(prev => ({
      ...prev,
      brand,
      sku: newSKU || prev.sku
    }));
  };

  const handleConditionChange = (condition: string) => {
    const newSKU = generateSKU(formData.brand, condition, formData.imei);
    setFormData(prev => ({
      ...prev,
      condition: condition as "new" | "used",
      sku: newSKU || prev.sku
    }));
  };

  const handleIMEIChange = (imei: string) => {
    const newSKU = generateSKU(formData.brand, formData.condition, imei);
    setFormData(prev => ({
      ...prev,
      imei,
      sku: newSKU || prev.sku
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData: any = {
        name: formData.name,
        imei: formData.imei,
        costPrice: formData.costPrice,
        categoryId: formData.categoryId as Id<"categories">,
      };

      // Add optional fields only if they have values
      if (formData.brand?.trim()) submitData.brand = formData.brand.trim();
      if (formData.model?.trim()) submitData.model = formData.model.trim();
      if (formData.sku?.trim()) submitData.sku = formData.sku.trim();
      if (formData.condition) submitData.condition = formData.condition as "new" | "used";
      if (formData.sellingPrice > 0) submitData.sellingPrice = formData.sellingPrice;
      if (formData.minStockLevel > 0) submitData.minStockLevel = formData.minStockLevel;
      if (formData.unit?.trim()) submitData.unit = formData.unit.trim();
      if (formData.isActive !== undefined) submitData.isActive = formData.isActive;
      if (formData.supplierName?.trim()) submitData.supplierName = formData.supplierName.trim();
      if (formData.supplierMobile?.trim()) submitData.supplierMobile = formData.supplierMobile.trim();
      if (formData.supplierNid?.trim()) submitData.supplierNid = formData.supplierNid.trim();

      // Add specifications if any field has value (using the proper schema structure)
      const specifications: any = {};
      let hasSpecifications = false;
      
      if (formData.ram?.trim() || formData.storage?.trim()) {
        specifications.memory = {};
        if (formData.ram?.trim()) {
          specifications.memory.ram = formData.ram.trim();
          hasSpecifications = true;
        }
        if (formData.storage?.trim()) {
          specifications.memory.storage = formData.storage.trim();
          hasSpecifications = true;
        }
      }
      
      if (formData.battery?.trim()) {
        specifications.battery = {
          capacity: formData.battery.trim()
        };
        hasSpecifications = true;
      }
      
      if (hasSpecifications) {
        submitData.specifications = specifications;
      }

      // Add used phone details if condition is "used" and any field has value
      if (formData.condition === "used") {
        const usedDetails: any = {};
        let hasUsedDetails = false;

        if (formData.previousOwner?.trim()) {
          usedDetails.previousOwner = formData.previousOwner.trim();
          hasUsedDetails = true;
        }
        if (formData.purchaseDate?.trim()) {
          usedDetails.purchaseDate = formData.purchaseDate.trim();
          hasUsedDetails = true;
        }
        if (formData.purchasePrice > 0) {
          usedDetails.purchasePrice = formData.purchasePrice;
          hasUsedDetails = true;
        }
        if (formData.conditionNotes?.trim()) {
          usedDetails.conditionNotes = formData.conditionNotes.trim();
          hasUsedDetails = true;
        }
        if (formData.functionalIssues?.trim()) {
          usedDetails.functionalIssues = formData.functionalIssues.split(",").map(s => s.trim()).filter(Boolean);
          hasUsedDetails = true;
        }
        if (formData.cosmeticCondition && formData.cosmeticCondition !== "good") {
          usedDetails.cosmeticCondition = formData.cosmeticCondition;
          hasUsedDetails = true;
        }
        if (formData.batteryHealth !== 100) {
          usedDetails.batteryHealth = formData.batteryHealth;
          hasUsedDetails = true;
        }
        if (formData.screenCondition && formData.screenCondition !== "perfect") {
          usedDetails.screenCondition = formData.screenCondition;
          hasUsedDetails = true;
        }
        if (formData.accessories?.trim()) {
          usedDetails.accessories = formData.accessories.split(",").map(s => s.trim()).filter(Boolean);
          hasUsedDetails = true;
        }

        if (hasUsedDetails) {
          submitData.usedPhoneDetails = usedDetails;
        }
      }

      if (product) {
        submitData.id = product._id;
      }

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {product ? "Edit Product" : `Add ${formData.condition === "new" ? "New" : "Used"} Mobile Phone`}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Required Fields Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-blue-600 text-xl mr-3">ℹ️</span>
                <div>
                  <h4 className="font-medium text-blue-800">Required Fields</h4>
                  <p className="text-sm text-blue-700">Product Name, IMEI, Cost Price, and Category are required. All other fields are optional.</p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Samsung Galaxy A54"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IMEI <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.imei}
                  onChange={(e) => handleIMEIChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price (৳) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Auto-filled from Product Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Auto-filled from Product Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Auto-generated: BrandNew/Used+IMEI"
                />
              </div>
            </div>

            {/* Condition Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="condition"
                    value="new"
                    checked={formData.condition === "new"}
                    onChange={(e) => handleConditionChange(e.target.value)}
                    className="mr-2"
                  />
                  📱 New Mobile
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="condition"
                    value="used"
                    checked={formData.condition === "used"}
                    onChange={(e) => handleConditionChange(e.target.value)}
                    className="mr-2"
                  />
                  📱 Used Mobile
                </label>
              </div>
            </div>

            {/* Quick Specifications */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-blue-800 mb-4">Quick Specifications (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RAM
                  </label>
                  <input
                    type="text"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    placeholder="e.g., 8GB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage
                  </label>
                  <input
                    type="text"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    placeholder="e.g., 128GB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Battery
                  </label>
                  <input
                    type="text"
                    value={formData.battery}
                    onChange={(e) => setFormData({ ...formData, battery: e.target.value })}
                    placeholder="e.g., 5000mAh"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Used Mobile Details */}
            {formData.condition === "used" && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-orange-800 mb-4">Used Mobile Details (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Owner
                    </label>
                    <input
                      type="text"
                      value={formData.previousOwner}
                      onChange={(e) => setFormData({ ...formData, previousOwner: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price (৳)
                    </label>
                    <input
                      type="number"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cosmetic Condition
                    </label>
                    <select
                      value={formData.cosmeticCondition}
                      onChange={(e) => setFormData({ ...formData, cosmeticCondition: e.target.value as "excellent" | "good" | "fair" | "poor" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Battery Health (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.batteryHealth}
                      onChange={(e) => setFormData({ ...formData, batteryHealth: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Screen Condition
                    </label>
                    <select
                      value={formData.screenCondition}
                      onChange={(e) => setFormData({ ...formData, screenCondition: e.target.value as "perfect" | "minor_scratches" | "major_scratches" | "cracked" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="perfect">Perfect</option>
                      <option value="minor_scratches">Minor Scratches</option>
                      <option value="major_scratches">Major Scratches</option>
                      <option value="cracked">Cracked</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Functional Issues (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.functionalIssues}
                      onChange={(e) => setFormData({ ...formData, functionalIssues: e.target.value })}
                      placeholder="e.g., Camera not working, Speaker issue"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accessories (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.accessories}
                      onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                      placeholder="e.g., Charger, Box, Earphones"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition Notes
                    </label>
                    <textarea
                      value={formData.conditionNotes}
                      onChange={(e) => setFormData({ ...formData, conditionNotes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pricing and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., pcs, units"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Supplier Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Supplier Information (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Mobile
                  </label>
                  <input
                    type="text"
                    value={formData.supplierMobile}
                    onChange={(e) => setFormData({ ...formData, supplierMobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier NID
                  </label>
                  <input
                    type="text"
                    value={formData.supplierNid}
                    onChange={(e) => setFormData({ ...formData, supplierNid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
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
                {isSubmitting ? "Saving..." : product ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
}

function AddCategoryModal({ isOpen, onClose, onSubmit }: AddCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color || undefined,
      });
      setFormData({ name: "", description: "", color: "#3B82F6" });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create category");
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
            <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
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
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Smartphones, Accessories"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Optional description for this category"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
