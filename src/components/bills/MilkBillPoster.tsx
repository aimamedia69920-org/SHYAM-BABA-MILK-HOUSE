import React, { useRef, useState } from 'react';
import { MonthlyBill, Language } from '../../types/dairy';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import {
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Smartphone,
  Phone,
  Calendar,
  X,
  FileText
} from 'lucide-react';

interface Props {
  bill: MonthlyBill;
  lang?: Language;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const MilkBillPoster: React.FC<Props> = ({
  bill,
  lang = 'hi',
  onClose,
  showCloseButton = false,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [whatsappToast, setWhatsappToast] = useState(false);

  const upiId = '7078376806@ptyes';
  const ownerName = 'Ankit Kumar';
  const ownerPhone = '7078376806';

  // Format month and year label
  const getDisplayMonth = () => {
    if (bill.monthName && bill.monthName.trim().length > 0) {
      return bill.monthName;
    }
    const [y, m] = (bill.month || '2026-10').split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  };

  const monthLabel = getDisplayMonth();

  // Calculations
  const deliveredLiters = bill.totalDeliveredLiters || 0;
  const milkRate = bill.milkRate || 60;
  const milkAmount = bill.totalMilkAmount || Math.round(deliveredLiters * milkRate);
  const extraCharges = bill.extraCharges || bill.extraMilkAmount || 0;
  const previousBalance = bill.previousBalance || 0;
  const discounts = bill.discounts || 0;
  const kulBill = milkAmount + extraCharges + previousBalance - discounts;
  const paymentsReceived = bill.paymentsReceived || 0;
  const remainingBalance = Math.max(0, kulBill - paymentsReceived);
  const isPaid = remainingBalance === 0;

  // Milk type label in Hindi / English
  const getMilkTypeLabel = () => {
    switch (bill.milkType) {
      case 'buffalo':
        return 'Bhains ka Doodh';
      case 'mix':
        return 'Mix Doodh';
      default:
        return 'Gaay ka Doodh';
    }
  };

  const holidayCount = bill.holidayCount !== undefined ? bill.holidayCount : (bill.cancelledDays || 0);

  // Copy UPI ID
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Generate and Download PDF Bill
  const handleDownloadPdf = async () => {
    if (!posterRef.current || downloading) return;
    setDownloading(true);

    try {
      const element = posterRef.current;
      // High-resolution canvas capture
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const safeCustName = (bill.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const safeMonth = (bill.month || '2026-10').replace(/[^a-zA-Z0-9]/g, '-');
      const fileName = `SHYAM-BABA-MILK-HOUSE-${safeMonth}-${safeCustName}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // Send Bill on WhatsApp with prepared exact message
  const handleSendOnWhatsApp = async () => {
    // 1. Download PDF first for the user so they can attach it easily
    handleDownloadPdf();

    // 2. Prepare the exact Hindi WhatsApp message
    const rawMobile = (bill.customerMobile || '').replace(/\D/g, '');
    const mobile10 = rawMobile.length >= 10 ? rawMobile.slice(-10) : '7078376806';

    const message = `🙏 *नमस्कार!*

आपको SHYAM BABA MILK HOUSE की तरफ से ${monthLabel} महीने का दूध बिल भेजा जा रहा है।

कृपया अपना बकाया भुगतान जल्द से जल्द CASH या ऑनलाइन UPI या QR Code स्कैन करके कर दें।

💳 *UPI ID:* ${upiId}

📲 भुगतान करने के बाद कृपया पेमेंट का स्क्रीनशॉट WhatsApp पर जरूर भेजें।

आपके सहयोग के लिए बहुत-बहुत धन्यवाद। 🙏

*SHYAM BABA MILK HOUSE*
मालिक: अंकित कुमार
📞 ${ownerPhone}
🥛 _शुद्ध दूध • शुद्धता का विश्वास_`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${mobile10}?text=${encoded}`;

    setWhatsappToast(true);
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setWhatsappToast(false);
    }, 1200);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto bg-slate-100 p-2 sm:p-4 rounded-3xl shadow-2xl">
      {/* Top action header for close if in modal */}
      {showCloseButton && onClose && (
        <div className="flex justify-between items-center mb-3 px-2">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-900" />
            <span>आधिकारिक मासिक दूध बिल (Monthly Bill)</span>
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white hover:bg-slate-200 text-slate-700 shadow-xs cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* THE BILL POSTER CONTAINER (Matching the reference design image) */}
      <div
        ref={posterRef}
        className="w-full bg-white rounded-3xl overflow-hidden shadow-xl border-2 border-blue-950 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]"
        style={{ minWidth: '320px' }}
      >
        {/* 1. TOP HEADER BANNER (Royal Blue, Splash Waves, Cow & Milk Glass) */}
        <div className="relative bg-gradient-to-r from-[#031d4d] via-[#052b75] to-[#031d4d] text-white pt-5 pb-6 px-4 sm:px-6 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            {/* Left: Official App Logo */}
            <div className="shrink-0 flex items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-amber-400 p-0.5 bg-white shadow-lg flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg"
                  alt="Shyam Baba Milk House Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* Center: Branding & Owner Info */}
            <div className="flex-1 text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
                SHYAM BABA
              </h1>
              <h2 className="text-lg sm:text-xl font-black text-amber-400 drop-shadow-md tracking-wider">
                MILK HOUSE
              </h2>

              <div className="text-[11px] sm:text-xs font-bold text-blue-100 flex items-center justify-center gap-1.5 flex-wrap">
                <span>Malik: {ownerName}</span>
                <span>|</span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Phone className="w-3 h-3 fill-amber-300" />
                  <span>{ownerPhone}</span>
                </span>
              </div>

              {/* Tagline Pill */}
              <div className="pt-0.5">
                <span className="inline-block px-3 py-0.5 rounded-full bg-white text-[#062c77] font-bold text-[10px] sm:text-xs shadow-xs">
                  शुद्ध दूध • शुद्धता का विश्वास
                </span>
              </div>
            </div>

            {/* Right: Dairy Cow Visual */}
            <div className="shrink-0 hidden xs:flex flex-col items-center">
              <img
                src="https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=200&auto=format&fit=crop&q=80"
                alt="Desi Dairy Cow"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border-2 border-amber-400/80 shadow-md"
              />
            </div>
          </div>
        </div>

        {/* 2. DOODH BILL HEADER CAPSULE */}
        <div className="px-4 pt-3 pb-2 bg-gradient-to-b from-blue-50/50 to-white">
          <div className="flex items-center justify-center gap-3">
            <div className="h-[2px] flex-1 bg-blue-900 rounded-full" />
            <div className="px-5 py-1.5 rounded-full bg-[#031d4d] text-white font-extrabold text-sm sm:text-base tracking-wide shadow-md">
              DOODH BILL – {monthLabel}
            </div>
            <div className="h-[2px] flex-1 bg-blue-900 rounded-full" />
          </div>
        </div>

        {/* 3. BILL PARTICULARS DETAILS */}
        <div className="px-5 sm:px-8 py-3 space-y-1.5 text-xs sm:text-sm font-semibold text-slate-800">
          <div className="flex items-start">
            <span className="w-36 sm:w-44 text-slate-900 font-bold">Customer</span>
            <span className="font-bold text-slate-900">: {bill.customerName}</span>
          </div>

          <div className="flex items-start">
            <span className="w-36 sm:w-44 text-slate-700">Area</span>
            <span className="text-slate-800 font-medium">: {bill.customerArea || 'Life Line Care Chaprai Road Sakit 207121 (Etah)'}</span>
          </div>

          <div className="flex items-start">
            <span className="w-36 sm:w-44 text-slate-700">Phone</span>
            <span className="font-mono">: {bill.customerMobile || 'No'}</span>
          </div>

          <div className="flex items-start">
            <span className="w-36 sm:w-44 text-slate-900 font-bold">{getMilkTypeLabel()}</span>
            <span className="font-bold text-blue-950">
              : {deliveredLiters} L x Rs {milkRate} = Rs {milkAmount}
            </span>
          </div>

          <div className="flex items-start">
            <span className="w-36 sm:w-44 text-slate-700">Chhutti ke din</span>
            <span className="font-medium text-slate-800">: {holidayCount}</span>
          </div>

          {extraCharges > 0 && (
            <div className="flex items-start">
              <span className="w-36 sm:w-44 text-amber-900 font-bold">Extra Milk / Charges</span>
              <span className="font-bold text-amber-800">: + Rs {extraCharges}</span>
            </div>
          )}

          {previousBalance > 0 && (
            <div className="flex items-start">
              <span className="w-36 sm:w-44 text-rose-900 font-bold">Previous Balance</span>
              <span className="font-bold text-rose-800">: + Rs {previousBalance}</span>
            </div>
          )}

          {discounts > 0 && (
            <div className="flex items-start">
              <span className="w-36 sm:w-44 text-emerald-900 font-bold">Discounts</span>
              <span className="font-bold text-emerald-800">: - Rs {discounts}</span>
            </div>
          )}

          {paymentsReceived > 0 && (
            <div className="flex items-start">
              <span className="w-36 sm:w-44 text-emerald-900 font-bold">Payment Received</span>
              <span className="font-bold text-emerald-800">: - Rs {paymentsReceived}</span>
            </div>
          )}
        </div>

        {/* 4. HIGHLIGHT BOX: KUL BILL & PAYMENT BAKI */}
        <div className="px-5 sm:px-8 py-2">
          {/* Light-blue box with bold text: KUL BILL */}
          <div className="bg-[#dbeafe] border border-blue-300 rounded-xl px-4 py-2 flex items-center justify-between">
            <span className="font-black text-sm sm:text-base tracking-wider text-[#07255a]">
              KUL BILL
            </span>
            <span className="font-black text-lg sm:text-xl text-[#07255a] font-mono">
              Rs {kulBill}
            </span>
          </div>

          {/* Payment Status indicator */}
          <div className="pt-2 px-1">
            {isPaid ? (
              <div className="text-emerald-700 font-black text-base sm:text-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>PAID / भुगतान प्राप्त</span>
              </div>
            ) : (
              <div className="text-rose-600 font-black text-base sm:text-lg tracking-wide">
                PAYMENT BAKI : Rs {remainingBalance}
              </div>
            )}
          </div>
        </div>

        {/* 5. SCAN & PAY QR SECTION */}
        <div className="px-5 sm:px-8 py-2">
          {/* Header pill with lines */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-[1px] flex-1 bg-amber-400" />
            <div className="px-4 py-0.5 rounded-full bg-[#052b75] text-amber-300 font-bold text-xs sm:text-sm">
              Scan & Pay
            </div>
            <div className="h-[1px] flex-1 bg-amber-400" />
          </div>

          {/* QR Box with 3 Columns: Brand logos, QR code, Features */}
          <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-b from-sky-50/40 via-white to-blue-50/30 p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              {/* Left Column: UPI & Payment Partner Logos */}
              <div className="flex sm:flex-col items-center justify-around gap-2 text-center">
                <div className="px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <span className="font-black text-sky-600 text-xs tracking-tighter">paytm</span>
                </div>
                <div className="px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <span className="font-black text-orange-600 text-xs italic tracking-wider">UPI▶</span>
                </div>
                <div className="px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-xs flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-purple-700 text-white font-bold text-[9px] flex items-center justify-center">पे</span>
                  <span className="font-bold text-purple-700 text-[11px]">PhonePe</span>
                </div>
                <div className="px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <span className="font-bold text-slate-800 text-[11px]">Google Pay</span>
                </div>
              </div>

              {/* Center Column: Original Paytm UPI QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="p-1 bg-white rounded-2xl border-2 border-blue-900 shadow-md">
                  <img
                    src="/assets/aistudio/SHYAM_BABA_MILK_HOUSE__PAYMENT_QR_CODE_AI_47e8cd69.png"
                    alt="Original Paytm UPI QR Code"
                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded-xl"
                  />
                </div>

                {/* UPI ID Pill under QR */}
                <div className="mt-1.5 w-full">
                  <div
                    onClick={handleCopyUpi}
                    className="cursor-pointer bg-blue-900 hover:bg-blue-950 text-white font-mono font-bold text-[10px] sm:text-xs py-1 px-2 rounded-full text-center shadow-xs flex items-center justify-center gap-1 transition"
                    title="Click to copy UPI ID"
                  >
                    <span>UPI ID: {upiId}</span>
                    {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-300" />}
                  </div>
                </div>
              </div>

              {/* Right Column: Security badges */}
              <div className="space-y-2 text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2 p-1.5 bg-white/80 rounded-xl border border-blue-100">
                  <div className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] leading-tight">सुरक्षित भुगतान</span>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-white/80 rounded-xl border border-blue-100">
                  <div className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] leading-tight">तुरंत पेमेंट</span>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-white/80 rounded-xl border border-blue-100">
                  <div className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] leading-tight">सभी UPI ऐप से भुगतान</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. NOTICE BOX (Golden/Amber card with Hindi instructions) */}
        <div className="px-5 sm:px-8 py-2">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 text-amber-950 text-[11px] sm:text-xs leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-900">
              <span>🙏</span>
              <span>नमस्कार!</span>
            </div>
            <p>
              आपको <strong>SHYAM BABA MILK HOUSE</strong> की तरफ से <strong>{monthLabel}</strong> महीने का दूध बिल भेजा जा रहा है।
            </p>
            <p>
              कृपया अपना बकाया भुगतान जल्द से जल्द <strong>CASH</strong> या <strong>ऑनलाइन UPI या QR Code</strong> स्कैन करके कर दें।
            </p>
            <div className="font-mono font-bold text-blue-900 bg-white/70 px-2 py-0.5 rounded border border-amber-200 inline-block">
              💳 UPI ID: {upiId}
            </div>
            <p className="font-medium text-slate-800">
              📲 भुगतान करने के बाद कृपया पेमेंट का स्क्रीनशॉट WhatsApp पर जरूर भेजें।
            </p>
            <div className="text-right font-bold text-amber-900 pt-0.5">
              आपके सहयोग के लिए बहुत-बहुत धन्यवाद। 🙏
            </div>
          </div>
        </div>

        {/* 7. BOTTOM DEVOTIONAL FOOTER */}
        <div className="mt-2 bg-gradient-to-r from-[#031d4d] via-[#052b75] to-[#031d4d] text-white py-3 px-5 sm:px-8 text-center border-t-2 border-amber-400">
          <div className="font-black text-amber-300 text-sm sm:text-base tracking-wide">
            SHYAM BABA MILK HOUSE
          </div>
          <div className="text-xs font-bold text-white mt-0.5">
            मालिक: {ownerName} | 📞 {ownerPhone}
          </div>
          <div className="mt-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-white text-[#042466] font-extrabold text-[10px]">
              शुद्ध दूध • शुद्धता का विश्वास
            </span>
          </div>
        </div>
      </div>

      {/* 8. TWO PRIMARY ACTION BUTTONS (Outside capture container or placed below) */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Button 1: Download Bill */}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="w-full py-3 px-4 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-700/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          <span>{downloading ? 'PDF तैयार हो रहा है...' : '📥 Download Bill'}</span>
        </button>

        {/* Button 2: Send Bill on WhatsApp */}
        <button
          type="button"
          onClick={handleSendOnWhatsApp}
          className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
        >
          <Send className="w-5 h-5" />
          <span>📲 Send Bill on WhatsApp</span>
        </button>
      </div>

      {/* WhatsApp Dispatched Confirmation Toast */}
      {whatsappToast && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Bill PDF डाउनलोड हो रहा है! WhatsApp खुल रहा है, कृपया चैट में डाउनलोड किया गया बिल अटैच करें।
          </span>
        </div>
      )}
    </div>
  );
};
