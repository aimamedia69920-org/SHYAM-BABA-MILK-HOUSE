import React, { useState, useEffect } from 'react';
import { Language, DairyOrder } from '../../types/dairy';
import { translations } from '../../i18n/translations';
import {
  Package,
  X,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Calendar,
  CreditCard,
  Banknote
} from 'lucide-react';

interface Props {
  lang: Language;
  customerId?: string;
  onClose: () => void;
  onTrackOrder?: (orderId: string) => void;
}

export const OrdersListModal: React.FC<Props> = ({
  lang,
  customerId,
  onClose,
  onTrackOrder,
}) => {
  const t = translations[lang];
  const [orders, setOrders] = useState<DairyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [customerId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/orders', window.location.origin);
      if (customerId) url.searchParams.set('customerId', customerId);
      const res = await fetch(url.toString());
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: DairyOrder['orderStatus']) => {
    switch (status) {
      case 'placed':
        return {
          label: lang === 'hi' ? 'ऑर्डर प्राप्त हुआ' : 'Order Placed',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
        };
      case 'confirmed':
        return {
          label: lang === 'hi' ? 'स्वीकृत' : 'Confirmed',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: CheckCircle2,
        };
      case 'processing':
        return {
          label: lang === 'hi' ? 'पैक हो रहा है' : 'Processing',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Package,
        };
      case 'out_for_delivery':
        return {
          label: lang === 'hi' ? 'डिलीवरी के लिए निकला' : 'Out for Delivery',
          color: 'bg-sky-100 text-sky-800 border-sky-200',
          icon: Truck,
        };
      case 'delivered':
        return {
          label: lang === 'hi' ? 'वितरित (Delivered)' : 'Delivered',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'cancelled':
        return {
          label: lang === 'hi' ? 'रद्द' : 'Cancelled',
          color: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: AlertCircle,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-blue-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-300" />
            <h3 className="text-base sm:text-lg font-bold">
              {t.myOrders} ({orders.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">
              {lang === 'hi' ? 'ऑर्डर्स लोड हो रहे हैं...' : 'Loading orders...'}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Package className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                {lang === 'hi' ? 'अभी तक कोई ऑनलाइन ऑर्डर नहीं किया गया है।' : 'No orders placed yet.'}
              </p>
            </div>
          ) : (
            orders.map((ord) => {
              const status = getStatusBadge(ord.orderStatus);
              const StatusIcon = status.icon;

              return (
                <div
                  key={ord.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="font-mono text-xs font-black text-blue-950">
                        {ord.orderNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(ord.placedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{status.label}</span>
                      </span>
                      {onTrackOrder && (
                        <button
                          type="button"
                          onClick={() => onTrackOrder(ord.id)}
                          className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-1 shadow-xs cursor-pointer transition active:scale-95"
                          title="Track live status on Firestore"
                        >
                          <Truck className="w-3 h-3 text-amber-300" />
                          <span>{lang === 'hi' ? 'लाइव ट्रैक' : 'Track'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-slate-100 text-xs">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={it.image} alt={it.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <span className="font-bold text-slate-800">
                              {lang === 'hi' ? it.nameHi : it.name}
                            </span>
                            <span className="text-slate-400 text-[10px] ml-1.5">
                              x {it.quantity} ({it.unit})
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900">₹{it.total}</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Address */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span className="truncate max-w-[280px]">
                        {ord.shippingAddress.addressLine}, {ord.shippingAddress.city} ({ord.shippingAddress.pinCode})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-medium">
                        {ord.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paytm UPI'} (
                        <span className="font-bold text-slate-700">{ord.paymentStatus}</span>)
                      </span>
                      <span className="text-sm font-black text-blue-950">
                        ₹{ord.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
