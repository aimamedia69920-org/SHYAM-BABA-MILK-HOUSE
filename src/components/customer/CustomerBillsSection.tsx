import React, { useState, useEffect } from 'react';
import { CustomerProfile, MonthlyBill, Language } from '../../types/dairy';
import { MilkBillPoster } from '../bills/MilkBillPoster';
import { subscribeToCustomerBills } from '../../firebase/billsService';
import {
  FileText,
  Calendar,
  Download,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  Droplet,
  ChevronRight,
  RefreshCw,
  Search
} from 'lucide-react';

interface Props {
  customer: CustomerProfile;
  lang: Language;
}

export const CustomerBillsSection: React.FC<Props> = ({
  customer,
  lang,
}) => {
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [selectedBill, setSelectedBill] = useState<MonthlyBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMonthFilter, setActiveMonthFilter] = useState<string>('all');

  // Fetch initial bills from API
  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bills?customerId=${customer.id}`);
      if (res.ok) {
        const data: MonthlyBill[] = await res.json();
        // Sort descending by month
        data.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
        setBills(data);
        if (data.length > 0 && !selectedBill) {
          setSelectedBill(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching customer bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();

    // Attach real-time Firestore listener for customer's bills
    const unsubscribe = subscribeToCustomerBills(customer.id, (realtimeBills) => {
      if (realtimeBills.length > 0) {
        setBills(realtimeBills);
        setSelectedBill((prev) => {
          if (!prev) return realtimeBills[0];
          const matched = realtimeBills.find((b) => b.id === prev.id);
          return matched || realtimeBills[0];
        });
      }
    });

    return () => unsubscribe();
  }, [customer.id]);

  const filteredBills = activeMonthFilter === 'all'
    ? bills
    : bills.filter((b) => b.month === activeMonthFilter);

  // Status badge helper
  const getStatusBadge = (b: MonthlyBill) => {
    const isPaid = (b.remainingBalance || 0) === 0 || b.status === 'paid' || b.paymentStatus === 'paid';
    const isPartial = (b.paymentsReceived || 0) > 0 && (b.remainingBalance || 0) > 0;

    if (isPaid) {
      return {
        label: lang === 'hi' ? 'भुगतान प्राप्त (Paid)' : 'Paid',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: CheckCircle2,
      };
    }
    if (isPartial) {
      return {
        label: lang === 'hi' ? 'आंशिक भुगतान' : 'Partially Paid',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: Clock,
      };
    }
    return {
      label: lang === 'hi' ? 'भुगतान बाकी' : 'Payment Due',
      bg: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: AlertCircle,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
            <span>📄 आधिकारिक बिलिंग प्रणाली</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {lang === 'hi' ? 'मेरे मासिक दूध के बिल' : 'My Monthly Milk Bills'}
          </h2>
          <p className="text-xs text-blue-200">
            {customer.fullName} • मोबाइल: +91 {customer.mobile}
          </p>
        </div>

        <button
          onClick={fetchBills}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
          <span>{lang === 'hi' ? 'रिफ्रेश करें' : 'Refresh'}</span>
        </button>
      </div>

      {/* Grid: Left list of bills, Right bill preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: List of months (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-wide text-slate-500">
                {lang === 'hi' ? 'महीनों की सूची' : 'Select Month'} ({bills.length})
              </h3>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {lang === 'hi' ? 'बिल लोड हो रहे हैं...' : 'Loading bills...'}
              </div>
            ) : bills.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2 text-xs">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p>{lang === 'hi' ? 'अभी तक कोई बिल जनरेट नहीं हुआ है।' : 'No bills available yet.'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bills.map((b) => {
                  const badge = getStatusBadge(b);
                  const isSelected = selectedBill?.id === b.id;
                  const BadgeIcon = badge.icon;
                  const liters = b.totalDeliveredLiters || 0;
                  const balance = b.remainingBalance !== undefined ? b.remainingBalance : 0;
                  const total = b.totalMilkAmount + (b.extraCharges || b.extraMilkAmount || 0) + (b.previousBalance || 0) - (b.discounts || 0);

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBill(b)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-900 bg-blue-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-blue-900" />
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {b.monthName || b.month}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1.5 border-t border-slate-100">
                        <div>
                          <div className="text-slate-400">दूध मात्रा</div>
                          <div className="font-bold text-blue-950 font-mono">{liters} L</div>
                        </div>
                        <div>
                          <div className="text-slate-400">कुल बिल</div>
                          <div className="font-bold text-slate-900 font-mono">₹{total}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">बकाया</div>
                          <div className={`font-black font-mono ${balance === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {balance === 0 ? '₹0 (Paid)' : `₹${balance}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Full Milk Bill Poster Preview (7 cols) */}
        <div className="lg:col-span-7">
          {selectedBill ? (
            <MilkBillPoster
              bill={selectedBill}
              lang={lang}
              showCloseButton={false}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs space-y-2">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <p>कृपया बाएँ हाथ से कोई महीना चुनें जिससे उसका पूरा दूध बिल यहाँ दिखाई दे सके।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
