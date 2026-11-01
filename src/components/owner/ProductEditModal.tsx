import React, { useState } from 'react';
import { Language, DairyProduct, ProductCategory } from '../../types/dairy';
import { syncProductToFirestore } from '../../firebase/ordersService';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  AlertCircle,
  Tag,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface Props {
  lang: Language;
  product: DairyProduct | null;
  onClose: () => void;
  onSaveSuccess: (updatedProduct: DairyProduct) => void;
}

const PRESET_IMAGES: { labelHi: string; labelEn: string; url: string; icon: string }[] = [
  {
    labelHi: 'ताजा गाय का दूध (Fresh Cow Milk)',
    labelEn: 'Fresh Cow Milk',
    url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    icon: '🥛',
  },
  {
    labelHi: 'गाढ़ा भैंस का दूध (Pure Buffalo Milk)',
    labelEn: 'Pure Buffalo Milk',
    url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
    icon: '🐃',
  },
  {
    labelHi: 'शुद्ध दानेदार देसी घी (Desi Ghee)',
    labelEn: 'Pure Desi Ghee',
    url: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&auto=format&fit=crop&q=80',
    icon: '🍯',
  },
  {
    labelHi: 'ताजा मलाईदार पनीर (Fresh Paneer)',
    labelEn: 'Fresh Soft Paneer',
    url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
    icon: '🧀',
  },
  {
    labelHi: 'ताजा मीठा दही (Fresh Curd / Dahi)',
    labelEn: 'Fresh Curd / Dahi',
    url: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=600&auto=format&fit=crop&q=80',
    icon: '🥣',
  },
  {
    labelHi: 'शुद्ध मक्खन (Fresh White Butter)',
    labelEn: 'Fresh White Butter',
    url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
    icon: '🧈',
  },
  {
    labelHi: 'मावा पेड़ा / मिठाई (Dairy Sweets)',
    labelEn: 'Traditional Dairy Sweets',
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
    icon: '🍬',
  },
  {
    labelHi: 'पैक दूध बोतल (Dairy Bottle)',
    labelEn: 'Packaged Bottle',
    url: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=600&auto=format&fit=crop&q=80',
    icon: '🍼',
  },
];

