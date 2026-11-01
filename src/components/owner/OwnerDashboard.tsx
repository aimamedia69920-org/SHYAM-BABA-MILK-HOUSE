import React, { useState, useEffect } from 'react';
import {
  OwnerProfile,
  CustomerProfile,
  MonthlyBill,
  PaymentRecord,
  Language,
  MilkRateConfig,
  DairyStats,
  WhatsAppLog,
  DairyProduct,
  ServiceablePinCode,
  DairyOrder,
  OrderStatus
} from '../../types/dairy';
import { translations } from '../../i18n/translations';
import { MonthlyCalendar } from '../calendar/MonthlyCalendar';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  Users,
  TrendingUp,
  CreditCard,
  Calendar as CalendarIcon,
  Send,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Eye,
  Check,
  RefreshCw,
  QrCode,
  AlertTriangle,
  Building2,
  ShieldCheck,
  ShoppingBag,
  Package,
  MapPin,
  Truck,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Home,
  Pencil,
  Camera,
  AlertCircle
} from 'lucide-react';
import { ProductEditModal } from './ProductEditModal';
import { deleteProductFromFirestore, updateOrderStatusInFirestore } from '../../firebase/ordersService';
import { MilkBillPoster } from '../bills/MilkBillPoster';
import { OwnerBillEditModal } from './OwnerBillEditModal';
import { syncBillToFirestore } from '../../firebase/billsService';

interface Props {
  owner: OwnerProfile;
  lang: Language;
  onOpenAIChat: () => void;
  onOwnerProfileUpdated: (updated: OwnerProfile) => void;
  onOpenAIMaker?: () => void;
}

