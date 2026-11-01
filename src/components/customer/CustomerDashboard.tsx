import React, { useState, useEffect } from 'react';
import { CustomerProfile, MonthlyBill, PaymentRecord, Language, CartItem, DairyProduct, DairyOrder } from '../../types/dairy';
import { translations } from '../../i18n/translations';
import { MonthlyCalendar } from '../calendar/MonthlyCalendar';
import { PaymentCard } from '../payments/PaymentCard';
import { DairyStore } from '../store/DairyStore';
import { CartCheckoutModal } from '../store/CartCheckoutModal';
import { OrdersListModal } from '../store/OrdersListModal';
import {
  Calendar as CalendarIcon,
  CreditCard,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  ShoppingBag,
  Package,
  Droplet,
  ArrowLeft,
  Home,
  Truck,
  Sparkles
} from 'lucide-react';
import { OrderTrackingModal } from '../store/OrderTrackingModal';
import { CustomerBillsSection } from './CustomerBillsSection';

interface Props {
  customer: CustomerProfile;
  lang: Language;
  onOpenAIChat: () => void;
  onOpenAIMaker?: () => void;
}

export const CustomerDashboard: React.FC<Props> = ({
  customer,
  lang,
  onOpenAIChat,
  onOpenAIMaker,
}) => {
  const t = translations[lang];
  const [currentMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [bill, setBill] = useState<MonthlyBill | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [todayStatus, setTodayStatus] = useState<{ status: string; liters: number; rate: number } | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'store' | 'calendar' | 'orders' | 'payments'>('overview');

  // Cart & Orders & Tracking modal states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | undefined>(undefined);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchCustomerData = async () => {
    try {
      // 1. Fetch current bill
      const billRes = await fetch(`/api/bills?customerId=${customer.id}&month=${currentMonth}`);
      if (billRes.ok) {
        const bills = await billRes.json();
        if (bills.length > 0) {
          setBill(bills[0]);
        } else {
          const calcRes = await fetch('/api/bills/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: customer.id, month: currentMonth }),
          });
          if (calcRes.ok) {
            const data = await calcRes.json();
            setBill(data.bill);
          }
        }
      }

      // 2. Fetch payments
      const payRes = await fetch(`/api/payments?customerId=${customer.id}`);
      if (payRes.ok) {
        setPayments(await payRes.json());
      }

      // 3. Fetch today's delivery
      const todayStr = new Date().toISOString().split('T')[0];
      const delRes = await fetch(`/api/deliveries?customerId=${customer.id}&month=${currentMonth}`);
      if (delRes.ok) {
        const dels = await delRes.json();
        const todayRec = dels.find((d: { date: string }) => d.date === todayStr);
        if (todayRec) {
          setTodayStatus({
            status: todayRec.status,
            liters: todayRec.milkQuantityLiters,
            rate: todayRec.ratePerLiter,
          });
        } else {
          setTodayStatus({
            status: 'pending',
            liters: customer.dailyQuantityLiters,
            rate: customer.customRatePerLiter || 60,
          });
        }
      }
    } catch (err) {
      console.error('Error loading customer dashboard:', err);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [customer.id, currentMonth]);

  const effectiveRate = customer.customRatePerLiter || (bill ? bill.milkRate : 60);

  // Cart Handlers
  const handleAddToCart = (product: DairyProduct) => {
    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((it) => it.product.id !== productId);
      }
      return prev.map((it) =>
        it.product.id === productId ? { ...it, quantity } : it
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Welcome Greeting & Quick Status Card */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <span>🙏 जय श्री श्याम</span>
              <span>•</span>
              <span>{t.tagline}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t.welcomeUser}, {customer.fullName}!
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 flex items-center gap-2">
              <span>📱 +91 {customer.mobile}</span>
              <span>•</span>
              <span>{customer.city || 'Sakit'}, {customer.district || 'Etah'} ({customer.pinCode || '207121'})</span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-blue-950 text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.myCart} ({cart.reduce((s, it) => s + it.quantity, 0)})</span>
            </button>

            <button
              onClick={() => {
                setSelectedTrackingOrderId(undefined);
                setIsTrackingOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-950/90 hover:bg-blue-900 text-white text-xs sm:text-sm font-bold border border-amber-400/50 shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95"
            >
              <Truck className="w-4 h-4 text-amber-300" />
              <span>{lang === 'hi' ? 'लाइव ट्रैक ऑर्डर' : 'Track Orders'}</span>
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t.scanAndPay}</span>
            </button>

            <button
              onClick={onOpenAIChat}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 flex items-center gap-2 cursor-pointer transition"
            >
              <MessageSquare className="w-4 h-4 text-amber-300" />
              <span>{t.aiCustomerSupport}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 CORE KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Today's Status */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{t.todayStatus}</span>
            <Droplet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-base sm:text-lg font-extrabold text-blue-950 flex items-center gap-1.5">
            {todayStatus?.status === 'delivered' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{todayStatus.liters} L {lang === 'hi' ? 'वितरित' : 'Delivered'}</span>
              </>
            ) : todayStatus?.status === 'cancelled' ? (
              <>
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="text-rose-700">{lang === 'hi' ? 'आज रद्द' : 'Cancelled'}</span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{customer.dailyQuantityLiters} L {lang === 'hi' ? 'प्रतीक्षित' : 'Pending'}</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {t.dailyQuantity}: {customer.dailyQuantityLiters} L / ₹{effectiveRate}/L
          </div>
        </div>

        {/* Metric 2: Month Total Liters */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{t.monthTotalLiters}</span>
            <span className="text-blue-700 font-bold">🥛</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-blue-950">
            {bill ? bill.totalDeliveredLiters : 0} <span className="text-xs font-normal text-slate-500">Liters</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {bill ? `${bill.deliveredDays} ${lang === 'hi' ? 'दिन प्राप्त' : 'days delivered'}, ${bill.cancelledDays} ${lang === 'hi' ? 'दिन रद्द' : 'cancelled'}` : '-'}
          </div>
        </div>

        {/* Metric 3: Monthly Total Bill */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{t.monthTotalBill}</span>
            <span className="text-emerald-700 font-bold">₹</span>
          </div>
          <div className="text-base sm:text-lg font-extrabold text-slate-900">
            ₹{bill ? bill.totalMilkAmount + bill.extraMilkAmount : 0}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            {lang === 'hi' ? 'भुगतान किया:' : 'Paid:'} ₹{bill ? bill.paymentsReceived : 0}
          </div>
        </div>

        {/* Metric 4: Remaining Balance Due */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs space-y-1 bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>{t.remainingBalance}</span>
            <span className="text-amber-600 font-bold">!</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-700">
            ₹{bill ? bill.remainingBalance : 0}
          </div>
          <div className="text-[11px] text-slate-500">
            {bill?.remainingBalance === 0 ? (
              <span className="text-emerald-700 font-bold">✓ {lang === 'hi' ? 'बिल चुकता है' : 'All Clear'}</span>
            ) : (
              <span className="text-amber-700 font-medium">{lang === 'hi' ? 'QR से भुगतान करें' : 'Payable online'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs sm:text-sm font-bold">
        {activeTab !== 'overview' && (
          <button
            onClick={() => setActiveTab('overview')}
            className="pb-3 px-3 rounded-lg text-blue-900 bg-blue-50 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5 shrink-0 border border-blue-200"
            title={lang === 'hi' ? 'डैशबोर्ड मुख्य पृष्ठ पर वापस जाएं' : 'Back to Dashboard Overview'}
          >
            <ArrowLeft className="w-4 h-4 text-blue-700" />
            <span>{lang === 'hi' ? '← मुख्य पृष्ठ' : '← Overview'}</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{lang === 'hi' ? 'मासिक सारांश' : 'Overview'}</span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'bills'
              ? 'border-blue-900 text-blue-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-500" />
          <span>{lang === 'hi' ? 'मेरे दूध के बिल (My Bills)' : 'My Monthly Bills'}</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'store'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-600" />
          <span>{t.store}</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>{t.monthlyCalendar}</span>
        </button>

        <button
          onClick={() => setIsOrdersOpen(true)}
          className="pb-3 px-3.5 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
        >
          <Package className="w-4 h-4" />
          <span>{t.myOrders}</span>
        </button>

        <button
          onClick={() => {
            setSelectedTrackingOrderId(undefined);
            setIsTrackingOpen(true);
          }}
          className="pb-3 px-3.5 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
        >
          <Truck className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'hi' ? 'लाइव ट्रैक ऑर्डर' : 'Track Orders'}</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-3.5 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{t.paymentHistory}</span>
        </button>

        {onOpenAIMaker && (
          <button
            onClick={onOpenAIMaker}
            className="pb-3 px-3.5 border-b-2 border-transparent text-amber-700 hover:text-amber-800 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap font-bold"
            title={lang === 'hi' ? 'AI मेकर स्टूडियो खोलें' : 'Open AI Maker Studio'}
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-200" />
            <span>{lang === 'hi' ? '✨ AI मेकर (रेसिपी/पोस्टर)' : '✨ AI Maker'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW & MONTHLY BILL DETAILS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'hi' ? 'मासिक दूध बिल का सटीक विवरण' : 'Monthly Milk Bill Breakdown'}
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-50 text-blue-900 border border-blue-200">
                {bill ? bill.monthName : currentMonth}
              </span>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">{t.dailyQuantity}:</span>
                <span className="font-bold text-slate-900">{customer.dailyQuantityLiters} Liters</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">{t.ratePerLiter}:</span>
                <span className="font-bold text-slate-900">₹{effectiveRate} / Liter</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">{lang === 'hi' ? 'कुल दूध प्राप्त दिन:' : 'Delivered Days:'}</span>
                <span className="font-bold text-emerald-700">{bill ? bill.deliveredDays : 0} {lang === 'hi' ? 'दिन' : 'days'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">{lang === 'hi' ? 'रद्द दिन (बिल से शून्य चार्ज):' : 'Cancelled Days (Zero charge):'}</span>
                <span className="font-bold text-rose-600">{bill ? bill.cancelledDays : 0} {lang === 'hi' ? 'दिन' : 'days'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">{t.monthTotalLiters}:</span>
                <span className="font-bold text-blue-900">{bill ? bill.totalDeliveredLiters : 0} Liters</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">{lang === 'hi' ? 'नियमित दूध की राशि:' : 'Milk Amount:'}</span>
                <span className="font-bold text-slate-900">₹{bill ? bill.totalMilkAmount : 0}</span>
              </div>
              {bill && bill.extraMilkAmount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">{lang === 'hi' ? 'अतिरिक्त दूध राशि:' : 'Extra Milk:'}</span>
                  <span className="font-bold text-amber-700">+₹{bill.extraMilkAmount}</span>
                </div>
              )}
              {bill && bill.previousBalance > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">{lang === 'hi' ? 'पिछला बकाया:' : 'Previous Balance:'}</span>
                  <span className="font-bold text-rose-700">+₹{bill.previousBalance}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">{lang === 'hi' ? 'जमा भुगतान (Paid):' : 'Payments Received:'}</span>
                <span className="font-bold text-emerald-700">-₹{bill ? bill.paymentsReceived : 0}</span>
              </div>
              <div className="flex justify-between py-2 pt-3 border-t-2 border-slate-200 text-sm sm:text-base">
                <span className="font-extrabold text-blue-950">{t.remainingBalance}:</span>
                <span className="font-black text-rose-700">₹{bill ? bill.remainingBalance : 0}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => setActiveTab('bills')}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-blue-800" />
                <span>{lang === 'hi' ? '📥 आधिकारिक बिल पोस्टर देखें व PDF डाउनलोड करें' : 'View Official Poster & Download PDF'}</span>
              </button>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{lang === 'hi' ? 'आधिकारिक Paytm QR से भुगतान करें' : 'Pay via Paytm UPI QR'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-b from-blue-50 to-white rounded-3xl border border-blue-200 p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center mx-auto shadow-md">
                <ShoppingBag className="w-6 h-6 text-amber-300" />
              </div>
              <h4 className="text-sm font-extrabold text-blue-950">
                {lang === 'hi' ? 'ताजा डेयरी उत्पाद ऑर्डर करें' : 'Order Fresh Dairy Products'}
              </h4>
              <p className="text-xs text-slate-600">
                {lang === 'hi'
                  ? 'गाय/भैंस का दूध, मलाई पनीर, मटका दही व शुद्ध वैदिक देसी घी ऑनलाइन मंगाएं।'
                  : 'Order fresh milk, clay pot curd, soft paneer and pure ghee online.'}
              </p>
              <button
                onClick={() => setActiveTab('store')}
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {t.store} देखें
              </button>
            </div>

            <div className="bg-amber-50/70 rounded-3xl border border-amber-200 p-5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>{lang === 'hi' ? 'नियम व सेवा शर्तें' : 'Milk Delivery Policy'}</span>
              </div>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>{lang === 'hi' ? 'रद्द की गई डिलीवरी का बिल में कोई शुल्क नहीं लगता।' : 'Cancelled delivery is strictly zero charged.'}</li>
                <li>{lang === 'hi' ? '₹499+ के ऑनलाइन ऑर्डर पर मुफ़्त डिलीवरी उपलब्ध।' : 'Free delivery on store orders above ₹499.'}</li>
                <li>{lang === 'hi' ? 'किसी भी प्रश्न हेतु AI सहायता से 24/7 संपर्क करें।' : 'Ask AI Assistant 24/7 for instant answers.'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MY MONTHLY BILLS & POSTER DOWNLOAD */}
      {activeTab === 'bills' && (
        <CustomerBillsSection
          customer={customer}
          lang={lang}
        />
      )}

      {/* TAB 2: ONLINE STORE */}
      {activeTab === 'store' && (
        <DairyStore
          lang={lang}
          customer={customer}
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      {/* TAB 3: MONTHLY CALENDAR */}
      {activeTab === 'calendar' && (
        <MonthlyCalendar
          lang={lang}
          customerId={customer.id}
          isOwner={false}
        />
      )}

      {/* TAB 4: PAYMENT HISTORY */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              {t.paymentHistory}
            </h3>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-3 py-1.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition cursor-pointer"
            >
              + {lang === 'hi' ? 'नया भुगतान जमा करें' : 'Submit Payment'}
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {lang === 'hi' ? 'अभी तक कोई भुगतान रिकॉर्ड नहीं मिला।' : 'No payment records found yet.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <div>
                    <div className="font-bold text-slate-900">₹{p.amount}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Ref: {p.transactionReference || '-'} • {new Date(p.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    {p.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.paymentVerified}</span>
                      </span>
                    ) : p.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{t.paymentRejected}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t.paymentSubmitted}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CART & CHECKOUT MODAL */}
      {isCartOpen && (
        <CartCheckoutModal
          lang={lang}
          cart={cart}
          customer={customer}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={() => setCart([])}
          onClose={() => setIsCartOpen(false)}
          onOrderSuccess={(order) => {
            setIsCartOpen(false);
            setSelectedTrackingOrderId(order.id);
            setIsTrackingOpen(true);
          }}
        />
      )}

      {/* ORDERS LIST MODAL */}
      {isOrdersOpen && (
        <OrdersListModal
          lang={lang}
          customerId={customer.id}
          onClose={() => setIsOrdersOpen(false)}
          onTrackOrder={(orderId) => {
            setIsOrdersOpen(false);
            setSelectedTrackingOrderId(orderId);
            setIsTrackingOpen(true);
          }}
        />
      )}

      {/* REAL-TIME ORDER TRACKING MODAL (FIRESTORE) */}
      {isTrackingOpen && (
        <OrderTrackingModal
          lang={lang}
          customerId={customer.id}
          customerMobile={customer.mobile}
          initialOrderId={selectedTrackingOrderId}
          onClose={() => {
            setIsTrackingOpen(false);
            setSelectedTrackingOrderId(undefined);
          }}
        />
      )}

      {/* ONLINE PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-auto w-full max-w-xl">
            <PaymentCard
              lang={lang}
              customer={customer}
              currentBill={bill}
              onClose={() => setShowPaymentModal(false)}
              onPaymentSubmitted={() => fetchCustomerData()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