export const ProductEditModal: React.FC<Props> = ({
  lang,
  product,
  onClose,
  onSaveSuccess,
}) => {
  const isEditing = !!product;

  const [name, setName] = useState(product?.name || '');
  const [nameHi, setNameHi] = useState(product?.nameHi || '');
  const [category, setCategory] = useState<ProductCategory>(product?.category || 'cow_milk');
  const [price, setPrice] = useState(product ? product.price.toString() : '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice ? product.originalPrice.toString() : '');
  const [unit, setUnit] = useState(product?.unit || '1 Liter');
  const [stockQuantity, setStockQuantity] = useState(product ? product.stockQuantity.toString() : '50');
  const [inStock, setInStock] = useState(product?.inStock ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [description, setDescription] = useState(product?.description || '');
  const [descriptionHi, setDescriptionHi] = useState(product?.descriptionHi || '');

  // Image states
  const [image, setImage] = useState(product?.image || PRESET_IMAGES[0].url);
  const [imageTab, setImageTab] = useState<'preset' | 'upload' | 'url'>('preset');
  const [customUrl, setCustomUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setUploadError(lang === 'hi' ? 'फ़ाइल 8MB से कम होनी चाहिए' : 'File must be under 8MB');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    setImage(customUrl.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) {
      setError(lang === 'hi' ? 'उत्पाद का नाम और मूल्य अनिवार्य हैं' : 'Product name and price are required');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      nameHi: nameHi.trim() || name.trim(),
      category,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      unit: unit.trim() || '1 Liter',
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      inStock,
      isFeatured,
      description: description.trim(),
      descriptionHi: descriptionHi.trim() || description.trim(),
      image,
    };

    try {
      let savedProduct: DairyProduct;

      if (isEditing && product) {
        const res = await fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update product');
        savedProduct = data.product;
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create product');
        savedProduct = data.product;
      }

      // Sync to Firestore in real-time
      await syncProductToFirestore(savedProduct);

      onSaveSuccess(savedProduct);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-amber-300/60 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {isEditing
                  ? lang === 'hi'
                    ? 'उत्पाद संपादित करें (Edit Store Product)'
                    : 'Edit Store Product'
                  : lang === 'hi'
                  ? 'नया उत्पाद जोड़ें (Add Store Product)'
                  : 'Add New Store Product'}
              </h3>
              <p className="text-xs text-blue-200">
                {lang === 'hi'
                  ? 'मूल्य, विवरण, स्टॉक एवं उत्पाद की फ़ोटो बदलें'
                  : 'Update price, packaging unit, stock, and product photo'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: PRODUCT IMAGE & PHOTO CHANGER */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-700" />
                <span>{lang === 'hi' ? 'उत्पाद की फ़ोटो (Product Image / Photo)' : 'Product Image / Photo'}</span>
              </label>
              <span className="text-[11px] text-amber-700 font-semibold">
                {lang === 'hi' ? 'लाइव प्रीव्यू' : 'Live Preview'}
              </span>
            </div>

            {/* Current Image Preview */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
              <div className="relative group shrink-0">
                <img
                  src={image}
                  alt="Product Preview"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-300/80 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                  }}
                />
                <span className="absolute bottom-1 right-1 bg-blue-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                  Active
                </span>
              </div>

              <div className="flex-1 space-y-1.5 text-center sm:text-left">
                <div className="text-xs font-bold text-slate-900">
                  {lang === 'hi' ? 'फ़ोटो बदलने के 3 आसान तरीके:' : '3 Easy Ways to Change Photo:'}
                </div>
                {/* Image Selection Tabs */}
                <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setImageTab('preset')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      imageTab === 'preset'
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ✨ {lang === 'hi' ? 'डेयरी गैलरी' : 'Presets'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      imageTab === 'upload'
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    📁 {lang === 'hi' ? 'फ़ोन से अपलोड' : 'Upload File'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      imageTab === 'url'
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    🔗 {lang === 'hi' ? 'इमेज लिंक (URL)' : 'Image URL'}
                  </button>
                </div>
              </div>
            </div>

            {/* TAB CONTENT: PRESETS */}
            {imageTab === 'preset' && (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-500 font-medium">
                  {lang === 'hi' ? 'नीचे से कोई भी प्रीमियम डेयरी फ़ोटो चुनें:' : 'Select any high-quality dairy photo:'}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_IMAGES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImage(p.url)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                        image === p.url
                          ? 'border-blue-700 bg-blue-50/80 ring-2 ring-blue-600/30 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-100'
                      }`}
                    >
                      <img src={p.url} alt={p.labelEn} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      <div className="text-[10px] leading-tight text-slate-800 line-clamp-2">
                        {p.icon} {lang === 'hi' ? p.labelHi.split('(')[0] : p.labelEn}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: UPLOAD */}
            {imageTab === 'upload' && (
              <div className="p-3 bg-white rounded-xl border border-dashed border-blue-300 text-center space-y-2">
                <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                <div className="text-xs text-slate-600">
                  {lang === 'hi'
                    ? 'फ़ोन या कंप्यूटर से उत्पाद की फ़ोटो चुनें (PNG, JPG, JPEG, WEBP max 8MB)'
                    : 'Choose photo from device (PNG, JPG, WEBP up to 8MB)'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
                />
                {uploadError && <div className="text-xs text-rose-600">{uploadError}</div>}
              </div>
            )}

            {/* TAB CONTENT: URL */}
            {imageTab === 'url' && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3.5 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 cursor-pointer"
                >
                  {lang === 'hi' ? 'लागू करें' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: PRODUCT NAMES (HINDI & ENGLISH) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'उत्पाद का नाम (हिंदी में)' : 'Product Name (Hindi)'} *
              </label>
              <input
                type="text"
                required
                value={nameHi}
                onChange={(e) => setNameHi(e.target.value)}
                placeholder="उदा. ताजा गाय का शुद्ध दूध"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'उत्पाद का नाम (English में)' : 'Product Name (English)'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fresh Pure Cow Milk"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              />
            </div>
          </div>

          {/* SECTION 3: CATEGORY & PACKAGING UNIT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'उत्पाद श्रेणी (Category)' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium"
              >
                <option value="cow_milk">गाय का दूध (Cow Milk)</option>
                <option value="buffalo_milk">भैंस का दूध (Buffalo Milk)</option>
                <option value="full_cream">फुल क्रीम दूध (Full Cream)</option>
                <option value="toned_milk">टोंड दूध (Toned Milk)</option>
                <option value="packaged_milk">पैक्ड पाउच / बोतल (Packaged)</option>
                <option value="paneer">पनीर (Fresh Paneer)</option>
                <option value="ghee">देसी घी (Pure Ghee)</option>
                <option value="curd">दही (Fresh Curd)</option>
                <option value="butter">मक्खन (White Butter)</option>
                <option value="other">अन्य डेयरी उत्पाद (Other)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'मात्रा / पैकेजिंग इकाई (Unit)' : 'Packaging Unit'} *
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="उदा. 1 Liter / 500 gm / 1 Kg"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              />
            </div>
          </div>

          {/* SECTION 4: PRICE & DISCOUNT PRICE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'बिक्री मूल्य (Selling Price ₹)' : 'Selling Price (₹)'} *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="55"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-blue-950 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'वास्तविक मूल्य / MRP (वैकल्पिक ₹)' : 'MRP / Original Price (₹)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  step="0.5"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="60"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: STOCK QUANTITY & STOCK STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'उपलब्ध स्टॉक मात्रा' : 'Available Stock Quantity'}
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="50"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white font-mono font-bold"
              />
            </div>

            <div className="flex flex-col justify-center space-y-2 pt-1 sm:pt-0">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-900 cursor-pointer"
                />
                <span>{lang === 'hi' ? 'स्टॉक में उपलब्ध है (In Stock)' : 'In Stock'}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-800">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                />
                <span>{lang === 'hi' ? 'विशेष उत्पाद बनाएं (Featured Product)' : 'Featured Product'}</span>
              </label>
            </div>
          </div>

          {/* SECTION 6: DESCRIPTIONS */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'उत्पाद विवरण (हिंदी में)' : 'Description (Hindi)'}
              </label>
              <textarea
                rows={2}
                value={descriptionHi}
                onChange={(e) => setDescriptionHi(e.target.value)}
                placeholder="उदा. ताजा, शुद्ध व गाढ़ा दूध। बिना किसी मिलावट के सीधे डेयरी से प्राप्त।"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'hi' ? 'उत्पाद विवरण (English में)' : 'Description (English)'}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Pure, farm-fresh milk directly delivered to your home without preservatives."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>
                {isEditing
                  ? lang === 'hi'
                    ? 'परिवर्तन सुरक्षित करें (Save Changes)'
                    : 'Save Changes'
                  : lang === 'hi'
                  ? 'उत्पाद जोड़ें (Add Product)'
                  : 'Add Product'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