export const OwnerDashboard: React.FC<Props> = ({
  owner,
  lang,
  onOpenAIChat,
  onOwnerProfileUpdated,
  onOpenAIMaker,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<
    'stats' | 'deliveries' | 'orders' | 'products' | 'pincodes' | 'customers' | 'rates' | 'billing' | 'payments' | 'reports' | 'whatsapp' | 'settings'
  >('stats');

  // Core Data States
  const [stats, setStats] = useState<DairyStats | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [rates, setRates] = useState<MilkRateConfig>({
    cow: 60,
    buffalo: 70,
    mix: 65,
    other: 55,
    lastUpdated: '',
  });
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([]);
  const [products, setProducts] = useState<DairyProduct[]>([]);
  const [orders, setOrders] = useState<DairyOrder[]>([]);
  const [pinCodes, setPinCodes] = useState<ServiceablePinCode[]>([]);

  // Selected month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Product edit, photo change & delete states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DairyProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<DairyProduct | null>(null);

  // Bill editing and reference poster preview states
  const [billToEdit, setBillToEdit] = useState<MonthlyBill | null>(null);
  const [billToViewPoster, setBillToViewPoster] = useState<MonthlyBill | null>(null);

  // PIN Code modal
  const [showAddPinModal, setShowAddPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPinCity, setNewPinCity] = useState('');
  const [newPinDistrict, setNewPinDistrict] = useState('');
  const [newPinState, setNewPinState] = useState('Uttar Pradesh');
  const [newPinCod, setNewPinCod] = useState(true);
  const [newPinCharge, setNewPinCharge] = useState('30');
  const [newPinEst, setNewPinEst] = useState('1-2 Days');

  // Customer modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustQuantity, setNewCustQuantity] = useState('1.5');
  const [newCustType, setNewCustType] = useState<'cow' | 'buffalo' | 'mix'>('cow');
  const [newCustCustomRate, setNewCustCustomRate] = useState('');

  const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null);
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);

  // Settings form states
  const [settingsName, setSettingsName] = useState(owner.fullName);
  const [settingsMobile, setSettingsMobile] = useState(owner.mobile);
  const [settingsPin, setSettingsPin] = useState(owner.twoFactorPin);
  const [settingsAddress, setSettingsAddress] = useState(owner.privateAddress);
  const [settingsUpiId, setSettingsUpiId] = useState(owner.upiId);
  const [settingsPayee, setSettingsPayee] = useState(owner.qrPayeeName);
  const [settingsQrImage, setSettingsQrImage] = useState(owner.officialQrImage || '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__PAYMENT_QR_CODE_AI_47e8cd69.png');
  const [settingsAppLogo, setSettingsAppLogo] = useState(owner.appLogo || '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg');
  const [settingsFreeAbove, setSettingsFreeAbove] = useState(owner.freeDeliveryAbove?.toString() || '499');

  // SMS Gateway / DLT Settings
  const [settingsMsg91Key, setSettingsMsg91Key] = useState(owner.msg91AuthKey || '');
  const [settingsMsg91Sender, setSettingsMsg91Sender] = useState(owner.msg91SenderId || 'SHYAMB');
  const [settingsMsg91Template, setSettingsMsg91Template] = useState(owner.msg91TemplateId || '');
  const [settingsDltEntity, setSettingsDltEntity] = useState(owner.dltEntityId || '');
  const [smsTestMobile, setSmsTestMobile] = useState(owner.mobile);
  const [smsTestStatus, setSmsTestStatus] = useState<string | null>(null);

  // WhatsApp Cloud API
  const [settingsWhatsappId, setSettingsWhatsappId] = useState(owner.metaWhatsappPhoneId || '');
  const [settingsWhatsappToken, setSettingsWhatsappToken] = useState(owner.metaWhatsappAccessToken || '');

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [st, cu, ra, bi, pa, wa, pr, ord, pi] = await Promise.all([
        fetch('/api/analytics/stats').then(r => r.ok ? r.json() : null),
        fetch('/api/customers').then(r => r.ok ? r.json() : []),
        fetch('/api/rates').then(r => r.ok ? r.json() : null),
        fetch(`/api/bills?month=${selectedMonth}`).then(r => r.ok ? r.json() : []),
        fetch('/api/payments').then(r => r.ok ? r.json() : []),
        fetch('/api/whatsapp/logs').then(r => r.ok ? r.json() : []),
        fetch('/api/products').then(r => r.ok ? r.json() : []),
        fetch('/api/orders').then(r => r.ok ? r.json() : []),
        fetch('/api/serviceability/pincodes').then(r => r.ok ? r.json() : []),
      ]);

      if (st) setStats(st);
      if (cu) setCustomers(cu);
      if (ra) setRates(ra);
      if (bi) setBills(bi);
      if (pa) setPayments(pa);
      if (wa) setWhatsappLogs(wa);
      if (pr) setProducts(pr);
      if (ord) setOrders(ord);
      if (pi) setPinCodes(pi);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedMonth]);

  // Bulk Deliver Today
  const handleBulkDeliverToday = async () => {
    if (!window.confirm(lang === 'hi' ? 'आज का नियमित दूध वितरण सभी सक्रिय ग्राहकों के लिए दर्ज करें?' : 'Record today delivery for all active customers?')) return;
    try {
      const res = await fetch('/api/deliveries/bulk-today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      showNotification(data.message || 'Deliveries recorded!');
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Product Management Handlers
  const handleOpenEditProduct = (prod: DairyProduct) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        await deleteProductFromFirestore(productToDelete.id);
        showNotification(
          lang === 'hi'
            ? `उत्पाद "${productToDelete.nameHi}" स्टोर से हटा दिया गया`
            : `Product "${productToDelete.name}" removed from store`
        );
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProductToDelete(null);
    }
  };

  // Add PIN Code
  const handleAddPinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || !newPinCity) return;
    try {
      const res = await fetch('/api/serviceability/pincodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinCode: newPin,
          city: newPinCity,
          district: newPinDistrict || newPinCity,
          state: newPinState,
          codAvailable: newPinCod,
          deliveryCharge: parseFloat(newPinCharge) || 0,
          estimatedDelivery: newPinEst,
        }),
      });
      if (res.ok) {
        setShowAddPinModal(false);
        setNewPin('');
        setNewPinCity('');
        showNotification(lang === 'hi' ? 'नया पिन कोड सेवा क्षेत्र में जोड़ा गया!' : 'PIN code added to service areas!');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete PIN Code
  const handleDeletePinCode = async (pin: string) => {
    try {
      await fetch(`/api/serviceability/pincodes/${pin}`, { method: 'DELETE' });
      showNotification('PIN code removed');
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: status }),
      });
      if (res.ok) {
        // Real-time Firestore sync for customer live tracking
        await updateOrderStatusInFirestore(orderId, status);
        showNotification(
          lang === 'hi'
            ? `ऑर्डर स्थिति अपडेट: ${status}`
            : `Order status updated to ${status}`
        );
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Verify Order Payment
  const handleVerifyOrderPayment = async (orderId: string, paymentStatus: 'verified' | 'paid' | 'rejected') => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      });
      if (res.ok) {
        showNotification(`Order payment marked as ${paymentStatus}`);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Test SMS Dispatch
  const handleTestSms = async () => {
    setSmsTestStatus('Sending test OTP via configured SMS Gateway...');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: smsTestMobile }),
      });
      const data = await res.json();
      setSmsTestStatus(
        data.success
          ? `✓ Status: ${data.providerStatus} | Diagnosis: ${data.providerDiagnosis}`
          : `✕ Error: ${data.error}`
      );
    } catch (err: unknown) {
      setSmsTestStatus(`Network error: ${err instanceof Error ? err.message : 'failed'}`);
    }
  };

  // Save Rates
  const handleSaveRates = async () => {
    try {
      const res = await fetch('/api/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rates),
      });
      if (res.ok) {
        showNotification(lang === 'hi' ? 'दूध दरें अपडेट हुईं!' : 'Rates saved!');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Generate All Bills
  const handleGenerateAllBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bills/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth }),
      });
      const data = await res.json();
      if (data.bills && Array.isArray(data.bills)) {
        data.bills.forEach((b: MonthlyBill) => {
          syncBillToFirestore(b);
        });
      }
      showNotification(`${data.count || 0} bills generated & synced!`);
      loadAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Send WhatsApp Bill
  const handleSendWhatsappBill = async (billId: string) => {
    try {
      const res = await fetch('/api/whatsapp/send-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId }),
      });
      const data = await res.json();
      if (data.directWhatsappUrl) {
        window.open(data.directWhatsappUrl, '_blank');
      }
      showNotification('WhatsApp bill initiated!');
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Verify Milk Payment
  const handleVerifyPayment = async (payId: string, status: 'verified' | 'rejected') => {
    const reason = status === 'rejected' ? prompt('Rejection reason:') : undefined;
    if (status === 'rejected' && reason === null) return;
    try {
      const res = await fetch(`/api/payments/${payId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      if (res.ok) {
        showNotification(status === 'verified' ? 'Payment verified!' : 'Payment rejected');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('SHYAM BABA MILK HOUSE - Business Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Month: ${selectedMonth} | Generated by: ${owner.fullName}`, 14, 28);
    let y = 40;
    bills.forEach((b, idx) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(`${idx + 1}. ${b.customerName} - ${b.totalDeliveredLiters}L | Bill: Rs.${b.totalMilkAmount} | Bal: Rs.${b.remainingBalance}`, 14, y);
      y += 6;
    });
    doc.save(`ShyamBaba_Dairy_${selectedMonth}.pdf`);
    showNotification('PDF downloaded');
  };

  // Export Excel
  const handleExportExcel = () => {
    const data = bills.map(b => ({
      'Customer': b.customerName,
      'Mobile': b.customerMobile,
      'Liters': b.totalDeliveredLiters,
      'Delivered Days': b.deliveredDays,
      'Cancelled Days': b.cancelledDays,
      'Total Amount': b.totalMilkAmount,
      'Paid Amount': b.paymentsReceived,
      'Balance Due': b.remainingBalance,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Bills');
    XLSX.writeFile(wb, `ShyamBaba_Bills_${selectedMonth}.xlsx`);
    showNotification('Excel downloaded');
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/owner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: settingsName,
          mobile: settingsMobile,
          twoFactorPin: settingsPin,
          privateAddress: settingsAddress,
          upiId: settingsUpiId,
          qrPayeeName: settingsPayee,
          officialQrImage: settingsQrImage,
          appLogo: settingsAppLogo,
          freeDeliveryAbove: parseFloat(settingsFreeAbove),
          msg91AuthKey: settingsMsg91Key,
          msg91SenderId: settingsMsg91Sender,
          msg91TemplateId: settingsMsg91Template,
          dltEntityId: settingsDltEntity,
          metaWhatsappPhoneId: settingsWhatsappId,
          metaWhatsappAccessToken: settingsWhatsappToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Update failed');
      onOwnerProfileUpdated(data.owner);
      showNotification(lang === 'hi' ? 'मालिक सेटिंग्स सुरक्षित की गईं!' : 'Owner settings saved!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Toast */}
      {actionNotice && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-2 animate-bounce text-xs sm:text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.ownerTitle}</span>
              <span>•</span>
              <span>{owner.fullName}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {lang === 'hi' ? 'श्याम बाबा मिल्क हाउस - पूर्ण प्रशासनिक नियंत्रण' : 'SHYAM BABA MILK HOUSE - Business Admin'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200">
              📱 +91 {owner.mobile} • {customers.length} Subscribers • {orders.length} Store Orders • UPI: {owner.upiId}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleBulkDeliverToday}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{lang === 'hi' ? 'आज का दूध 1-क्लिक दर्ज करें' : 'Deliver Today (All)'}</span>
            </button>

            <button
              onClick={onOpenAIChat}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-blue-950 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{lang === 'hi' ? 'मालिक AI सहायक' : 'Owner AI Assistant'}</span>
            </button>

            {onOpenAIMaker && (
              <button
                onClick={onOpenAIMaker}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-blue-950 text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer shadow-lg transform hover:scale-105 active:scale-95 transition"
              >
                <Sparkles className="w-4 h-4 text-blue-950 fill-amber-200" />
                <span>{lang === 'hi' ? '✨ AI मेकर स्टूडियो' : '✨ AI Maker Studio'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs sm:text-sm font-bold scrollbar-none">
        {activeTab !== 'stats' && (
          <button
            onClick={() => setActiveTab('stats')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 transition cursor-pointer whitespace-nowrap shadow-xs"
            title={lang === 'hi' ? 'मुख्य डैशबोर्ड अवलोकन पर वापस जाएं' : 'Back to Dashboard Overview'}
          >
            <ArrowLeft className="w-4 h-4 text-blue-700" />
            <span>{lang === 'hi' ? '← मुख्य पृष्ठ' : '← Overview'}</span>
          </button>
        )}

        {[
          { id: 'stats', label: t.dashboard, icon: TrendingUp },
          { id: 'orders', label: lang === 'hi' ? `ऑर्डर्स (${orders.length})` : `Orders (${orders.length})`, icon: Package },
          { id: 'products', label: lang === 'hi' ? `स्टोर उत्पाद (${products.length})` : `Products (${products.length})`, icon: ShoppingBag },
          { id: 'pincodes', label: lang === 'hi' ? `पिन कोड क्षेत्र (${pinCodes.length})` : `PIN Codes (${pinCodes.length})`, icon: MapPin },
          { id: 'deliveries', label: t.dailyTracking, icon: CalendarIcon },
          { id: 'customers', label: lang === 'hi' ? `ग्राहक (${customers.length})` : `Customers (${customers.length})`, icon: Users },
          { id: 'rates', label: t.rates, icon: CreditCard },
          { id: 'billing', label: t.billing, icon: Download },
          { id: 'payments', label: t.payments, icon: QrCode },
          { id: 'reports', label: t.reports, icon: Download },
          { id: 'whatsapp', label: 'WhatsApp', icon: Send },
          { id: 'settings', label: t.settings, icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STATS OVERVIEW */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500">{t.totalCustomers}</span>
              <div className="text-2xl font-black text-blue-950">{stats?.totalCustomers || 0}</div>
              <div className="text-[11px] text-emerald-600 font-semibold">{stats?.activeCustomers || 0} {t.activeCustomers}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500">{t.todayDeliveries}</span>
              <div className="text-2xl font-black text-blue-900">{stats?.todayMilkDeliveredLiters || 0} L</div>
              <div className="text-[11px] text-blue-700 font-semibold">{t.todaySales}: ₹{stats?.todaySalesAmount || 0}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500">{t.totalOrders}</span>
              <div className="text-2xl font-black text-indigo-950">{orders.length}</div>
              <div className="text-[11px] text-indigo-700 font-semibold">{orders.filter(o => o.orderStatus === 'placed').length} Pending</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1 bg-amber-50/40">
              <span className="text-xs text-amber-800 font-semibold">{t.pendingPayments}</span>
              <div className="text-2xl font-black text-rose-700">₹{stats?.pendingPaymentsTotal || 0}</div>
              <div className="text-[11px] text-slate-500">Unpaid dues</div>
            </div>
          </div>

          {/* Official QR Code & Logo Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>{t.officialQrTitle} (Paytm UPI)</span>
              </h3>
              <div className="flex items-center gap-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                <img
                  src={owner.officialQrImage || '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__PAYMENT_QR_CODE_AI_47e8cd69.png'}
                  alt="Official Paytm UPI QR"
                  className="w-20 h-24 object-contain rounded-xl border border-slate-200 bg-white shadow-xs"
                />
                <div className="text-xs space-y-1">
                  <div className="text-slate-500 font-medium">{t.officialUpiId}:</div>
                  <div className="font-mono font-bold text-blue-900">{owner.upiId}</div>
                  <div className="text-slate-500 font-medium">{t.officialPayee}: <span className="font-bold text-slate-800">{owner.qrPayeeName}</span></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{lang === 'hi' ? 'आधिकारिक लोगो व ब्रांड पहचान' : 'Official Logo & Brand'}</span>
              </h3>
              <div className="flex items-center gap-4 p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                <img
                  src={owner.appLogo || '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg'}
                  alt="Logo"
                  className="w-20 h-20 object-cover rounded-full border-2 border-amber-400 shadow-md"
                />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-blue-950 text-sm">{owner.businessName}</div>
                  <div className="text-amber-800 font-bold">{t.tagline}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORE ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t.ordersManage} ({orders.length})</h3>
              <p className="text-xs text-slate-500">View customer store orders, approve payments, and update dispatch status</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-950">{o.orderNumber}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{o.customerName}</div>
                      <div className="text-[11px] text-slate-400">{o.customerMobile} • {o.shippingAddress.pinCode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {o.items.map(it => `${it.name} (x${it.quantity})`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900">₹{o.totalAmount}</td>
                    <td className="py-2.5 px-3">
                      <span className="uppercase text-[11px] font-bold text-blue-900">{o.paymentMethod}</span>
                      {o.screenshotUrl && (
                        <button
                          onClick={() => setViewScreenshotUrl(o.screenshotUrl || null)}
                          className="ml-1 text-[10px] text-blue-600 underline block cursor-pointer"
                        >
                          View Receipt
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={o.orderStatus}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                        className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                      >
                        <option value="placed">Placed</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {o.paymentStatus === 'submitted' && (
                        <button
                          onClick={() => handleVerifyOrderPayment(o.id, 'verified')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                        >
                          Verify Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-900" />
                <h3 className="text-lg font-black text-slate-900">
                  {lang === 'hi' ? 'स्टोर उत्पाद प्रबंधन' : 'Store Products Management'} ({products.length})
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'hi'
                  ? 'उत्पाद विवरण, दरें (मूल्य), नई फ़ोटो अपलोड करें, स्टॉक बदलें या उत्पाद हटाएं'
                  : 'Edit product details, prices, upload photos, manage stock and delete items'}
              </p>
            </div>
            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-800 transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'hi' ? '+ नया उत्पाद जोड़ें' : '+ Add New Product'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-3xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-3"
              >
                <div className="flex gap-3.5">
                  {/* Product Image with Change Photo action */}
                  <div className="relative group shrink-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 shadow-inner"
                    />
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="absolute inset-0 bg-blue-950/60 text-white opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-[10px] font-bold transition-opacity cursor-pointer backdrop-blur-2xs"
                      title={lang === 'hi' ? 'फ़ोटो बदलें' : 'Change Photo'}
                    >
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>{lang === 'hi' ? 'फ़ोटो' : 'Photo'}</span>
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                        {p.nameHi}
                      </span>
                      {p.isFeatured && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold shrink-0">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{p.name}</div>

                    <div className="flex items-baseline gap-1.5 pt-0.5">
                      <span className="font-black text-blue-950 text-base sm:text-lg">
                        ₹{p.price}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/ {p.unit}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{p.originalPrice}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full ${
                          p.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.inStock ? `Stock: ${p.stockQuantity}` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Explicit Action Buttons: Edit, Change Photo, Delete */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title={lang === 'hi' ? 'उत्पाद विवरण व दरें संपादित करें' : 'Edit Product'}
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-700" />
                      <span>{lang === 'hi' ? 'एडिट करें' : 'Edit'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title={lang === 'hi' ? 'उत्पाद की तस्वीर बदलें' : 'Change Product Image'}
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-700" />
                      <span className="hidden sm:inline">{lang === 'hi' ? 'फ़ोटो' : 'Photo'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setProductToDelete(p)}
                    className="p-1.5 px-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    title={lang === 'hi' ? 'उत्पाद स्टोर से हटाएं' : 'Delete Product'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{lang === 'hi' ? 'हटाएं' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PIN CODES & SERVICEABLE AREAS */}
      {activeTab === 'pincodes' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t.pincodesManage} ({pinCodes.length})</h3>
              <p className="text-xs text-slate-500">Configure serviceable Indian PIN codes, COD eligibility & delivery charges</p>
            </div>
            <button
              onClick={() => setShowAddPinModal(true)}
              className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-800 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add PIN Code</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">PIN Code</th>
                  <th className="py-2.5 px-3">City / Area</th>
                  <th className="py-2.5 px-3">District & State</th>
                  <th className="py-2.5 px-3">COD Available</th>
                  <th className="py-2.5 px-3">Delivery Fee</th>
                  <th className="py-2.5 px-3">Est. Delivery</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pinCodes.map((pin) => (
                  <tr key={pin.pinCode} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-950">{pin.pinCode}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{pin.city}</td>
                    <td className="py-2.5 px-3 text-slate-600">{pin.district}, {pin.state}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pin.codAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {pin.codAvailable ? 'COD Active' : 'Prepaid Only'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{pin.deliveryCharge === 0 ? 'Free' : `₹${pin.deliveryCharge}`}</td>
                    <td className="py-2.5 px-3 text-slate-500">{pin.estimatedDelivery}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeletePinCode(pin.pinCode)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DAILY DELIVERIES & CALENDAR */}
      {activeTab === 'deliveries' && (
        <MonthlyCalendar
          lang={lang}
          customers={customers}
          isOwner={true}
          onRecordUpdated={loadAllData}
        />
      )}

      {/* TAB 6: CUSTOMERS MANAGEMENT */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t.totalCustomers} ({customers.length})</h3>
              <p className="text-xs text-slate-500">Manage subscribed daily customers and custom rates</p>
            </div>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addCustomer}</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Address</th>
                  <th className="py-2.5 px-3">Daily Qty</th>
                  <th className="py-2.5 px-3">Rate</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.fullName}</td>
                    <td className="py-2.5 px-3 font-mono">{c.mobile}</td>
                    <td className="py-2.5 px-3 text-slate-600">{c.city || 'Sakit'} ({c.pinCode || '207121'})</td>
                    <td className="py-2.5 px-3 font-bold text-blue-950">{c.dailyQuantityLiters} L</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">₹{c.customRatePerLiter || rates[c.preferredMilkType as keyof typeof rates]}/L</td>
                    <td className="py-2.5 px-3 text-center">
                      <button onClick={() => setEditingCustomer(c)} className="px-2 py-1 text-blue-700 font-bold hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: RATES MANAGEMENT */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900">{t.rates}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-2xl border space-y-1">
              <label className="text-xs font-bold">{t.cowMilk}</label>
              <input
                type="number"
                value={rates.cow}
                onChange={e => setRates({ ...rates, cow: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 rounded-xl border bg-white font-bold"
              />
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border space-y-1">
              <label className="text-xs font-bold">{t.buffaloMilk}</label>
              <input
                type="number"
                value={rates.buffalo}
                onChange={e => setRates({ ...rates, buffalo: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 rounded-xl border bg-white font-bold"
              />
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border space-y-1">
              <label className="text-xs font-bold">{t.mixMilk}</label>
              <input
                type="number"
                value={rates.mix}
                onChange={e => setRates({ ...rates, mix: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 rounded-xl border bg-white font-bold"
              />
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border space-y-1">
              <label className="text-xs font-bold">{t.otherMilk}</label>
              <input
                type="number"
                value={rates.other}
                onChange={e => setRates({ ...rates, other: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 rounded-xl border bg-white font-bold"
              />
            </div>
          </div>
          <button onClick={handleSaveRates} className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold">
            {t.saveChanges}
          </button>
        </div>
      )}

      {/* TAB 8: MONTHLY BILLING & OWNER EDIT CONTROLS */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>मालिक नियंत्रण केंद्र (Owner Full Access)</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>{t.billing}</span>
                <span className="text-blue-900 font-mono">({selectedMonth})</span>
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? 'ग्राहकों के मासिक दूध बिलों को संपादित करें, अतिरिक्त चार्ज व छूट जोड़ें और नया बिल पोस्टर जनरेट करें।'
                  : 'Edit customer monthly milk bills, add extra charges/discounts, and generate posters.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
              />
              <button
                onClick={handleGenerateAllBills}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ {lang === 'hi' ? 'सभी बिल पुनः जनरेट करें' : 'Recalculate All'}</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Quick Stats for the selected billing month */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-0.5">
              <span className="text-slate-500">कुल बिल (Total Bills)</span>
              <div className="text-lg font-black text-blue-950 font-mono">{bills.length}</div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-0.5">
              <span className="text-slate-500">कुल डिलीवर दूध</span>
              <div className="text-lg font-black text-blue-900 font-mono">
                {bills.reduce((s, b) => s + (b.totalDeliveredLiters || 0), 0).toFixed(1)} L
              </div>
            </div>
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-0.5">
              <span className="text-emerald-800 font-semibold">कुल जमा भुगतान (Paid)</span>
              <div className="text-lg font-black text-emerald-800 font-mono">
                ₹{bills.reduce((s, b) => s + (b.paymentsReceived || 0), 0)}
              </div>
            </div>
            <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-0.5">
              <span className="text-rose-800 font-semibold">कुल बकाया राशि (Payment Baki)</span>
              <div className="text-lg font-black text-rose-700 font-mono">
                ₹{bills.reduce((s, b) => s + (b.remainingBalance || 0), 0)}
              </div>
            </div>
          </div>

          {/* Bills Data Table with Owner Edit Buttons */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ग्राहक / Customer</th>
                  <th className="py-2.5 px-3">दूध / दर</th>
                  <th className="py-2.5 px-3 text-center">दिन / छुट्टी</th>
                  <th className="py-2.5 px-3">मात्रा (L)</th>
                  <th className="py-2.5 px-3">KUL BILL (₹)</th>
                  <th className="py-2.5 px-3 text-emerald-700">जमा (₹)</th>
                  <th className="py-2.5 px-3 text-rose-700 font-black">बकाया (₹)</th>
                  <th className="py-2.5 px-3 text-center">स्थिति</th>
                  <th className="py-2.5 px-3 text-center">मालिक एक्शन (Owner Controls)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      इस महीने का कोई बिल उपलब्ध नहीं है। कृपया "⚡ सभी बिल पुनः जनरेट करें" पर क्लिक करें।
                    </td>
                  </tr>
                ) : (
                  bills.map((b) => {
                    const isPaid = (b.remainingBalance || 0) === 0;
                    const milkTypeLabel = b.milkType === 'buffalo' ? 'भैंस दूध' : (b.milkType === 'mix' ? 'मिक्स दूध' : 'गाय दूध');
                    const holiday = b.holidayCount !== undefined ? b.holidayCount : (b.cancelledDays || 0);

                    return (
                      <tr key={b.id} className="hover:bg-blue-50/30 transition">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{b.customerName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">+91 {b.customerMobile}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{b.customerArea || 'Sakit'}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{milkTypeLabel}</div>
                          <div className="text-[11px] text-blue-900 font-bold">₹{b.milkRate}/L</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-emerald-700">{b.deliveredDays}d</span>
                          {holiday > 0 && <span className="text-[10px] text-rose-600 block">({holiday} chhutti)</span>}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-blue-950 font-mono">
                          {b.totalDeliveredLiters} L
                        </td>
                        <td className="py-2.5 px-3 font-black text-slate-900 font-mono">
                          ₹{b.totalMilkAmount + (b.extraCharges || b.extraMilkAmount || 0) + (b.previousBalance || 0) - (b.discounts || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 font-bold font-mono">
                          ₹{b.paymentsReceived}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className={`font-black ${isPaid ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isPaid ? '₹0 (Paid)' : `₹${b.remainingBalance}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : (b.paymentsReceived > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                          }`}>
                            {isPaid ? 'Paid' : (b.paymentsReceived > 0 ? 'Partial' : 'Pending')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* 1. Edit Bill Button */}
                            <button
                              type="button"
                              onClick={() => setBillToEdit(b)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                              title="Edit Bill particulars, rates, extra charges, discounts & notes"
                            >
                              <Pencil className="w-3.5 h-3.5 text-blue-800" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>

                            {/* 2. View Poster / PDF Modal Button */}
                            <button
                              type="button"
                              onClick={() => setBillToViewPoster(b)}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                              title="View official poster matching design reference"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                              <span className="hidden sm:inline">पोस्टर</span>
                            </button>

                            {/* 3. Send WhatsApp Button */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsappBill(b.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer flex items-center gap-1 font-bold text-xs shadow-xs"
                              title="Send prepared bill message on WhatsApp"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900">{t.payments}</h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Screenshot</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-bold">{p.customerName}</td>
                    <td className="py-2.5 px-3 font-black text-blue-950">₹{p.amount}</td>
                    <td className="py-2.5 px-3 uppercase">{p.method}</td>
                    <td className="py-2.5 px-3">
                      {p.screenshotUrl && (
                        <button onClick={() => setViewScreenshotUrl(p.screenshotUrl || null)} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                          View
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-amber-700">{p.status}</td>
                    <td className="py-2.5 px-3 text-center">
                      {p.status === 'submitted' && (
                        <button onClick={() => handleVerifyPayment(p.id, 'verified')} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                          Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 10: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">{t.reports}</h3>
            <div className="flex gap-2">
              <button onClick={handleExportPDF} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">
                Download PDF
              </button>
              <button onClick={handleExportExcel} className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold">
                Download Excel
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500">Comprehensive customer bills and dairy delivery records ready for export.</p>
        </div>
      )}

      {/* TAB 11: WHATSAPP */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900">WhatsApp Dispatch Logs</h3>
          <div className="space-y-2">
            {whatsappLogs.map(l => (
              <div key={l.id} className="p-3 bg-slate-50 rounded-xl border text-xs">
                <div className="flex justify-between font-bold">
                  <span>{l.customerName} (+91 {l.mobile})</span>
                  <span>{new Date(l.sentAt).toLocaleTimeString()}</span>
                </div>
                <pre className="text-[11px] font-mono mt-1 text-slate-700 whitespace-pre-wrap">{l.message}</pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 12: SETTINGS (INCLUDING SMS & DLT DEBUGGING) */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">{t.ownerRegistration}</h3>
            <p className="text-xs text-slate-500">Owner identity, SMS provider credentials, private address and payment settings</p>
          </div>

          {/* Strict Private Address */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-1.5">
            <div className="font-bold text-amber-900 text-xs sm:text-sm flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-700 shrink-0" />
              <span>{t.privateAddressNotice}</span>
            </div>
            <textarea
              rows={2}
              value={settingsAddress}
              onChange={e => setSettingsAddress(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-amber-300 text-xs sm:text-sm font-semibold bg-white"
            />
            <p className="text-[10px] text-amber-800 font-medium">
              🔒 Strictly confidential. Never visible to customers or on customer bills.
            </p>
          </div>

          {/* SMS & DLT Provider Diagnostics Box */}
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm text-blue-950 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-blue-700" />
                <span>MSG91 & TRAI DLT OTP Gateway Settings</span>
              </h4>
              <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">India Telecom Regulations</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">MSG91 Auth Key</label>
                <input
                  type="password"
                  value={settingsMsg91Key}
                  onChange={e => setSettingsMsg91Key(e.target.value)}
                  placeholder="Enter MSG91 API Key"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">DLT Sender ID (Header)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={settingsMsg91Sender}
                  onChange={e => setSettingsMsg91Sender(e.target.value)}
                  placeholder="e.g. SHYAMB"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">DLT Approved Template ID</label>
                <input
                  type="text"
                  value={settingsMsg91Template}
                  onChange={e => setSettingsMsg91Template(e.target.value)}
                  placeholder="e.g. 1107161728192019"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">DLT Principal Entity ID (PE ID)</label>
                <input
                  type="text"
                  value={settingsDltEntity}
                  onChange={e => setSettingsDltEntity(e.target.value)}
                  placeholder="e.g. 11012839201928"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>

            {/* Test SMS Dispatch Button */}
            <div className="pt-2 border-t border-blue-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="tel"
                maxLength={10}
                value={smsTestMobile}
                onChange={e => setSmsTestMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="Mobile for SMS Test"
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleTestSms}
                className="px-3 py-1.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition"
              >
                Send Test SMS OTP
              </button>
            </div>

            {smsTestStatus && (
              <div className="p-2.5 rounded-xl bg-white border border-blue-300 text-xs font-mono text-blue-950">
                {smsTestStatus}
              </div>
            )}
          </div>

          {/* Owner Identity & Payments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Owner Full Name</label>
              <input
                type="text"
                required
                value={settingsName}
                onChange={e => setSettingsName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Owner Mobile</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={settingsMobile}
                onChange={e => setSettingsMobile(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">2FA PIN (6 Digits)</label>
              <input
                type="text"
                maxLength={6}
                value={settingsPin}
                onChange={e => setSettingsPin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border font-mono font-bold text-center"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Free Delivery Above (₹)</label>
              <input
                type="number"
                value={settingsFreeAbove}
                onChange={e => setSettingsFreeAbove(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Official Paytm UPI ID</label>
              <input
                type="text"
                value={settingsUpiId}
                onChange={e => setSettingsUpiId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Official QR Payee Name</label>
              <input
                type="text"
                value={settingsPayee}
                onChange={e => setSettingsPayee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition cursor-pointer"
          >
            {t.saveChanges}
          </button>
        </form>
      )}

      {/* MODAL: PRODUCT EDIT & IMAGE CHANGER */}
      {isProductModalOpen && (
        <ProductEditModal
          lang={lang}
          product={editingProduct}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSaveSuccess={(updated) => {
            showNotification(
              editingProduct
                ? (lang === 'hi' ? `उत्पाद "${updated.nameHi}" अपडेट हो गया!` : `Product "${updated.name}" updated!`)
                : (lang === 'hi' ? `नया उत्पाद "${updated.nameHi}" जोड़ा गया!` : `New product "${updated.name}" added!`)
            );
            loadAllData();
          }}
        />
      )}

      {/* MODAL: PRODUCT DELETE CONFIRMATION */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {lang === 'hi' ? 'उत्पाद स्टोर से हटाएं?' : 'Delete Store Product?'}
                </h4>
                <p className="text-xs text-slate-500">
                  {lang === 'hi' ? 'क्या आप वाकई इस उत्पाद को हटाना चाहते हैं?' : 'Are you sure you want to remove this item?'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <img
                src={productToDelete.image}
                alt={productToDelete.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0 border"
              />
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {lang === 'hi' ? productToDelete.nameHi : productToDelete.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{productToDelete.name}</div>
                <div className="font-mono font-bold text-blue-950 text-xs mt-0.5">
                  ₹{productToDelete.price} / {productToDelete.unit}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{lang === 'hi' ? 'हाँ, हटाएं' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PIN CODE */}
      {showAddPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form onSubmit={handleAddPinCode} className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-3 text-xs">
            <h4 className="text-base font-bold text-blue-950">Add Serviceable Delivery Area</h4>
            <div>
              <label className="block font-semibold mb-1">PIN Code (6 Digits)</label>
              <input type="text" maxLength={6} required value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 rounded-xl border font-mono font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1">City / Town</label>
                <input type="text" required value={newPinCity} onChange={e => setNewPinCity(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              </div>
              <div>
                <label className="block font-semibold mb-1">District</label>
                <input type="text" value={newPinDistrict} onChange={e => setNewPinDistrict(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1">Delivery Charge (₹)</label>
                <input type="number" value={newPinCharge} onChange={e => setNewPinCharge(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Est. Delivery Time</label>
                <input type="text" value={newPinEst} onChange={e => setNewPinEst(e.target.value)} className="w-full px-3 py-2 rounded-xl border" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="codCheck" checked={newPinCod} onChange={e => setNewPinCod(e.target.checked)} className="rounded" />
              <label htmlFor="codCheck" className="font-semibold cursor-pointer">Enable Cash on Delivery (COD)</label>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAddPinModal(false)} className="flex-1 py-2 border rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-blue-900 text-white rounded-xl font-bold">Add Location</button>
            </div>
          </form>
        </div>
      )}

      {/* SCREENSHOT PREVIEW MODAL */}
      {viewScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-4 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setViewScreenshotUrl(null)} className="absolute right-3 top-3 p-1 rounded-full bg-slate-100 hover:bg-slate-200">
              <XCircle className="w-5 h-5 text-slate-700" />
            </button>
            <h4 className="text-sm font-bold mb-3">Submitted Payment Screenshot</h4>
            <div className="max-h-[70vh] overflow-auto rounded-2xl border">
              <img src={viewScreenshotUrl} alt="Receipt" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* OWNER BILL EDIT MODAL (REAL EDITING CONTROLS) */}
      {billToEdit && (
        <OwnerBillEditModal
          bill={billToEdit}
          lang={lang}
          ownerName={owner.fullName}
          onClose={() => setBillToEdit(null)}
          onSaved={(updated) => {
            setBills(prev => prev.map(b => b.id === updated.id ? updated : b));
            showNotification(lang === 'hi' ? 'दूध बिल व गणनाएं सफलतापूर्वक सुरक्षित हुईं!' : 'Milk bill & calculations saved successfully!');
            loadAllData();
          }}
        />
      )}

      {/* OFFICIAL MILK BILL POSTER & PDF DOWNLOAD MODAL */}
      {billToViewPoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="my-auto w-full max-w-xl">
            <MilkBillPoster
              bill={billToViewPoster}
              lang={lang}
              showCloseButton={true}
              onClose={() => setBillToViewPoster(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
