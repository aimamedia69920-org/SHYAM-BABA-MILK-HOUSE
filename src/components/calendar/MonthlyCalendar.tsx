import React, { useState, useEffect } from 'react';
import { Language, DeliveryRecord, CustomerProfile, DeliveryStatus } from '../../types/dairy';
import { translations } from '../../i18n/translations';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Calendar as CalendarIcon, Edit3, Plus, History } from 'lucide-react';

interface Props {
  lang: Language;
  customerId?: string; // If set, fixed to that customer (e.g. customer view)
  customers?: CustomerProfile[];
  isOwner?: boolean;
  onRecordUpdated?: () => void;
}

export const MonthlyCalendar: React.FC<Props> = ({
  lang,
  customerId,
  customers = [],
  isOwner = false,
  onRecordUpdated,
}) => {
  const t = translations[lang];

  // Current selected month state (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [selectedCustomer, setSelectedCustomer] = useState<string>(customerId || (customers[0]?.id || ''));
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit record modal state for Owner
  const [editingRecord, setEditingRecord] = useState<DeliveryRecord | null>(null);
  const [editStatus, setEditStatus] = useState<DeliveryStatus>('delivered');
  const [editQuantity, setEditQuantity] = useState('1.5');
  const [editRate, setEditRate] = useState('60');
  const [editNotes, setEditNotes] = useState('');
  const [editExtra, setEditExtra] = useState(false);
  const [showHistory, setShowHistory] = useState<DeliveryRecord | null>(null);

  useEffect(() => {
    if (customerId) {
      setSelectedCustomer(customerId);
    }
  }, [customerId]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/deliveries', window.location.origin);
      url.searchParams.set('month', selectedMonth);
      if (selectedCustomer && selectedCustomer !== 'all') {
        url.searchParams.set('customerId', selectedCustomer);
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data);
      }
    } catch (err) {
      console.error('Error fetching calendar deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [selectedMonth, selectedCustomer]);

  // Navigate months
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  // Generate days of selected month
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const monthName = new Date(yearNum, monthNum - 1, 1).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const handleOpenEdit = (rec: DeliveryRecord) => {
    setEditingRecord(rec);
    setEditStatus(rec.status);
    setEditQuantity(rec.milkQuantityLiters.toString());
    setEditRate(rec.ratePerLiter.toString());
    setEditNotes(rec.notes || '');
    setEditExtra(!!rec.isExtraDelivery);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: editingRecord.customerId,
          date: editingRecord.date,
          milkQuantityLiters: parseFloat(editQuantity),
          milkType: editingRecord.milkType,
          ratePerLiter: parseFloat(editRate),
          status: editStatus,
          isExtraDelivery: editExtra,
          notes: editNotes,
          createdBy: 'owner',
        }),
      });

      if (res.ok) {
        setEditingRecord(null);
        fetchDeliveries();
        if (onRecordUpdated) onRecordUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-4 sm:p-6 space-y-5">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-700" />
          <h3 className="text-lg font-bold text-blue-950">
            {t.monthlyCalendar}
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200">
            {monthName}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Customer Selector for Owner */}
          {isOwner && customers.length > 0 && !customerId && (
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-800"
            >
              <option value="all">{lang === 'hi' ? 'सभी ग्राहक (All Customers)' : 'All Customers'}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.mobile})
                </option>
              ))}
            </select>
          )}

          {/* Month Steppers */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs transition cursor-pointer"
              title={t.prevMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 text-slate-800 min-w-[70px] text-center font-mono">
              {selectedMonth}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs transition cursor-pointer"
              title={t.nextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
        <span className="font-bold text-slate-700">{lang === 'hi' ? 'संकेत:' : 'Status Legend:'}</span>
        <div className="flex items-center gap-1 text-emerald-700 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'hi' ? 'दूध वितरित (Green)' : 'Delivered'}</span>
        </div>
        <div className="flex items-center gap-1 text-rose-700 font-medium">
          <XCircle className="w-4 h-4 text-rose-600" />
          <span>{lang === 'hi' ? 'रद्द (Red - बिल में नहीं)' : 'Cancelled (No Charge)'}</span>
        </div>
        <div className="flex items-center gap-1 text-amber-700 font-medium">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>{lang === 'hi' ? 'पुष्टि प्रतीक्षित (Yellow)' : 'Pending'}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 font-medium">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-300 inline-block" />
          <span>{lang === 'hi' ? 'आगामी तारीख (Grey)' : 'Future'}</span>
        </div>
      </div>

      {/* Responsive Table / Cards */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 sm:px-4">{t.date}</th>
              <th className="py-2.5 px-3">{t.day}</th>
              {selectedCustomer === 'all' && <th className="py-2.5 px-3">{t.fullName}</th>}
              <th className="py-2.5 px-3">{t.status}</th>
              <th className="py-2.5 px-3 text-right">{t.quantity}</th>
              <th className="py-2.5 px-3 text-right">{t.rate}</th>
              <th className="py-2.5 px-3 text-right">{t.total}</th>
              {isOwner && <th className="py-2.5 px-3 text-center">{lang === 'hi' ? 'कार्य' : 'Action'}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const dayFormatted = String(dayNum).padStart(2, '0');
              const fullDate = `${selectedMonth}-${dayFormatted}`;
              const dateObj = new Date(yearNum, monthNum - 1, dayNum);
              const dayName = dateObj.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });

              // Filter matching deliveries
              const dayDeliveries = deliveries.filter((d) => d.date === fullDate);
              const isFuture = fullDate > todayStr;

              if (dayDeliveries.length === 0) {
                // No record logged yet for this date
                return (
                  <tr key={fullDate} className={isFuture ? 'bg-slate-50/50 text-slate-400' : 'hover:bg-slate-50'}>
                    <td className="py-2.5 px-3 sm:px-4 font-mono font-medium">{dayFormatted}</td>
                    <td className="py-2.5 px-3">{dayName}</td>
                    {selectedCustomer === 'all' && <td className="py-2.5 px-3">-</td>}
                    <td className="py-2.5 px-3">
                      {isFuture ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                          {t.future}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {t.pending}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-400">-</td>
                    {isOwner && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            const newRec: DeliveryRecord = {
                              id: `new_${fullDate}`,
                              customerId: selectedCustomer !== 'all' ? selectedCustomer : (customers[0]?.id || ''),
                              customerName: '',
                              date: fullDate,
                              milkQuantityLiters: 1.5,
                              milkType: 'cow',
                              ratePerLiter: 60,
                              totalAmount: 90,
                              status: 'delivered',
                              createdBy: 'owner',
                              createdAt: '',
                              updatedAt: '',
                            };
                            handleOpenEdit(newRec);
                          }}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{lang === 'hi' ? 'जोड़ें' : 'Add'}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              }

              return dayDeliveries.map((rec) => {
                const isDelivered = rec.status === 'delivered';
                const isCancelled = rec.status === 'cancelled';

                return (
                  <tr
                    key={rec.id}
                    className={`hover:bg-blue-50/40 transition ${
                      isCancelled ? 'bg-rose-50/30' : isDelivered ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-slate-800">
                      {dayFormatted}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">{dayName}</td>
                    {selectedCustomer === 'all' && (
                      <td className="py-2.5 px-3 font-semibold text-blue-900">{rec.customerName}</td>
                    )}
                    <td className="py-2.5 px-3">
                      {isDelivered && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lang === 'hi' ? 'सफल वितरण' : 'Delivered'}</span>
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs" title="Not counted in monthly bill">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{lang === 'hi' ? 'रद्द (निःशुल्क)' : 'Cancelled'}</span>
                        </span>
                      )}
                      {rec.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t.pending}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {isCancelled ? (
                        <span className="text-slate-400 line-through">0 L</span>
                      ) : (
                        `${rec.milkQuantityLiters} L`
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                      ₹{rec.ratePerLiter}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-950">
                      {isCancelled ? (
                        <span className="text-slate-400 font-normal">₹0</span>
                      ) : (
                        `₹${rec.totalAmount}`
                      )}
                    </td>
                    {isOwner && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                            title={t.editCustomer}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {rec.history && rec.history.length > 0 && (
                            <button
                              onClick={() => setShowHistory(rec)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title={lang === 'hi' ? 'परिवर्तन इतिहास' : 'Audit Trail'}
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Record Modal (Owner Only) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-blue-100">
            <h4 className="text-lg font-bold text-blue-950 mb-3">
              {lang === 'hi' ? 'दूध वितरण रिकॉर्ड संपादित करें' : 'Edit Delivery Record'} ({editingRecord.date})
            </h4>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.status}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('delivered')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      editStatus === 'delivered'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.delivered}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatus('cancelled')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      editStatus === 'cancelled'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{t.cancelled}</span>
                  </button>
                </div>
              </div>

              {editStatus === 'delivered' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">{t.quantity}</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">{t.rate}</label>
                      <input
                        type="number"
                        value={editRate}
                        onChange={(e) => setEditRate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="extraCheck"
                      checked={editExtra}
                      onChange={(e) => setEditExtra(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <label htmlFor="extraCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      {t.extraDelivery} (नियमित के अलावा अतिरिक्त दूध)
                    </label>
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'टिप्पणी / विवरण' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder={lang === 'hi' ? 'कारण या विवरण लिखें' : 'Enter note or reason'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition cursor-pointer"
              >
                {t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History View Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-3">
              {lang === 'hi' ? 'परिवर्तन ऑडिट इतिहास' : 'Change Audit Trail'} ({showHistory.date})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              {showHistory.history?.map((h, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-500 font-mono text-[10px]">
                    <span>{new Date(h.timestamp).toLocaleString()}</span>
                    <span>{h.changedBy}</span>
                  </div>
                  <div className="font-semibold text-slate-800 mt-1">{h.action}</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    पूर्व स्थिति: {h.previousValues?.status} ({h.previousValues?.milkQuantityLiters} L) → नई स्थिति: {h.newValues?.status} ({h.newValues?.milkQuantityLiters} L)
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowHistory(null)}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              {lang === 'hi' ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
