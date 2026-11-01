import React, { useState, useEffect } from 'react';
import { Language, DairyProduct, CartItem, CustomerProfile } from '../../types/dairy';
import { translations } from '../../i18n/translations';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  MapPin,
  Sparkles,
  Truck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Heart
} from 'lucide-react';

interface Props {
  lang: Language;
  customer?: CustomerProfile;
  cart: CartItem[];
  onAddToCart: (product: DairyProduct) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onOpenCart: () => void;
}

export const DairyStore: React.FC<Props> = ({
  lang,
  customer,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onOpenCart,
}) => {
  const t = translations[lang];
  const [products, setProducts] = useState<DairyProduct[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Serviceability check
  const [pinInput, setPinInput] = useState(customer?.pinCode || '207121');
  const [pinResult, setPinResult] = useState<{
    serviceable: boolean;
    city?: string;
    state?: string;
    codAvailable?: boolean;
    deliveryCharge?: number;
    estimatedDelivery?: string;
    message: string;
  } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (customer?.pinCode) {
      checkPinService(customer.pinCode);
    }
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/products', window.location.origin);
      if (category !== 'all') url.searchParams.set('category', category);
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString());
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const checkPinService = async (pinToCheck?: string) => {
    const targetPin = (pinToCheck || pinInput).trim();
    if (targetPin.length !== 6) return;

    setPinLoading(true);
    try {
      const res = await fetch(`/api/serviceability/check?pinCode=${targetPin}`);
      const data = await res.json();
      setPinResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setPinLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: lang === 'hi' ? 'सभी उत्पाद (All)' : 'All Products' },
    { id: 'cow_milk', label: t.cowMilk },
    { id: 'buffalo_milk', label: t.buffaloMilk },
    { id: 'full_cream', label: lang === 'hi' ? 'फुल क्रीम दूध' : 'Full Cream Milk' },
    { id: 'toned_milk', label: lang === 'hi' ? 'टोन्ड दूध' : 'Toned Milk' },
    { id: 'packaged_milk', label: lang === 'hi' ? 'पैकेज्ड दूध' : 'Packaged Milk' },
    { id: 'curd', label: lang === 'hi' ? 'दही (Curd)' : 'Curd' },
    { id: 'paneer', label: lang === 'hi' ? 'मलाई पनीर' : 'Paneer' },
    { id: 'ghee', label: lang === 'hi' ? 'देसी घी' : 'Desi Ghee' },
    { id: 'butter', label: lang === 'hi' ? 'सफेद मक्खन' : 'Butter' },
    { id: 'other', label: lang === 'hi' ? 'छाछ व अन्य' : 'Chaach & Other' },
  ];

  const cartTotalItems = cart.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Promotional Store Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <Sparkles className="w-4 h-4" />
              <span>{t.tagline}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {lang === 'hi' ? 'ऑनलाइन ताजा दूध व शुद्ध डेयरी स्टोर' : 'All India Dairy Milk & Fresh Products Store'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100">
              {lang === 'hi'
                ? 'गाँव के खलिहानों से सीधा आपके द्वार तक — 100% शुद्ध देशी गाय का दूध, गाढ़ा भैंस का दूध, मटका दही, मलाई पनीर और बिलोना घी।'
                : 'Pure farm-fresh milk, clay-pot curd, soft paneer, and authentic Vedic Bilona Ghee delivered fresh.'}
            </p>
          </div>

          {/* Quick Cart Summary Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center justify-between gap-4 shrink-0">
            <div>
              <div className="text-xs text-blue-200">{t.myCart}</div>
              <div className="text-xl font-black text-amber-300">
                {cartTotalItems} {t.itemsInCart}
              </div>
            </div>
            <button
              onClick={onOpenCart}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-blue-950 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t.checkout}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PIN Code Serviceability Check Bar */}
      <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
          <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="font-bold">{t.checkPincode}:</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="207121"
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold w-24 text-center focus:ring-2 focus:ring-blue-600"
            />
            <button
              onClick={() => checkPinService()}
              disabled={pinLoading || pinInput.length !== 6}
              className="px-3 py-1.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition cursor-pointer disabled:opacity-50"
            >
              {pinLoading ? '...' : (lang === 'hi' ? 'जांचें' : 'Check')}
            </button>
          </div>
        </div>

        {pinResult && (
          <div className="text-xs font-semibold flex items-center gap-1.5">
            {pinResult.serviceable ? (
              <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{pinResult.message} ({pinResult.estimatedDelivery})</span>
              </span>
            ) : (
              <span className="text-amber-800 flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>{pinResult.message}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-12 pr-28 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm shadow-xs bg-white"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          {lang === 'hi' ? 'खोजें' : 'Search'}
        </button>
      </form>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              category === c.id
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          {lang === 'hi' ? 'ताजा डेयरी उत्पाद लोड हो रहे हैं...' : 'Loading fresh dairy products...'}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
          <p className="text-sm font-bold text-slate-700">
            {lang === 'hi' ? 'कोई उत्पाद नहीं मिला।' : 'No products found.'}
          </p>
          <button
            onClick={() => { setCategory('all'); setSearch(''); }}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            {lang === 'hi' ? 'सभी उत्पाद देखें' : 'View all products'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => {
            const inCart = cart.find((it) => it.product.id === p.id);
            const qty = inCart ? inCart.quantity : 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Image Container with Badge */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {(p.badge || p.badgeHi) && (
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-blue-950 text-[10px] font-extrabold uppercase tracking-wide shadow-xs">
                      {lang === 'hi' ? p.badgeHi || p.badge : p.badge}
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono font-semibold">
                    {p.unit}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-blue-950 group-hover:text-blue-700 transition">
                      {lang === 'hi' ? p.nameHi : p.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {lang === 'hi' ? p.descriptionHi : p.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-black text-slate-900">
                          ₹{p.price}
                        </span>
                        {p.originalPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{p.originalPrice}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        ✓ {t.inStock}
                      </span>
                    </div>

                    {/* Add to Cart / Stepper */}
                    {qty === 0 ? (
                      <button
                        onClick={() => onAddToCart(p)}
                        className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addToCart}</span>
                      </button>
                    ) : (
                      <div className="flex items-center bg-blue-50 border border-blue-200 rounded-xl p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(p.id, qty - 1)}
                          className="p-1.5 text-blue-900 hover:bg-blue-200 rounded-lg transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-bold text-blue-950 font-mono">
                          {qty}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(p.id, qty + 1)}
                          className="p-1.5 text-blue-900 hover:bg-blue-200 rounded-lg transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
