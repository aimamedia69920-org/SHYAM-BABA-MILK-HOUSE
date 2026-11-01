import React, { useState, useEffect } from 'react';
import { Language, DairyOrder, OrderStatus } from '../../types/dairy';
import { subscribeToCustomerOrders, subscribeToOrder } from '../../firebase/ordersService';
import {
  X,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Home,
  MapPin,
  Calendar,
  CreditCard,
  Banknote,
  Phone,
  MessageCircle,
  RefreshCw,
  Search,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface Props {
  lang: Language;
  customerId?: string;
  customerMobile?: string;
  initialOrderId?: string;
  onClose: () => void;
  onGoHome?: () => void;
}

const STAGES: {
  key: OrderStatus;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'placed',
    titleHi: 'ऑर्डर दर्ज',
    titleEn: 'Placed',
    descHi: 'ऑर्डर सफलतापूर्वक प्राप्त हुआ',
    descEn: 'Order received at dairy',
    icon: Clock,
  },
  {
    key: 'confirmed',
    titleHi: 'पुष्टि हुई',
    titleEn: 'Confirmed',
    descHi: 'डेयरी प्रबंधन द्वारा स्वीकृत',
    descEn: 'Accepted & verified by owner',
    icon: ShieldCheck,
  },
  {
    key: 'processing',
    titleHi: 'तैयारी जारी',
    titleEn: 'Processing',
    descHi: 'ताजा दूध व उत्पाद पैक किए जा रहे हैं',
    descEn: 'Fresh dairy items packed',
    icon: Package,
  },
  {
    key: 'out_for_delivery',
    titleHi: 'डिलीवरी हेतु रवाना',
    titleEn: 'Out for Delivery',
    descHi: 'डिलीवरी बॉय आपके पते की ओर निकला',
    descEn: 'Courier on route to your address',
    icon: Truck,
  },
  {
    key: 'delivered',
    titleHi: 'डिलीवर हुआ',
    titleEn: 'Delivered',
    descHi: 'डोरस्टेप पर सफलतापूर्वक वितरित',
    descEn: 'Successfully delivered to doorstep',
    icon: CheckCircle2,
  },
];

