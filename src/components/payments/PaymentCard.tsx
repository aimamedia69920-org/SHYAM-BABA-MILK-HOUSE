import React, { useState } from 'react';
import { Language, CustomerProfile, MonthlyBill, PaymentRecord } from '../../types/dairy';
import { translations } from '../../i18n/translations';
import { QrCode, Upload, CheckCircle2, AlertCircle, Copy, Check, FileText, ArrowDownToLine, RefreshCw, X } from 'lucide-react';

interface Props {
  lang: Language;
  customer?: CustomerProfile;
  currentBill?: MonthlyBill | null;
  onPaymentSubmitted?: (payment: PaymentRecord) => void;
  onClose?: () => void;
  officialQrImage?: string;
  upiId?: string;
  payeeName?: string;
}

export const PaymentCard: React.FC<Props> = ({
  lang,
  customer,
  currentBill,
  onPaymentSubmitted,
  onClose,
  officialQrImage = '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__PAYMENT_QR_CODE_AI_47e8cd69.png',
  upiId = '7078376806@ptyes',
  payeeName = 'Ankit Ankit',
}) => {
  const t = translations[lang];
  const [amount, setAmount] = useState<string>(
    currentBill ? currentBill.remainingBalance.toString() : ''
  );
  const [method, setMethod] = useState<'upi' | 'cash'>('upi');
  const [txnRef, setTxnRef] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotData, setScreenshotData] = useState<string>('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      const result = reader.result as string;
      setScreenshotData(result);
      setScreenshotPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError(lang === 'hi' ? 'कृपया वैध राशि दर्ज करें' : 'Please enter a valid amount');
      return;
    }

    if (!customer?.id) {
      setError(lang === 'hi' ? 'ग्राहक की जानकारी नहीं मिली' : 'Customer profile missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          amount: parseFloat(amount),
          method,
          transactionReference: txnRef || `UPI-${Date.now().toString().slice(-6)}`,
          screenshotUrl: screenshotData || undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit payment');

      setSuccess(true);
      if (onPaymentSubmitted) {
        onPaymentSubmitted(data.payment);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-amber-200/80 shadow-2xl p-5 sm:p-7 relative overflow-hidden">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="text-center pb-4 border-b border-slate-100 mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-900 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-blue-200">
          <QrCode className="w-3.5 h-3.5 text-blue-600" />
          <span>PAYTM UPI • SHYAM BABA MILK HOUSE</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-blue-950">
          {t.scanAndPay}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'hi'
            ? 'किसी भी UPI ऐप (Paytm, PhonePe, GPay, BHIM) से स्कैन करके भुगतान करें'
            : 'Scan and pay using any UPI app (Paytm, PhonePe, GPay, BHIM)'}
        </p>
      </div>

      {success ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h4 className="text-xl font-bold text-slate-900">
            {lang === 'hi' ? 'भुगतान रसीद सफलतापूर्वक जमा हुई!' : 'Payment Receipt Submitted!'}
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            {t.paymentSuccessNotice}
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-left text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">{lang === 'hi' ? 'जमा राशि:' : 'Amount:'}</span>
              <span className="font-bold text-slate-900">₹{amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{lang === 'hi' ? 'लेन-देन संदर्भ:' : 'Txn Ref:'}</span>
              <span className="font-mono text-slate-800">{txnRef || 'Self Submitted'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{lang === 'hi' ? 'सत्यापन स्थिति:' : 'Status:'}</span>
              <span className="font-semibold text-amber-600">{t.paymentSubmitted}</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 transition cursor-pointer"
            >
              {lang === 'hi' ? 'पूर्ण हुआ' : 'Done'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* UPLOADED PAYTM UPI QR CODE DISPLAY CARD */}
          <div className="p-4 sm:p-5 bg-gradient-to-b from-blue-50/60 via-white to-blue-50/30 rounded-2xl border-2 border-blue-200 shadow-md text-center">
            <div className="max-w-[260px] mx-auto bg-white p-2 rounded-2xl shadow-lg border border-slate-200 overflow-hidden group">
              <img
                src={officialQrImage}
                alt="Paytm UPI QR Code"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>

            {/* UPI ID & PAYEE DETAILS */}
            <div className="mt-4 pt-3 border-t border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-sm mx-auto text-left">
              <div>
                <div className="text-[11px] text-slate-500 font-semibold">{t.officialUpiId}:</div>
                <div className="font-mono text-xs sm:text-sm font-bold text-blue-900">{upiId}</div>
                <div className="text-[10px] text-slate-500">{t.officialPayee}: <span className="font-semibold text-slate-700">{payeeName}</span></div>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (lang === 'hi' ? 'कॉपी हुआ' : 'Copied') : (lang === 'hi' ? 'UPI कॉपी करें' : 'Copy UPI')}</span>
              </button>
            </div>
          </div>

          {/* Form to submit payment confirmation */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.enterAmount} *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2340"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'भुगतान विधि' : 'Payment Method'}
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as 'upi' | 'cash')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm bg-white"
                >
                  <option value="upi">Paytm / UPI Online</option>
                  <option value="cash">{lang === 'hi' ? 'नकद भुगतान (Cash)' : 'Cash'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'UPI संदर्भ / UTR नंबर (वैकल्पिक)' : 'UPI Reference / UTR Number (Optional)'}
              </label>
              <input
                type="text"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder={lang === 'hi' ? 'जैसे: 429182910291 या Txn ID' : 'e.g. 429182910291 or Txn ID'}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
              />
            </div>

            {/* SCREENSHOT UPLOAD */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.uploadScreenshot} *
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-4 text-center bg-slate-50 transition cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Upload className="w-6 h-6 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-900">
                    {lang === 'hi' ? 'गैलरी या कैमरे से स्क्रीनशॉट चुनें' : 'Choose screenshot from gallery'}
                  </span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, JPEG (Max 10MB)</span>
                </div>
              </div>

              {screenshotPreview && (
                <div className="mt-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <img
                    src={screenshotPreview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-emerald-300"
                  />
                  <div className="text-xs text-emerald-800 font-medium">
                    ✓ {lang === 'hi' ? 'स्क्रीनशॉट संलग्न है' : 'Screenshot attached'}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white font-bold text-sm shadow-lg shadow-blue-900/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{t.submitPayment}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
