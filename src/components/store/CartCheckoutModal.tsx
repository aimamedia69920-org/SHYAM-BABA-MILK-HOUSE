import React, { useState } from 'react';
import { Language, CartItem, CustomerProfile, DairyOrder } from '../../types/dairy';
import { translations } from '../../i18n/translations';
import {
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  CreditCard,
  Banknote,
  QrCode,
  Copy,
  Check,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { syncOrderToFirestore } from '../../firebase/ordersService';

interface Props {
  lang: Language;
  cart: CartItem[];
  customer?: CustomerProfile;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onClose: () => void;
  onOrderSuccess: (order: DairyOrder) => void;
  officialQrImage?: string;
  upiId?: string;
  payeeName?: string;
}

export const CartCheckoutModal: React.FC<Props> = ({
  lang,
  cart,
  customer,
  onUpdateQuantity,
  onClearCart,
  onClose,
  onOrderSuccess,
  officialQrImage = '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__PAYMENT_QR_CODE_AI_47e8cd69.png',
  upiId = '7078376806@ptyes',
  payeeName = 'Ankit Ankit',
}) => {
  const t = translations[lang];

  // Address states
  const [fullName, setFullName] = useState(customer?.fullName || '');
  const [mobile, setMobile] = useState(customer?.mobile || '');
  const [addressLine, setAddressLine] = useState(customer?.address || '');
  const [city, setCity] = useState(customer?.city || 'Sakit');
  const [district, setDistrict] = useState(customer?.district || 'Etah');
  const [state, setState] = useState(customer?.state || 'Uttar Pradesh');
  const [pinCode, setPinCode] = useState(customer?.pinCode || '207121');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('upi');
  const [txnRef, setTxnRef] = useState('');
  const [screenshotData, setScreenshotData] = useState<string>('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cart.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  const isFreeDelivery = subtotal >= 499;
  const deliveryCharge = isFreeDelivery ? 0 : 35;
  const grandTotal = subtotal + deliveryCharge;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError(lang === 'hi' ? 'फ़ाइल का आकार 10MB से कम होना चाहिए' : 'File must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      setScreenshotData(res);
      setScreenshotPreview(res);
    };
    reader.readAsDataURL(file);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;
    if (!fullName || !mobile || !pinCode || !addressLine) {
      setError(lang === 'hi' ? 'कृपया संपूर्ण डिलीवरी पता और पिन कोड भरें' : 'Please fill complete delivery address');
      return;
    }

    setLoading(true);
    setError(null);

    const items = cart.map((it) => ({
      productId: it.product.id,
      name: it.product.name,
      nameHi: it.product.nameHi,
      price: it.product.price,
      quantity: it.quantity,
      unit: it.product.unit,
      image: it.product.image,
      total: it.product.price * it.quantity,
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer?.id || 'guest',
          customerName: fullName,
          customerMobile: mobile,
          items,
          shippingAddress: {
            fullName,
            mobile,
            addressLine,
            city,
            district,
            state,
            pinCode,
          },
          paymentMethod,
          screenshotUrl: paymentMethod === 'upi' ? screenshotData : undefined,
          txnRef: paymentMethod === 'upi' ? txnRef : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      // Sync real-time to Firestore for live timeline updates
      try {
        await syncOrderToFirestore(data.order);
      } catch (syncErr) {
        console.warn('Firestore real-time sync notice:', syncErr);
      }

      onClearCart();
      onOrderSuccess(data.order);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-blue-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-300" />
            <h3 className="text-base sm:text-lg font-bold">
              {t.myCart} & {t.checkout}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'hi' ? 'चुनी गई वस्तुएं (Cart Items)' : 'Selected Items'} ({cart.length})
            </h4>

            {cart.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                {t.cartEmpty}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
                {cart.map((it) => (
                  <div key={it.product.id} className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={it.product.image}
                        alt={it.product.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900">
                          {lang === 'hi' ? it.product.nameHi : it.product.name}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          ₹{it.product.price} / {it.product.unit}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          onClick={() => onUpdateQuantity(it.product.id, it.quantity - 1)}
                          className="p-1 text-slate-600 hover:bg-white rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold font-mono text-xs">{it.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(it.product.id, it.quantity + 1)}
                          className="p-1 text-slate-600 hover:bg-white rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-black text-slate-900 min-w-[50px] text-right">
                        ₹{it.product.price * it.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Address Details */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-blue-700" />
              <span>{t.deliveryAddress}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">{t.fullName} *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">{t.mobileNumber} *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">{t.address} *</label>
              <input
                type="text"
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder={lang === 'hi' ? 'मकान नंबर, गली या इलाका' : 'House/Flat No., Landmark'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">{t.city}</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">{t.district}</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">{t.state}</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">{t.pinCode} *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-blue-400 font-mono font-bold text-blue-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'hi' ? 'भुगतान विधि चुनें (Payment Option)' : 'Payment Method'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'upi'
                    ? 'border-blue-900 bg-blue-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="text-blue-900"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      Paytm UPI Online QR
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {lang === 'hi' ? 'तुरंत QR स्कैन करें व स्क्रीनशॉट अपलोड करें' : 'Scan Paytm QR & upload receipt'}
                    </div>
                  </div>
                </div>
                <QrCode className="w-5 h-5 text-blue-900" />
              </label>

              <label
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'cod'
                    ? 'border-emerald-700 bg-emerald-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="text-emerald-700"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      Cash on Delivery (COD)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {lang === 'hi' ? 'डिलीवरी के समय नकद भुगतान' : 'Pay in cash upon delivery'}
                    </div>
                  </div>
                </div>
                <Banknote className="w-5 h-5 text-emerald-700" />
              </label>
            </div>

            {/* UPI QR Code Container if UPI selected */}
            {paymentMethod === 'upi' && (
              <div className="p-4 bg-gradient-to-b from-blue-50/60 to-white rounded-2xl border-2 border-blue-200 space-y-3 animate-fade-in text-center">
                <div className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                  {t.officialQrTitle}
                </div>
                <div className="max-w-[220px] mx-auto bg-white p-2 rounded-2xl shadow-md border border-slate-200">
                  <img
                    src={officialQrImage}
                    alt="Official Paytm UPI QR Code"
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 pt-1 text-xs">
                  <span className="font-mono font-bold text-blue-950">{upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-2.5 py-1 rounded-lg bg-blue-900 text-white font-bold text-[11px] flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      {lang === 'hi' ? 'UPI UTR / संदर्भ ID (वैकल्पिक)' : 'UPI Txn / UTR Ref'}
                    </label>
                    <input
                      type="text"
                      value={txnRef}
                      onChange={(e) => setTxnRef(e.target.value)}
                      placeholder="e.g. 429182918291"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      {t.uploadScreenshot}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-[11px] text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-blue-900 file:text-white file:font-bold cursor-pointer"
                    />
                  </div>
                </div>

                {screenshotPreview && (
                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                    <img src={screenshotPreview} alt="Screenshot" className="w-10 h-10 object-cover rounded-lg" />
                    <span className="text-xs text-emerald-800 font-semibold">
                      ✓ {lang === 'hi' ? 'स्क्रीनशॉट संलग्न है' : 'Screenshot attached'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>{t.itemTotal}:</span>
              <span className="font-bold text-slate-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t.deliveryCharge}:</span>
              <span className="font-bold text-slate-900">
                {isFreeDelivery ? (
                  <span className="text-emerald-700 font-bold">{t.freeDelivery}</span>
                ) : (
                  `₹${deliveryCharge}`
                )}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm sm:text-base font-extrabold text-blue-950">
              <span>{t.finalTotal}:</span>
              <span className="text-xl font-black text-blue-900">₹{grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={loading || !cart.length}
            onClick={handlePlaceOrder}
            className="flex-1 max-w-sm py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{t.placeOrder} (₹{grandTotal})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