export const OrderTrackingModal: React.FC<Props> = ({
  lang,
  customerId = '',
  customerMobile = '',
  initialOrderId,
  onClose,
  onGoHome,
}) => {
  const [orders, setOrders] = useState<DairyOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || '');
  const [activeOrder, setActiveOrder] = useState<DairyOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // 1. Initial fetch from API & fallback
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/orders', window.location.origin);
        if (customerId) url.searchParams.set('customerId', customerId);
        const res = await fetch(url.toString());
        if (res.ok && isMounted) {
          const list: DairyOrder[] = await res.json();
          setOrders(list);
          if (list.length > 0 && !selectedOrderId) {
            setSelectedOrderId(list[0].id);
            setActiveOrder(list[0]);
          } else if (selectedOrderId) {
            const found = list.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId);
            if (found) setActiveOrder(found);
          }
        }
      } catch (err) {
        console.warn('API fetch orders error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();

    // 2. Real-time Firestore subscription
    const unsubscribe = subscribeToCustomerOrders(customerId, customerMobile, (firestoreOrders) => {
      if (!isMounted) return;
      setIsLiveConnected(true);
      if (firestoreOrders && firestoreOrders.length > 0) {
        setOrders((prev) => {
          // Merge preserving unique ids
          const map = new Map<string, DairyOrder>();
          prev.forEach((o) => map.set(o.id, o));
          firestoreOrders.forEach((o) => map.set(o.id, o));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
          );
          return merged;
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [customerId, customerMobile]);

  // 3. Real-time listener for the currently selected order
  useEffect(() => {
    if (!selectedOrderId) return;
    const found = orders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId);
    if (found) setActiveOrder(found);

    const unsubscribe = subscribeToOrder(selectedOrderId, (updated) => {
      if (updated) {
        setIsLiveConnected(true);
        setActiveOrder(updated);
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
    });

    return () => unsubscribe();
  }, [selectedOrderId, orders]);

  // Compute status step index
  const getStageIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'placed':
        return 0;
      case 'confirmed':
        return 1;
      case 'processing':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = activeOrder ? getStageIndex(activeOrder.orderStatus) : 0;
  const isCancelled = activeOrder?.orderStatus === 'cancelled';
  const progressPercent = isCancelled ? 100 : Math.min(100, (currentStep / (STAGES.length - 1)) * 100);

  // Filtered orders for selector
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.items.some((i) => i.name.toLowerCase().includes(q) || i.nameHi.includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-amber-300/60 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {lang === 'hi' ? 'लाइव ऑर्डर ट्रैकिंग' : 'Live Order Tracking'}
                </h2>
                {isLiveConnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Firestore Live</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200">
                {lang === 'hi'
                  ? 'श्याम बाबा मिल्क हाउस • लाइव स्थिति (Placed, Confirmed, Processing, Out for Delivery, Delivered)'
                  : 'Real-time order progress timeline connected to Firestore'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onGoHome && (
              <button
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
                title={lang === 'hi' ? 'मुख्य पृष्ठ पर जाएं' : 'Go to Home'}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Order Search & Selector Strip */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'hi' ? 'ऑर्डर नंबर खोजें (उदा. SMB-123456)...' : 'Search Order # (e.g. SMB-123456)...'}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {orders.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                  {lang === 'hi' ? 'आपके ऑर्डर्स:' : 'Your Orders:'}
                </span>
                {filteredOrders.slice(0, 4).map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => {
                      setSelectedOrderId(ord.id);
                      setActiveOrder(ord);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      activeOrder?.id === ord.id
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    #{ord.orderNumber.slice(-8)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-600">
                {lang === 'hi' ? 'Firestore से ऑर्डर स्थिति लोड हो रही है...' : 'Connecting to Firestore & fetching orders...'}
              </p>
            </div>
          ) : !activeOrder ? (
            <div className="py-16 text-center space-y-3 bg-slate-50 rounded-3xl border border-dashed border-slate-300 p-6">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                {lang === 'hi' ? 'कोई सक्रिय ऑर्डर नहीं मिला' : 'No Order Selected'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === 'hi'
                  ? 'आपने अभी तक स्टोर से कोई ऑर्डर नहीं दिया है। डेयरी स्टोर पर जाकर शुद्ध दूध, घी व पनीर ऑर्डर करें।'
                  : 'You have not placed any store orders yet or no order matches your search.'}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold shadow-md hover:bg-blue-800 cursor-pointer"
              >
                {lang === 'hi' ? 'डेयरी स्टोर देखें' : 'Browse Dairy Store'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Overview Banner */}
              <div className="bg-gradient-to-br from-blue-50/80 via-white to-amber-50/60 p-4 sm:p-5 rounded-3xl border border-blue-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm sm:text-base font-black text-blue-950">
                      Order #{activeOrder.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : activeOrder.orderStatus === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {activeOrder.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                    <span>
                      {lang === 'hi' ? 'दिनांक:' : 'Placed:'}{' '}
                      {new Date(activeOrder.placedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      {lang === 'hi' ? 'कुल राशि:' : 'Amount:'}{' '}
                      <strong className="text-slate-900 font-bold">₹{activeOrder.totalAmount}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/aimamedia69920?text=${encodeURIComponent(
                      `नमस्ते, मुझे मेरे ऑर्डर #${activeOrder.orderNumber} के बारे में जानकारी चाहिए।`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'व्हाट्सएप सहायता' : 'WhatsApp Support'}</span>
                  </a>
                </div>
              </div>

              {/* VISUAL TIMELINE PROGRESS BAR */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {lang === 'hi' ? 'लाइव प्रगति स्थिति (Visual Progress Bar)' : 'Live Delivery Timeline Progress'}
                    </h3>
                  </div>
                  <span className="text-xs font-extrabold text-blue-900 font-mono">
                    {isCancelled ? 'CANCELLED' : `${Math.round(progressPercent)}% COMPLETE`}
                  </span>
                </div>

                {isCancelled ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">{lang === 'hi' ? 'यह ऑर्डर रद्द कर दिया गया है' : 'This Order was Cancelled'}</div>
                      <p className="text-xs text-rose-700 mt-0.5">
                        {lang === 'hi'
                          ? 'यदि आपने UPI द्वारा भुगतान किया था, तो राशि आपके बिल लेजर में क्रेडिट कर दी जाएगी या प्रतिस्थापन प्रदान किया जाएगा।'
                          : 'If you paid via UPI, your credit will be adjusted in your milk ledger or refunded upon support request.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Desktop & Tablet Horizontal Bar */}
                    <div className="relative hidden md:block pt-4 pb-2 px-6">
                      {/* Gray Track */}
                      <div className="absolute top-10 left-12 right-12 h-2 bg-slate-200 rounded-full" />
                      {/* Filled Progress Track */}
                      <div
                        className="absolute top-10 left-12 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                        style={{ width: `calc(${progressPercent}% - 3rem)` }}
                      />

                      {/* 5 Milestone Circles */}
                      <div className="relative z-10 flex items-start justify-between">
                        {STAGES.map((stg, idx) => {
                          const Icon = stg.icon;
                          const isDone = idx < currentStep;
                          const isCurrent = idx === currentStep;

                          return (
                            <div key={stg.key} className="flex flex-col items-center text-center w-28">
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base transition-all duration-300 shadow-md ${
                                  isDone
                                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-4 ring-emerald-100'
                                    : isCurrent
                                    ? 'bg-blue-900 text-white shadow-blue-900/40 ring-4 ring-amber-300 animate-pulse scale-110'
                                    : 'bg-white text-slate-400 border-2 border-slate-200'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="mt-3 space-y-0.5">
                                <div
                                  className={`text-xs font-bold leading-tight ${
                                    isCurrent ? 'text-blue-950 font-black' : isDone ? 'text-emerald-800' : 'text-slate-400'
                                  }`}
                                >
                                  {lang === 'hi' ? stg.titleHi : stg.titleEn}
                                </div>
                                <div className="text-[10px] text-slate-500 line-clamp-2">
                                  {lang === 'hi' ? stg.descHi : stg.descEn}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mobile Vertical Timeline */}
                    <div className="md:hidden space-y-4 pt-2">
                      {STAGES.map((stg, idx) => {
                        const Icon = stg.icon;
                        const isDone = idx < currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                          <div key={stg.key} className="flex items-start gap-3.5 relative">
                            {idx !== STAGES.length - 1 && (
                              <div
                                className={`absolute left-5 top-10 bottom-0 w-0.5 ${
                                  idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                                }`}
                              />
                            )}
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 transition-all ${
                                isDone
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : isCurrent
                                  ? 'bg-blue-900 text-white ring-4 ring-amber-300 shadow-md scale-105'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 pt-1">
                              <div className="flex items-center justify-between">
                                <div
                                  className={`text-xs font-bold ${
                                    isCurrent ? 'text-blue-950 font-black' : isDone ? 'text-emerald-800' : 'text-slate-500'
                                  }`}
                                >
                                  {lang === 'hi' ? stg.titleHi : stg.titleEn}
                                </div>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    {lang === 'hi' ? 'वर्तमान स्थिति' : 'Active Stage'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {lang === 'hi' ? stg.descHi : stg.descEn}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items & Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Items List (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {lang === 'hi' ? 'ऑर्डर में शामिल उत्पाद (Items in Order)' : 'Items in Order'} ({activeOrder.items.length})
                  </h4>

                  <div className="divide-y divide-slate-100 space-y-2">
                    {activeOrder.items.map((item, i) => (
                      <div key={i} className="pt-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {lang === 'hi' ? item.nameHi : item.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              ₹{item.price} × {item.quantity} {item.unit}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-sm text-slate-900">
                          ₹{item.total}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>{lang === 'hi' ? 'उप-योग (Subtotal):' : 'Subtotal:'}</span>
                      <span className="font-semibold text-slate-900">₹{activeOrder.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === 'hi' ? 'डिलीवरी शुल्क:' : 'Delivery Fee:'}</span>
                      <span className="font-semibold text-slate-900">
                        {activeOrder.deliveryCharge === 0 ? (
                          <span className="text-emerald-600 font-bold">FREE</span>
                        ) : (
                          `₹${activeOrder.deliveryCharge}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100 text-sm font-extrabold text-blue-950">
                      <span>{lang === 'hi' ? 'कुल देय राशि:' : 'Grand Total:'}</span>
                      <span className="text-blue-900">₹{activeOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address & Payment Summary (1 col) */}
                <div className="space-y-4">
                  {/* Address */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{lang === 'hi' ? 'डिलीवरी पता' : 'Shipping Address'}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {activeOrder.shippingAddress.fullName}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {activeOrder.shippingAddress.addressLine}, {activeOrder.shippingAddress.city},{' '}
                      {activeOrder.shippingAddress.district} ({activeOrder.shippingAddress.pinCode})
                    </p>
                    <div className="text-xs font-semibold text-blue-900 pt-1">
                      📱 +91 {activeOrder.shippingAddress.mobile}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {activeOrder.paymentMethod === 'cod' ? (
                        <Banknote className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{lang === 'hi' ? 'भुगतान विवरण' : 'Payment Details'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{lang === 'hi' ? 'माध्यम:' : 'Method:'}</span>
                      <span className="font-bold uppercase text-slate-900">
                        {activeOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Paytm UPI QR'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{lang === 'hi' ? 'स्थिति:' : 'Status:'}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                          activeOrder.paymentStatus === 'verified' || activeOrder.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {activeOrder.paymentStatus}
                      </span>
                    </div>
                    {activeOrder.txnRef && (
                      <div className="text-[11px] text-slate-400 font-mono pt-1 truncate">
                        Ref: {activeOrder.txnRef}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span>🙏 SHYAM BABA MILK HOUSE • सकित (एटा)</span>
            <span>•</span>
            <span className="font-mono text-blue-700">7078376806@ptyes</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onGoHome && (
              <button
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              {lang === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
