import React, { useState, useEffect } from 'react';
import { MonthlyBill, Language, MilkType } from '../../types/dairy';
import { syncBillToFirestore } from '../../firebase/billsService';
import {
  X,
  Save,
  Calculator,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Phone,
  Calendar,
  IndianRupee,
  PlusCircle,
  MinusCircle,
  FileText
} from 'lucide-react';

interface Props {
  bill: MonthlyBill;
  lang: Language;
  ownerName: string;
  onClose: () => void;
  onSaved: (updatedBill: MonthlyBill) => void;
}

export const OwnerBillEditModal: React.FC<Props> = ({
  bill,
  lang,
  ownerName,
  onClose,
  onSaved,
}) => {
  // Form state
  const [customerName, setCustomerName] = useState(bill.customerName || '');
  const [customerArea, setCustomerArea] = useState(bill.customerArea || '');
  const [customerMobile, setCustomerMobile] = useState(bill.customerMobile || '');
  const [month, setMonth] = useState(bill.month || '2026-10');
  const [milkType, setMilkType] = useState<MilkType>((bill.milkType as MilkType) || 'cow');
  const [deliveredLiters, setDeliveredLiters] = useState<number>(bill.totalDeliveredLiters || 0);
  const [milkRate, setMilkRate] = useState<number>(bill.milkRate || 60);
  const [holidayCount, setHolidayCount] = useState<number>(bill.holidayCount !== undefined ? bill.holidayCount : (bill.cancelledDays || 0));
  const [extraCharges, setExtraCharges] = useState<number>(bill.extraCharges || bill.extraMilkAmount || 0);
  const [previousBalance, setPreviousBalance] = useState<number>(bill.previousBalance || 0);
  const [discounts, setDiscounts] = useState<number>(bill.discounts || 0);
  const [paymentsReceived, setPaymentsReceived] = useState<number>(bill.paymentsReceived || 0);
  const [paymentDate, setPaymentDate] = useState<string>(bill.paymentDate || new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'pending' | 'unpaid'>(
    bill.paymentStatus || bill.status || 'unpaid'
  );
  const [notes, setNotes] = useState<string>(bill.notes || '');

  // Live Recalculations
  // Formula:
  // 1. Milk Amount = Delivered Litres × Milk Rate
  const computedMilkAmount = Math.round(deliveredLiters * milkRate);
  // 2. Total Bill = Milk Amount + Extra Charges + Previous Balance - Discounts
  const computedTotalBill = Math.max(0, computedMilkAmount + extraCharges + previousBalance - discounts);
  // 3. Remaining Balance = Total Bill - Payments Received
  const computedRemainingBalance = Math.max(0, computedTotalBill - paymentsReceived);

  // Auto-sync status when balance reaches 0 or partial
  useEffect(() => {
    if (computedRemainingBalance === 0 && computedTotalBill > 0) {
      setPaymentStatus('paid');
    } else if (paymentsReceived > 0 && computedRemainingBalance > 0) {
      setPaymentStatus('partial');
    } else if (paymentsReceived === 0) {
      setPaymentStatus('pending');
    }
  }, [computedRemainingBalance, computedTotalBill, paymentsReceived]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'history'>('edit');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const changesSummary = `Updated: Liters=${deliveredLiters}L, Rate=₹${milkRate}, Total=₹${computedTotalBill}, Paid=₹${paymentsReceived}, Balance=₹${computedRemainingBalance}`;

    const payload = {
      customerId: bill.customerId,
      customerName,
      customerArea,
      customerMobile,
      month,
      milkType,
      totalDeliveredLiters: deliveredLiters,
      milkRate,
      holidayCount,
      extraCharges,
      previousBalance,
      discounts,
      paymentsReceived,
      paymentDate,
      paymentStatus,
      status: paymentStatus,
      notes,
      editedBy: `Admin ${ownerName || 'Ankit Kumar'}`,
      changesSummary,
    };

    try {
      // 1. Update backend database
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save bill');

      const updatedBill: MonthlyBill = data.bill;

      // 2. Sync to Firestore in real-time
      try {
        await syncBillToFirestore(updatedBill);
      } catch (fErr) {
        console.warn('Firestore bill sync warning:', fErr);
      }

      onSaved(updatedBill);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-blue-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {lang === 'hi' ? 'मासिक दूध बिल संपादन व नियंत्रण' : 'Owner Bill Management & Control'}
              </h3>
              <p className="text-[11px] text-blue-200">
                {bill.customerName} • {bill.month}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Edit form vs Edit History */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`py-2.5 px-4 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'edit'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'hi' ? 'बिल विवरण बदलें' : 'Edit Bill Details'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-4 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>
              {lang === 'hi' ? 'संपादन इतिहास' : 'Edit History'} ({bill.editHistory?.length || 0})
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'edit' ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* 1. Customer & Month Information */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-blue-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <User className="w-4 h-4 text-blue-700" />
                  <span>ग्राहक व बिल का विवरण (Customer & Month)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">ग्राहक का नाम</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">मोबाइल नंबर</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">एरिया / पूरा पता</label>
                    <input
                      type="text"
                      value={customerArea}
                      onChange={(e) => setCustomerArea(e.target.value)}
                      placeholder="e.g. Life Line Care Chaprai Road Sakit 207121 (Etah)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">बिल का महीना (YYYY-MM)</label>
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Milk Quantity, Type & Rate */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                <h4 className="font-bold text-blue-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <Calculator className="w-4 h-4 text-blue-700" />
                  <span>दूध की मात्रा व दर (Delivery & Rate)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">दूध का प्रकार</label>
                    <select
                      value={milkType}
                      onChange={(e) => setMilkType(e.target.value as MilkType)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                    >
                      <option value="cow">Gaay ka Doodh (गाय दूध)</option>
                      <option value="buffalo">Bhains ka Doodh (भैंस दूध)</option>
                      <option value="mix">Mix Doodh (मिश्रित दूध)</option>
                      <option value="other">Special Dairy Milk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">कुल डिलीवर दूध (Litres)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={deliveredLiters}
                      onChange={(e) => setDeliveredLiters(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-blue-950 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">प्रति लीटर दर (₹ / Litre)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={milkRate}
                      onChange={(e) => setMilkRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">छुट्टी के दिन (Chhutti ke din)</label>
                    <input
                      type="number"
                      min="0"
                      value={holidayCount}
                      onChange={(e) => setHolidayCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">अतिरिक्त दूध चार्ज (₹ Extra Charges)</label>
                    <input
                      type="number"
                      min="0"
                      value={extraCharges}
                      onChange={(e) => setExtraCharges(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-semibold text-amber-700"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Balances, Payments & Discounts */}
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 space-y-3">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <IndianRupee className="w-4 h-4 text-emerald-700" />
                  <span>पिछला बकाया, छूट व जमा भुगतान</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">पिछला बकाया (₹ Previous)</label>
                    <input
                      type="number"
                      min="0"
                      value={previousBalance}
                      onChange={(e) => setPreviousBalance(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-rose-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">विशेष छूट (₹ Discounts)</label>
                    <input
                      type="number"
                      min="0"
                      value={discounts}
                      onChange={(e) => setDiscounts(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-semibold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">जमा भुगतान (₹ Paid)</label>
                    <input
                      type="number"
                      min="0"
                      value={paymentsReceived}
                      onChange={(e) => setPaymentsReceived(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">भुगतान की स्थिति (Status)</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                    >
                      <option value="pending">Pending (भुगतान बकाया)</option>
                      <option value="partial">Partially Paid (आंशिक भुगतान)</option>
                      <option value="paid">Paid (पूर्ण भुगतान प्राप्त)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">भुगतान तारीख</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">विशेष टिप्पणी / नोट्स</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. 5 तारीख को कैश दिया गया था"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* 4. REAL-TIME CALCULATION SUMMARY (HIGHLIGHT BOX) */}
              <div className="p-4 bg-gradient-to-br from-blue-950 to-indigo-950 text-white rounded-2xl shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-200">
                  <span>सटीक ऑटोमैटिक गणना (Live Auto-Recalculation)</span>
                  <span className="font-mono">{deliveredLiters}L × ₹{milkRate} = ₹{computedMilkAmount}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-white/10 text-xs">
                  <div>
                    <div className="text-blue-300 text-[11px]">दूध राशि:</div>
                    <div className="font-mono font-bold text-sm">₹{computedMilkAmount}</div>
                  </div>
                  <div>
                    <div className="text-amber-300 text-[11px]">+ अतिरिक्त/पिछला - छूट:</div>
                    <div className="font-mono font-bold text-sm">
                      +₹{extraCharges + previousBalance} -₹{discounts}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-emerald-300 text-[11px]">- जमा भुगतान:</div>
                    <div className="font-mono font-bold text-sm">-₹{paymentsReceived}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-amber-300 font-bold uppercase">KUL BILL (कुल बिल):</div>
                    <div className="text-xl font-black text-white font-mono">₹{computedTotalBill}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-blue-200 font-bold uppercase">
                      {computedRemainingBalance === 0 ? 'STATUS:' : 'PAYMENT BAKI:'}
                    </div>
                    <div className={`text-xl font-black font-mono ${computedRemainingBalance === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {computedRemainingBalance === 0 ? 'PAID ✓' : `₹${computedRemainingBalance}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>{saving ? 'सुरक्षित हो रहा है...' : 'बिल सुरक्षित करें (Save Bill)'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* EDIT HISTORY TAB */
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                इस बिल में मालिक/एडमिन द्वारा किए गए सभी बदलावों का टाइमस्टैम्प ऑडिट लॉग:
              </div>

              {(!bill.editHistory || bill.editHistory.length === 0) ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  अभी तक कोई पिछला संपादन इतिहास मौजूद नहीं है।
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border rounded-2xl overflow-hidden bg-slate-50">
                  {bill.editHistory.map((hist, idx) => (
                    <div key={idx} className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-700 font-semibold">
                        <span className="flex items-center gap-1.5 text-blue-900 font-bold">
                          <User className="w-3.5 h-3.5" />
                          <span>{hist.editedBy}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(hist.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px]">
                        {hist.changesSummary}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
