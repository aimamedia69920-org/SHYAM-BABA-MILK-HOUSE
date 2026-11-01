import React from 'react';
import { Language } from '../../types/dairy';
import {
  ArrowLeft,
  FileCheck,
  Smartphone,
  Tag,
  ShoppingBag,
  Clock,
  CreditCard,
  RotateCcw,
  CalendarCheck,
  UserCheck,
  PhoneCall,
  Edit3
} from 'lucide-react';

interface Props {
  lang: Language;
  onBack: () => void;
}

export const TermsAndConditions: React.FC<Props> = ({ lang, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Back Action Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'hi' ? '← मुख्य पृष्ठ पर वापस जाएं' : '← Back to Home Page'}</span>
          </button>
          <div className="text-xs text-slate-500 font-medium">
            URL: <span className="font-mono text-blue-700">https://sbmh.org/terms</span>
          </div>
        </div>

        {/* Main Terms Container */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xl p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold mb-3 border border-amber-200">
              <FileCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>SHYAM BABA MILK HOUSE • नियम व शर्तें</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-blue-950">
              {lang === 'hi' ? 'नियम एवं शर्तें (Terms and Conditions)' : 'Terms & Conditions'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              {lang === 'hi'
                ? 'प्रभावी तिथि: 30 अक्टूबर 2026 | श्याम बाबा मिल्क हाउस (सकित, एटा, उत्तर प्रदेश)'
                : 'Effective Date: October 30, 2026 | Shyam Baba Milk House (Sakit, Etah, Uttar Pradesh)'}
            </p>
          </div>

          {/* Slogan Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-amber-300 font-bold text-sm">
                🙏 शुद्ध दूध • शुद्धता का विश्वास • Fresh Milk, Trusted Service
              </div>
              <div className="text-xs text-blue-100 mt-0.5">
                {lang === 'hi'
                  ? 'हमारी सेवाओं का उपयोग करने से पहले कृपया नीचे दिए गए 10 मुख्य नियम व शर्तें ध्यानपूर्वक पढ़ें।'
                  : 'Please read the following 10 key terms carefully prior to registering or placing milk orders.'}
              </div>
            </div>
          </div>

          {/* 10 Required Sections */}
          <div className="space-y-6 text-slate-700 text-sm leading-relaxed">
            {/* 1. Customer Registration and OTP Login Rules */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-base">
                <Smartphone className="w-5 h-5 text-blue-700 shrink-0" />
                <h2>{lang === 'hi' ? '1. ग्राहक पंजीकरण एवं OTP लॉगिन नियम' : '1. Customer Registration & OTP Login Rules'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'प्रत्येक ग्राहक केवल एक वैध 10-अंकीय भारतीय मोबाइल नंबर से अपना खाता बना सकता है। पंजीकरण व लॉगिन के समय सुरक्षा हेतु वास्तविक SMS OTP सत्यापन अनिवार्य है। ग्राहक अपने पासवर्ड और खाते की गोपनीयता बनाए रखने के लिए स्वयं उत्तरदायी हैं। अनधिकृत पहुंच की स्थिति में तुरंत डेयरी प्रबंधन को सूचित करें।'
                  : 'Each customer may register only one active account per valid 10-digit Indian mobile number. Real SMS OTP verification via Firebase Authentication is mandatory during registration and password reset. Customers are strictly responsible for maintaining credential secrecy.'}
              </p>
            </div>

            {/* 2. Milk Product Prices & Price Changes */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-base">
                <Tag className="w-5 h-5 text-amber-600 shrink-0" />
                <h2>{lang === 'hi' ? '2. दूध उत्पाद मूल्य एवं मूल्य संशोधन' : '2. Milk Product Prices & Rate Revisions'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'वर्तमान आधार दरें: गाय का ताजा दूध ₹55/लीटर, भैंस का शुद्ध दूध ₹65/लीटर, तथा मिक्स दूध ₹60/लीटर है। डेयरी उत्पाद (शुद्ध देसी घी ₹650/किलो, ताजा पनीर ₹360/किलो, ताजा दही ₹75/किलो आदि) स्टोर में सूचीबद्ध हैं। चारे की लागत व मौसमी परिवर्तनों के आधार पर प्रबंधन को दरों में संशोधन का अधिकार है, जिसकी सूचना ऐप/एसएमएस द्वारा पूर्व में दी जाएगी।'
                  : 'Current baseline rates: Fresh Cow Milk ₹55/L, Pure Buffalo Milk ₹65/L, Mix Milk ₹60/L. Dairy essentials (Desi Cow Ghee ₹650/kg, Fresh Paneer ₹360/kg, Fresh Curd ₹75/kg) are listed in our store. The dairy management reserves the right to revise tariffs due to seasonal fodder fluctuations with prior notice.'}
              </p>
            </div>

            {/* 3. Order Placement, Confirmation & Cancellation Rules */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-base">
                <ShoppingBag className="w-5 h-5 text-emerald-600 shrink-0" />
                <h2>{lang === 'hi' ? '3. ऑर्डर देना, पुष्टि एवं रद्दीकरण नियम' : '3. Order Placement, Confirmation & Cancellation'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'दैनिक नियमित दूध आपूर्ति स्वचालित रूप से आपके चयनित शेड्यूल के अनुसार वितरित की जाती है। यदि किसी दिन दूध की आवश्यकता न हो या अतिरिक्त दूध चाहिए, तो ग्राहक को डिलीवरी से पूर्व शाम 8:00 बजे तक ऐप में "डिलीवरी स्किप/पॉज़" या नया ऑर्डर अपडेट करना होगा। डिलीवरी रूट निकलने के बाद रद्दीकरण स्वीकार नहीं किया जाएगा।'
                  : 'Daily milk subscription is fulfilled automatically per your active profile. To skip, pause, or order extra quantity on any given day, updates must be submitted via the app or WhatsApp before the 8:00 PM cutoff on the preceding evening. Cancellations after route dispatch cannot be refunded.'}
              </p>
            </div>

            {/* 4. Milk Delivery Schedule & Serviceable PIN Codes */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-base">
                <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
                <h2>{lang === 'hi' ? '4. डिलीवरी समय सारिणी एवं सेवा योग्य पिन कोड' : '4. Delivery Schedule & Serviceable PIN Codes'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'प्रातःकालीन डिलीवरी समय सुबह 6:00 बजे से 8:30 बजे तक तथा सायंकालीन डिलीवरी समय सायं 5:00 बजे से 7:30 बजे तक है। प्राथमिक सेवा क्षेत्र: सकित (एटा), पिन कोड 207121 एवं आसपास के चिन्हित ग्रामीण व शहरी क्षेत्र। केवल सत्यापित सेवा योग्य पिन कोड पर ही डोरस्टेप डिलीवरी उपलब्ध है।'
                  : 'Morning delivery window: 6:00 AM to 8:30 AM; Evening window: 5:00 PM to 7:30 PM. Primary serviceable territory: Sakit (Etah), postal PIN code 207121 and adjoining verified sectors. Home delivery is fulfilled strictly within verified PIN codes.'}
              </p>
            </div>

            {/* 5. COD & UPI Payment Terms */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-base">
                <CreditCard className="w-5 h-5 text-blue-700 shrink-0" />
                <h2>{lang === 'hi' ? '5. नकद (COD) एवं आधिकारिक UPI भुगतान शर्तें' : '5. Cash on Delivery (COD) & Official UPI Terms'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'ग्राहक नकद (Cash on Delivery) या आधिकारिक Paytm UPI QR कोड द्वारा भुगतान कर सकते हैं। आधिकारिक UPI ID: 7078376806@ptyes (आधिकारिक नाम: Ankit Ankit)। UPI द्वारा भुगतान करने के पश्चात ऐप में भुगतान स्क्रीनशॉट व संदर्भ संख्या अपलोड करना अनिवार्य है ताकि आपके बिल में तुरंत क्रेडिट दर्ज हो सके।'
                  : 'Payments are accepted via Cash on Handover or digital UPI. Official Paytm UPI ID: 7078376806@ptyes (Payee: Ankit Ankit). Upon making a digital transfer, submitting the payment screenshot or UTR reference within the app is mandatory for automated ledger reconciliation.'}
              </p>
            </div>

            {/* 6. Refund & Payment Dispute Process */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-base">
                <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
                <h2>{lang === 'hi' ? '6. रिफंड एवं भुगतान विवाद समाधान प्रक्रिया' : '6. Refund & Billing Dispute Process'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'यदि दूध की गुणवत्ता, मात्रा या वितरण में कोई समस्या हो, तो ग्राहक को डिलीवरी के 24 घंटे के भीतर ऐप के "सपोर्ट/शिकायत" या WhatsApp पर सूचित करना होगा। सत्यापन के बाद अगले दिन प्रतिस्थापन दूध दिया जाएगा या आगामी मासिक बिल में समतुल्य राशि क्रेडिट (समायोजित) कर दी जाएगी।'
                  : 'In the rare event of quality disparity, non-delivery, or billing variance, customers must report the discrepancy within 24 hours via customer support or WhatsApp. Verified claims receive either immediate replacement stock or an equivalent credit deduction on the upcoming monthly cycle.'}
              </p>
            </div>

            {/* 7. Monthly Milk Bills & Payment Deadlines */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-base">
                <CalendarCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <h2>{lang === 'hi' ? '7. मासिक दूध बिल एवं भुगतान अंतिम तिथि' : '7. Monthly Milk Bills & Payment Deadlines'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'प्रत्येक माह के पिछले चक्र का बिल प्रत्येक माह की 1 तारीख को तैयार किया जाता है। मासिक बिल का भुगतान चक्र की 7 तारीख तक अनिवार्य रूप से पूर्ण होना चाहिए। निर्धारित तिथि तक भुगतान न होने पर सेवाओं को अस्थायी रूप से रोका जा सकता है। बिल की पीडीएफ रसीद ऐप से डाउनलोड की जा सकती है।'
                  : 'Monthly consolidated statements are generated on the 1st of each calendar month covering the preceding cycle. All outstanding dues must be settled by the 7th of the current month. Continued default may result in delivery pauses until cleared. Official PDF invoices can be downloaded anytime.'}
              </p>
            </div>

            {/* 8. Customer Responsibilities & Accurate Delivery Address */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-base">
                <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <h2>{lang === 'hi' ? '8. ग्राहक के उत्तरदायित्व एवं सटीक पता' : '8. Customer Responsibilities & Proper Receptacles'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'ग्राहक का यह कर्तव्य है कि वे डिलीवरी समय पर साफ-सुथरा बर्तन उपलब्ध कराएं या डोरबेल की व्यवस्था रखें। अपने पते या फोन नंबर में किसी भी बदलाव की स्थिति में ऐप प्रोफाइल तुरंत अपडेट करें। डिलीवरी बॉय के साथ सौहार्दपूर्ण व्यवहार बनाए रखें।'
                  : 'Customers must provide clean, covered milk utensils or designated reception containers at delivery time. Please keep delivery address landmarks and contact numbers up-to-date in your customer profile to avoid misrouted delivery trips.'}
              </p>
            </div>

            {/* 9. Owner Contact & Customer Support */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-base">
                <PhoneCall className="w-5 h-5 text-amber-700 shrink-0" />
                <h2>{lang === 'hi' ? '9. डेयरी मालिक संपर्क एवं ग्राहक सहायता' : '9. Owner Contact & Customer Support'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'किसी भी आपातकालीन सहायता, प्रश्न या सुझाव के लिए अधिकृत डेयरी मालिक अनीता देवी (Anita Devi) एवं प्रबंधन से सीधे संपर्क करें: मोबाइल/व्हाट्सएप: +91 7078376806, ईमेल: aimamedia69920@gmail.com, पता: सकित (एटा), उत्तर प्रदेश - 207121।'
                  : 'For administrative inquiries, feedback or immediate assistance, reach our owner Anita Devi and team directly: Mobile/WhatsApp: +91 7078376806, Email: aimamedia69920@gmail.com, Sakit (Etah), Uttar Pradesh - 207121.'}
              </p>
            </div>

            {/* 10. Changes to Terms & Conditions */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-base">
                <Edit3 className="w-5 h-5 text-purple-600 shrink-0" />
                <h2>{lang === 'hi' ? '10. नियम व शर्तों में संशोधन का अधिकार' : '10. Changes to Terms & Conditions'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'श्याम बाबा मिल्क हाउस को किसी भी समय इन नियमों एवं शर्तों में परिवर्तन करने का पूर्ण अधिकार है। किसी भी संशोधन की सूचना इस पेज https://sbmh.org/terms पर अद्यतन कर दी जाएगी। संशोधित शर्तों के प्रकाशन के पश्चात सेवाओं का उपयोग जारी रखना नियमों की स्वीकृति माना जाएगा।'
                  : 'Shyam Baba Milk House reserves the right to amend these Terms and Conditions as needed. Updated revisions will be published immediately at https://sbmh.org/terms. Continued use of dairy delivery services constitutes binding acceptance of modified terms.'}
              </p>
            </div>
          </div>

          {/* Bottom Back Button */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'hi' ? '← मुख्य पृष्ठ पर वापस जाएं' : '← Back to Home Page'}</span>
            </button>
            <div className="text-xs text-slate-400 text-center sm:text-right">
              🙏 SHYAM BABA MILK HOUSE • Sakit, Etah (UP) 🙏
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
