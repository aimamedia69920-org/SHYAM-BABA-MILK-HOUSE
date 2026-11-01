import React from 'react';
import { Language } from '../../types/dairy';
import { ArrowLeft, Shield, Lock, Smartphone, Database, QrCode, FileText, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

interface Props {
  lang: Language;
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<Props> = ({ lang, onBack }) => {
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
            URL: <span className="font-mono text-blue-700">https://sbmh.org/privacy-policy</span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-xl p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-3 border border-blue-200">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>SHYAM BABA MILK HOUSE • गोपनीयता नीति</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-blue-950">
              {lang === 'hi' ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              {lang === 'hi'
                ? 'अंतिम संशोधन: 30 अक्टूबर 2026 | श्याम बाबा मिल्क हाउस, सकित (एटा), उत्तर प्रदेश'
                : 'Last Updated: October 30, 2026 | Shyam Baba Milk House, Sakit (Etah), Uttar Pradesh'}
            </p>
          </div>

          {/* Hindi / English Dual Sections */}
          <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
            {/* Section 1: Introduction */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-blue-900">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">1</span>
                <h2>{lang === 'hi' ? 'प्रस्तावना एवं उद्देश्य (Introduction)' : 'Introduction & Overview'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'श्याम बाबा मिल्क हाउस ("हम", "हमारी डेयरी", या "SBMH") ग्राहकों के विश्वास और व्यक्तिगत जानकारी की गोपनीयता का पूर्ण सम्मान करता है। यह नीति बताती है कि जब आप हमारी वेबसाइट https://sbmh.org या मोबाइल वेब ऐप्लिकेशन का उपयोग करते हैं, तो आपकी जानकारी किस प्रकार एकत्रित, सुरक्षित व उपयोग की जाती है।'
                  : 'Shyam Baba Milk House ("we", "our dairy", or "SBMH") is deeply committed to protecting customer trust and privacy. This policy explains how your information is collected, secured, and utilized when you access our official website https://sbmh.org or responsive dairy web application.'}
              </p>
            </div>

            {/* Section 2: Mobile Number & OTP Authentication */}
            <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 text-base font-bold text-blue-900">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h2>{lang === 'hi' ? '2. मोबाइल नंबर एवं SMS OTP प्रमाणीकरण' : '2. Mobile Number & SMS OTP Authentication'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'खाता बनाने तथा सुरक्षित लॉगिन के लिए हम केवल आपका 10-अंकीय भारतीय मोबाइल नंबर एकत्रित करते हैं। लॉगिन व पंजीकरण की सुरक्षा के लिए Firebase Phone Authentication द्वारा आपके मोबाइल नंबर पर वास्तविक 6-अंकीय SMS OTP भेजा जाता है। आपके पासवर्ड को सुरक्षित एन्क्रिप्शन हैश के साथ संग्रहित किया जाता है और कभी भी प्लेन टेक्स्ट में नहीं रखा जाता।'
                  : 'For account creation and verified access, we collect your 10-digit Indian mobile phone number. Real 6-digit SMS OTPs are securely delivered via Firebase Phone Authentication to verify ownership. Passwords are cryptographically hashed and never stored in plain readable format.'}
              </p>
            </div>

            {/* Section 3: Customer Details & Delivery PIN Code */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-blue-900">
                <MapPin className="w-5 h-5 text-amber-600" />
                <h2>{lang === 'hi' ? '3. ग्राहक नाम, पता एवं डिलीवरी पिन कोड' : '3. Customer Name, Delivery Address & PIN Code'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'ताजा और शुद्ध दूध आपके घर तक समय पर पहुंचाने हेतु हम आपका पूरा नाम, सटीक डिलीवरी पता, मोहल्ला/मार्ग, नगर/कस्बा, जिला, राज्य तथा 6-अंकीय डाक पिन कोड (उदा. सकित - 207121) एकत्रित करते हैं। इस जानकारी का उपयोग केवल दैनिक दूध व डेयरी उत्पाद वितरण के लिए किया जाता है।'
                  : 'To ensure timely doorstep delivery of pure milk, we collect your full name, exact delivery street/landmark address, city/town, district, state, and 6-digit postal PIN code (e.g. Sakit - 207121). This data is solely used to dispatch daily morning and evening delivery routes.'}
              </p>
            </div>

            {/* Section 4: Orders, Delivery Records & Milk Ledger */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-blue-900">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2>{lang === 'hi' ? '4. ऑर्डर, दूध डिलीवरी रिकॉर्ड एवं मासिक बिल' : '4. Orders, Delivery Logs & Monthly Billing Data'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'हम आपके प्रतिदिन वितरित दूध की मात्रा (लीटर में), दूध का प्रकार (गाय, भैंस, या मिक्स दूध), दैनिक स्थिति (डिलीवर/उपलब्ध नहीं/छुट्टी), स्टोर उत्पाद ऑर्डर (घी, पनीर, दही), तथा मासिक बिलिंग डेटा का सटीक रिकॉर्ड रखते हैं। ग्राहक अपने डैशबोर्ड में किसी भी समय अपने संपूर्ण दैनिक रिकॉर्ड और पारदर्शी लेजर की जांच कर सकते हैं।'
                  : 'We maintain precise records of daily milk delivered (in liters), milk type (cow, buffalo, mix), daily status (delivered/skipped/absent), store purchases (ghee, paneer, dahi), and monthly consolidated bills. Customers can inspect their transparent delivery calendar and ledger anytime from their personal dashboard.'}
              </p>
            </div>

            {/* Section 5: Firebase Authentication & Firestore Storage */}
            <div className="space-y-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60">
              <div className="flex items-center gap-2 text-base font-bold text-amber-950">
                <Database className="w-5 h-5 text-amber-700" />
                <h2>{lang === 'hi' ? '5. Firebase ऑथेंटिकेशन एवं Firestore सुरक्षित डेटा स्टोरेज' : '5. Firebase Authentication & Firestore Cloud Storage'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'हमारा ऐप्लिकेशन Google Cloud Platform पर आधारित Firebase Firestore डेटाबेस और Firebase Authentication का उपयोग करता है। सभी नेटवर्क संचार HTTPS/TLS एन्क्रिप्शन के माध्यम से सुरक्षित रहते हैं। Firestore सुरक्षा नियमों (Security Rules) द्वारा यह सुनिश्चित किया जाता है कि ग्राहक केवल अपने स्वयं के रिकॉर्ड देख सकें तथा केवल अधिकृत डेयरी मालिक ही प्रशासनिक डेटा को नियंत्रित कर सकें।'
                  : 'Our application utilizes Google Cloud Firebase Firestore and Firebase Authentication. All data transmissions are encrypted using standard HTTPS/TLS protocols. Role-based Firestore Security Rules ensure each customer can only access their own records, while administrative dairy controls remain restricted to the verified owner.'}
              </p>
            </div>

            {/* Section 6: UPI Payment & Verification */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-blue-900">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h2>{lang === 'hi' ? '6. UPI भुगतान एवं भुगतान सत्यापन' : '6. UPI Payment & Verification Details'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'हम आधिकारिक Paytm UPI QR कोड तथा आधिकारिक UPI ID (7078376806@ptyes - Ankit Ankit) के माध्यम से ऑनलाइन भुगतान स्वीकार करते हैं। हम ग्राहकों के बैंक खाते, एटीएम पिन, या क्रेडिट कार्ड का संवेदनशील डेटा कभी भी स्टोर नहीं करते। ग्राहक द्वारा अपलोड किए गए भुगतान रसीद/स्क्रीनशॉट और UPI संदर्भ संख्या केवल बिल समायोजन और मालिक सत्यापन के लिए उपयोग की जाती है।'
                  : 'Online payments are processed through our official Paytm UPI QR code and official UPI ID (7078376806@ptyes, Payee: Ankit Ankit). We never store customer banking PINs, CVVs, or card credentials. Payment screenshots and transaction reference numbers uploaded by customers are used strictly for bill reconciliation and owner verification.'}
              </p>
            </div>

            {/* Section 7: Data Retention & Account Deletion */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Lock className="w-5 h-5 text-slate-700" />
                <h2>{lang === 'hi' ? '7. डेटा सुरक्षा, भंडारण अवधि एवं खाता हटाने का अनुरोध' : '7. Data Security, Retention & Account Deletion Requests'}</h2>
              </div>
              <p>
                {lang === 'hi'
                  ? 'ग्राहक डेटा केवल सक्रिय सेवा अवधि और वैधानिक वित्तीय रिकॉर्ड बनाए रखने तक सुरक्षित रूप से संग्रहित रहता है। यदि कोई ग्राहक अपनी सेवाएं बंद करना चाहता है या अपने खाते व डेटा को पूरी तरह हटाने (Account / Data Deletion) का अनुरोध करना चाहता है, तो वे सीधे हमारे आधिकारिक WhatsApp या हेल्पलाइन पर संपर्क कर सकते हैं। सत्यापन के पश्चात उनका डेटा स्थायी रूप से हटा दिया जाता है।'
                  : 'Customer information is retained only as long as active dairy services continue or as required for accounting ledgers. If you wish to terminate delivery or request complete deletion of your account and personal records, you may contact our dairy support via WhatsApp or email. Upon verification, requested data will be permanently purged.'}
              </p>
            </div>

            {/* Section 8: Contact Information */}
            <div className="space-y-3 p-5 bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-2xl">
              <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span>{lang === 'hi' ? '8. संपर्क सूत्र एवं सहायता (Privacy Contact)' : '8. Privacy Contact Information'}</span>
              </h2>
              <p className="text-xs text-blue-100">
                {lang === 'hi'
                  ? 'गोपनीयता नीति या अपनी व्यक्तिगत जानकारी से संबंधित किसी भी प्रश्न, सुधार या सहायता के लिए आप हमसे संपर्क कर सकते हैं:'
                  : 'For any privacy-related inquiries, corrections, or customer assistance, reach us at:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>सकित (एटा), उत्तर प्रदेश - 207121</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>+91 7078376806 (WhatsApp / कॉल)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>aimamedia69920@gmail.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0" />
                  <span>मालिक: अनीता देवी (Anita Devi)</span>
                </div>
              </div>
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
              🙏 SHYAM BABA MILK HOUSE • शुद्ध दूध • शुद्धता का विश्वास 🙏
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
