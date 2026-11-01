import React, { useState, useEffect, useRef } from 'react';
import { Language, CustomerProfile, OwnerProfile } from '../../types/dairy';
import { translations } from '../../i18n/translations';
import { auth, recaptchaSiteKey } from '../../firebase/config';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import {
  UserCheck,
  ShieldCheck,
  KeyRound,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Home,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  Sparkles,
  Info,
  Building2,
  Shield,
  FileText
} from 'lucide-react';
import { AIAssistantWelcome } from './AIAssistantWelcome';

interface Props {
  lang: Language;
  onCustomerLoginSuccess: (customer: CustomerProfile) => void;
  onOwnerLoginSuccess: (owner: OwnerProfile) => void;
  onNavigate?: (path: string) => void;
  onOpenAIChat?: () => void;
}

type AuthMode =
  | 'select'
  | 'customer_signin'
  | 'customer_login'
  | 'owner_signin'
  | 'owner_login'
  | 'forgot_password';

export const AuthSection: React.FC<Props> = ({
  lang,
  onCustomerLoginSuccess,
  onOwnerLoginSuccess,
  onNavigate,
  onOpenAIChat,
}) => {
  const t = translations[lang];
  const [mode, setMode] = useState<AuthMode>('select');

  // Customer form fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Sakit');
  const [district, setDistrict] = useState('Etah');
  const [state, setState] = useState('Uttar Pradesh');
  const [pinCode, setPinCode] = useState('207121');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dailyQuantity, setDailyQuantity] = useState('1.5');
  const [preferredMilkType, setPreferredMilkType] = useState<'cow' | 'buffalo' | 'mix'>('cow');
  const [showPassword, setShowPassword] = useState(false);

  // Owner form fields
  const [ownerName, setOwnerName] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerConfirmPassword, setOwnerConfirmPassword] = useState('');
  const [ownerPin, setOwnerPin] = useState('123456');

  // Real Firebase Phone Auth flow state
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState<number>(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Status & errors
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const resetForm = () => {
    setError(null);
    setSuccessNotice(null);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setConfirmationResult(null);
  };

  const getOrCreateRecaptcha = () => {
    const container = document.getElementById('recaptcha-container');
    if (!container) return null;

    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          setError(
            lang === 'hi'
              ? 'reCAPTCHA समय सीमा समाप्त। कृपया पुनः OTP भेजें।'
              : 'reCAPTCHA expired. Please try resending OTP.'
          );
        },
      });
    }
    return recaptchaVerifierRef.current;
  };

  const handleSendOtp = async () => {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      setError(
        lang === 'hi'
          ? 'कृपया 10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें'
          : 'Please enter valid 10-digit Indian mobile number'
      );
      return;
    }

    if (otpCooldown > 0) {
      setError(
        lang === 'hi'
          ? `कृपया ${otpCooldown} सेकंड बाद पुनः प्रयास करें`
          : `Please wait ${otpCooldown}s before resend`
      );
      return;
    }

    setError(null);
    setSuccessNotice(null);
    setOtpLoading(true);

    try {
      const verifier = getOrCreateRecaptcha();
      if (!verifier) {
        throw new Error('reCAPTCHA container initialization failed. Please reload.');
      }

      const fullPhoneNumber = `+91${cleanMobile}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setOtpCooldown(60);
      setSuccessNotice(
        lang === 'hi'
          ? `✓ मोबाइल नंबर +91 ${cleanMobile} पर SMS OTP भेज दिया गया है। कृपया अपने फ़ोन के संदेश चेक करें।`
          : `✓ SMS OTP sent successfully to +91 ${cleanMobile}. Please check your phone messages.`
      );
    } catch (err: any) {
      console.error('Firebase Phone Auth send-otp error:', err);

      // Reset recaptcha verifier on failure so user can try again
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }

      let userMsg = lang === 'hi' ? 'SMS OTP भेजने में त्रुटि हुई।' : 'Failed to send SMS OTP.';
      const code = err?.code || '';

      if (code === 'auth/invalid-phone-number') {
        userMsg =
          lang === 'hi'
            ? 'अमान्य मोबाइल नंबर! कृपया 10 अंकों का वैध भारतीय नंबर दर्ज करें (+91 स्वतः जोड़ा गया है)।'
            : 'Invalid phone number format (+91 Indian number required).';
      } else if (code === 'auth/too-many-requests') {
        userMsg =
          lang === 'hi'
            ? 'सुरक्षा कारणों से बहुत अधिक OTP अनुरोध प्राप्त हुए हैं। कृपया कुछ समय बाद पुनः प्रयास करें।'
            : 'Too many requests. Please wait a while before requesting another OTP.';
      } else if (code === 'auth/quota-exceeded') {
        userMsg =
          lang === 'hi'
            ? 'Firebase दैनिक SMS कोटा समाप्त हो गया है। कृपया Firebase कंसोल में SMS कोटा जांचें।'
            : 'Firebase daily SMS quota exceeded. Check quota in Firebase Console.';
      } else if (code === 'auth/captcha-check-failed') {
        userMsg =
          lang === 'hi'
            ? 'reCAPTCHA सुरक्षा जांच विफल रही। कृपया पृष्ठ को रीफ़्रेश कर पुनः प्रयास करें।'
            : 'reCAPTCHA verification failed. Please refresh the page and try again.';
      } else if (code === 'auth/app-not-authorized' || code === 'auth/unauthorized-domain') {
        userMsg =
          lang === 'hi'
            ? 'यह डोमेन Firebase Authorized Domains में पंजीकृत नहीं है। कृपया Firebase Console -> Authentication -> Settings -> Authorized Domains में यह डोमेन जोड़ें।'
            : 'This domain is not added to Firebase Authorized Domains (Firebase Console -> Authentication -> Settings -> Authorized Domains).';
      } else if (code === 'auth/billing-not-enabled') {
        userMsg =
          lang === 'hi'
            ? 'Firebase Phone Auth हेतु प्रोजेक्ट में बिलिंग सक्रिय होना आवश्यक है।'
            : 'Billing must be enabled on the Firebase project for Phone Authentication.';
      } else if (err?.message) {
        userMsg = `${userMsg} (${err.message})`;
      }
      setError(userMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length !== 6) {
      setError(
        lang === 'hi'
          ? 'कृपया SMS द्वारा प्राप्त 6 अंकों का OTP दर्ज करें'
          : 'Please enter 6-digit OTP received via SMS'
      );
      return;
    }

    if (!confirmationResult) {
      setError(
        lang === 'hi'
          ? 'सत्यापन सत्र नहीं मिला। कृपया पहले "OTP भेजें" पर क्लिक करें।'
          : 'No verification session found. Please send OTP first.'
      );
      return;
    }

    setError(null);
    setOtpLoading(true);

    try {
      await confirmationResult.confirm(otp.trim());
      setOtpVerified(true);
      setSuccessNotice(
        lang === 'hi'
          ? '✓ फ़ोन नंबर Firebase द्वारा सफलतापूर्वक सत्यापित हुआ!'
          : '✓ Phone number verified successfully via Firebase!'
      );
    } catch (err: any) {
      console.error('Firebase OTP verify error:', err);
      let userMsg = lang === 'hi' ? 'OTP सत्यापन विफल रहा।' : 'OTP verification failed.';
      const code = err?.code || '';

      if (code === 'auth/invalid-verification-code') {
        userMsg =
          lang === 'hi'
            ? 'गलत OTP कोड दर्ज किया गया है। कृपया अपने फ़ोन पर आए SMS को देखकर सही 6 अंक दर्ज करें।'
            : 'Invalid OTP code. Please check your SMS and enter the exact 6 digits.';
      } else if (code === 'auth/code-expired') {
        userMsg =
          lang === 'hi'
            ? 'OTP कोड की समय सीमा समाप्त हो चुकी है। कृपया नया OTP प्राप्त करने के लिए "OTP पुनः भेजें" पर क्लिक करें।'
            : 'OTP code has expired. Please click "Resend OTP" to request a new code.';
      } else if (err?.message) {
        userMsg = `${userMsg} (${err.message})`;
      }
      setError(userMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Customer Register
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !mobile || !password) {
      setError(lang === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === 'hi' ? 'पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते' : 'Passwords do not match');
      return;
    }
    if (!otpVerified) {
      setError(lang === 'hi' ? 'कृपया पहले मोबाइल नंबर पर प्राप्त SMS OTP सत्यापित करें' : 'Please verify SMS OTP first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          mobile,
          address,
          city,
          district,
          state,
          pinCode,
          password,
          dailyQuantityLiters: dailyQuantity,
          preferredMilkType,
          preferredLanguage: lang,
          firebaseVerified: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      onCustomerLoginSuccess(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Customer Login
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !password) {
      setError(lang === 'hi' ? 'मोबाइल नंबर और पासवर्ड दोनों आवश्यक हैं' : 'Mobile number and password required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      onCustomerLoginSuccess(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Owner Register / Sign In
  const handleOwnerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !ownerMobile || !ownerPassword) {
      setError(lang === 'hi' ? 'मालिक का नाम, मोबाइल नंबर और पासवर्ड आवश्यक हैं' : 'Owner name, mobile and password required');
      return;
    }
    if (ownerPassword !== ownerConfirmPassword) {
      setError(lang === 'hi' ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: ownerName,
          mobile: ownerMobile,
          password: ownerPassword,
          twoFactorPin: ownerPin || '123456',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Owner setup failed');

      onOwnerLoginSuccess(data.owner);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Owner setup failed');
    } finally {
      setLoading(false);
    }
  };

  // Owner Login
  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerMobile || !ownerPassword) {
      setError(lang === 'hi' ? 'मोबाइल नंबर और पासवर्ड दोनों आवश्यक हैं' : 'Mobile number and password are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: ownerMobile,
          password: ownerPassword,
          twoFactorPin: ownerPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Owner login failed');

      onOwnerLoginSuccess(data.owner);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Owner login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {/* Devotional Welcome Card with Official Logo */}
      <div className="text-center mb-8">
        <div className="inline-block p-1 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 rounded-full shadow-xl shadow-blue-950/15 mb-3 hover:scale-105 transition-transform duration-300">
          <img
            src="/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg"
            alt="Khatu Shyam Baba Logo"
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-inner"
          />
        </div>
        <div className="text-amber-600 font-extrabold text-xs uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
          <span>🥛</span>
          <span>{t.welcomeHeading}</span>
          <span>🥛</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight mb-1">
          {t.welcomeGreeting}
        </h2>
        <div className="text-xs sm:text-sm font-bold text-amber-700 mb-1">
          {t.tagline}
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {t.welcomeSubText}
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-amber-200/80 shadow-2xl shadow-blue-950/10 p-5 sm:p-8 relative overflow-hidden">
        {/* Firebase Phone Auth Invisible Recaptcha Mount Point */}
        <div id="recaptcha-container"></div>

        {/* Error / Notice Banners */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {successNotice && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>{successNotice}</div>
          </div>
        )}

        {/* 1. SELECTION SCREEN (4 CLEAR OPTIONS) */}
        {mode === 'select' && (
          <div className="space-y-3.5">
            {/* Start Page Friendly AI Assistant Welcome Message */}
            <AIAssistantWelcome lang={lang} onOpenAIChat={onOpenAIChat} />

            <div className="text-center pb-2">
              <h3 className="text-base sm:text-lg font-bold text-blue-950">
                {lang === 'hi' ? 'कृपया अपनी सुविधा अनुसार विकल्प चुनें' : 'Please select your login category'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'hi' ? 'ग्राहक पंजीकरण, नियमित ग्राहक लॉगिन, या मालिक नियंत्रण' : 'Customer sign in, login, or owner full access'}
              </p>
            </div>

            {/* OPTION 1: CUSTOMER SIGN IN */}
            <button
              onClick={() => { setMode('customer_signin'); resetForm(); }}
              className="w-full group p-4 rounded-2xl border-2 border-blue-100 hover:border-blue-600 bg-gradient-to-r from-blue-50/40 via-white to-blue-50/20 hover:from-blue-50 hover:to-blue-100/40 flex items-center justify-between text-left transition-all shadow-xs cursor-pointer hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-blue-950 group-hover:text-blue-700">
                    1. {t.customerSignIn}
                  </div>
                  <div className="text-xs text-slate-500">
                    {lang === 'hi' ? 'नया ग्राहक खाता बनाएं • पता, पिन कोड व मोबाइल OTP' : 'Create new customer account with delivery address'}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" />
            </button>

            {/* OPTION 2: CUSTOMER LOGIN */}
            <button
              onClick={() => { setMode('customer_login'); resetForm(); }}
              className="w-full group p-4 rounded-2xl border-2 border-emerald-100 hover:border-emerald-600 bg-gradient-to-r from-emerald-50/40 via-white to-emerald-50/20 hover:from-emerald-50 hover:to-emerald-100/40 flex items-center justify-between text-left transition-all shadow-xs cursor-pointer hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700">
                    2. {t.customerLogin}
                  </div>
                  <div className="text-xs text-slate-500">
                    {lang === 'hi' ? 'मोबाइल नंबर व पासवर्ड द्वारा लॉगिन करें' : 'Login to view orders, daily milk & bills'}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-500 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
            </button>

            {/* OPTION 3: OWNER SIGN IN / REGISTER */}
            <button
              onClick={() => { setMode('owner_signin'); resetForm(); }}
              className="w-full group p-4 rounded-2xl border-2 border-amber-200 hover:border-amber-600 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/20 hover:from-amber-50 hover:to-amber-100/40 flex items-center justify-between text-left transition-all shadow-xs cursor-pointer hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-amber-950 group-hover:text-amber-800">
                    3. {t.ownerSignIn}
                  </div>
                  <div className="text-xs text-amber-800/80">
                    {lang === 'hi' ? 'मालिक का नया पंजीकरण • अपना नाम, मोबाइल व पासवर्ड बनाएं' : 'Set up your own Owner account & password'}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-500 group-hover:text-amber-700 group-hover:translate-x-1 transition-all" />
            </button>

            {/* OPTION 4: OWNER LOGIN */}
            <button
              onClick={() => { setMode('owner_login'); resetForm(); }}
              className="w-full group p-4 rounded-2xl border-2 border-indigo-200 hover:border-indigo-600 bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/20 hover:from-indigo-50 hover:to-indigo-100/40 flex items-center justify-between text-left transition-all shadow-xs cursor-pointer hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-700/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-indigo-950 group-hover:text-indigo-800">
                    4. {t.ownerLogin}
                  </div>
                  <div className="text-xs text-indigo-800/80">
                    {lang === 'hi' ? 'मालिक डैशबोर्ड में प्रवेश करें (पूर्ण प्रशासनिक नियंत्रण)' : 'Enter Owner Dashboard with full control'}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-500 group-hover:text-indigo-700 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Quick Demo Access Bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 mb-2">
                {lang === 'hi' ? 'त्वरित परीक्षण के लिए पहले से सक्रिय खाते:' : 'Quick testing accounts:'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-[11px]">
                <button
                  onClick={() => {
                    setMode('customer_login');
                    setMobile('9876543210');
                    setPassword('shyam123');
                  }}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  👤 {lang === 'hi' ? 'ग्राहक: राहुल (9876543210)' : 'Customer: Rahul (9876543210)'}
                </button>
                <button
                  onClick={() => {
                    setMode('owner_login');
                    setOwnerMobile('7078376806');
                    setOwnerPassword('owner@123');
                    setOwnerPin('123456');
                  }}
                  className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200 transition cursor-pointer font-medium"
                >
                  👑 {lang === 'hi' ? 'मालिक: (7078376806 / owner@123)' : 'Owner (7078376806 / owner@123)'}
                </button>
              </div>

              {/* Legal & Policy Quick Access */}
              <div className="flex items-center justify-center gap-3 pt-4 mt-3 border-t border-slate-100 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => onNavigate?.('/privacy-policy')}
                  className="text-blue-700 hover:text-blue-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Shield className="w-3 h-3 text-blue-600" />
                  <span>{lang === 'hi' ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/terms')}
                  className="text-blue-700 hover:text-blue-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-amber-600" />
                  <span>{lang === 'hi' ? 'नियम व शर्तें (Terms)' : 'Terms & Conditions'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. CUSTOMER SIGN IN (WITH COMPLETE ADDRESS & ROBUST OTP) */}
        {mode === 'customer_signin' && (
          <form onSubmit={handleCustomerRegister} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-blue-950 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>{t.customerSignIn}</span>
              </h3>
              <button
                type="button"
                onClick={() => { setMode('select'); resetForm(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-900 text-xs font-bold transition shadow-xs cursor-pointer"
                title={lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Home'}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? '← मुख्य पृष्ठ' : '← Home'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.fullName} *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={lang === 'hi' ? 'उदा. राहुल कुमार' : 'e.g. Rahul Kumar'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>

            {/* Mobile & OTP Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.mobileNumber} *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="7078376806"
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                  />
                </div>
                <button
                  type="button"
                  disabled={otpLoading || otpVerified || otpCooldown > 0}
                  onClick={handleSendOtp}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                    otpVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-900 text-white hover:bg-blue-800'
                  }`}
                >
                  {otpLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {otpVerified ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'सत्यापित' : 'Verified'}</span>
                    </>
                  ) : otpCooldown > 0 ? (
                    <span>{otpCooldown}s</span>
                  ) : otpSent ? (
                    t.resendOtp
                  ) : (
                    t.sendOtp
                  )}
                </button>
              </div>

              {/* Real Firebase SMS OTP Input Section */}
              {otpSent && !otpVerified && (
                <div className="mt-3 p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2.5 animate-fade-in shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-700" />
                      <span>{lang === 'hi' ? 'SMS में प्राप्त 6-अंकीय OTP कोड दर्ज करें:' : 'Enter 6-digit OTP code received via SMS:'}</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="flex-1 px-3 py-2 rounded-xl border border-blue-300 text-base tracking-widest text-center font-mono font-bold bg-white text-blue-950 shadow-inner"
                    />
                    <button
                      type="button"
                      disabled={otpLoading || otp.trim().length !== 6}
                      onClick={handleVerifyOtp}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {otpLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{t.verifyOtp}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>{lang === 'hi' ? 'SMS प्राप्त नहीं हुआ?' : "Didn't receive SMS?"}</span>
                    <button
                      type="button"
                      disabled={otpCooldown > 0 || otpLoading}
                      onClick={handleSendOtp}
                      className="font-bold text-blue-700 hover:underline disabled:text-slate-400 cursor-pointer"
                    >
                      {otpCooldown > 0 ? `${otpCooldown}s बाद पुनः भेजें` : t.resendOtp}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Complete Address Fields */}
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-700" />
                <span>{lang === 'hi' ? 'डिलीवरी पता (All India Delivery Address)' : 'Delivery Address'}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t.address} *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={lang === 'hi' ? 'मकान नंबर, गली, मोहल्ला' : 'House no., Street, Area'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.city} *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Sakit"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.district} *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Etah"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.state} *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Uttar Pradesh"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.pinCode} *</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="207121"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-mono font-bold text-blue-900"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.password} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.confirmPassword} *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            {/* Terms and Conditions Acceptance Link Required */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-slate-700 leading-relaxed">
              <span className="text-amber-800 font-semibold">📜 {lang === 'hi' ? 'नियम व शर्तें सहमति:' : 'Terms Agreement:'}</span>{' '}
              {lang === 'hi' ? 'खाता बनाकर, आप हमारे ' : 'By creating an account, you agree to our '}
              <button
                type="button"
                onClick={() => onNavigate?.('/terms')}
                className="font-bold text-blue-800 underline hover:text-blue-950 cursor-pointer"
              >
                {lang === 'hi' ? 'नियम एवं शर्तों (Terms & Conditions)' : 'Terms & Conditions'}
              </button>
              {lang === 'hi' ? ' तथा ' : ' and '}
              <button
                type="button"
                onClick={() => onNavigate?.('/privacy-policy')}
                className="font-bold text-blue-800 underline hover:text-blue-950 cursor-pointer"
              >
                {lang === 'hi' ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}
              </button>
              {lang === 'hi' ? ' से सहमत होते हैं।' : '.'}
            </div>

            <button
              type="submit"
              disabled={loading || !otpVerified}
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                otpVerified
                  ? 'bg-blue-900 hover:bg-blue-800 text-white shadow-blue-900/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{t.createAccount}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('customer_login'); resetForm(); }}
                className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
              >
                {t.alreadyHaveAccount}
              </button>
            </div>

            {/* Bottom Back Button */}
            <div className="pt-2 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={() => { setMode('select'); resetForm(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-900" />
                <span>{lang === 'hi' ? '← मुख्य पृष्ठ पर वापस जाएं (Back to Home)' : '← Back to Home'}</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. CUSTOMER LOGIN */}
        {mode === 'customer_login' && (
          <form onSubmit={handleCustomerLogin} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-blue-950 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <span>{t.customerLogin}</span>
              </h3>
              <button
                type="button"
                onClick={() => { setMode('select'); resetForm(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-900 text-xs font-bold transition shadow-xs cursor-pointer"
                title={lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Home'}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? '← मुख्य पृष्ठ' : '← Home'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.mobileNumber} *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="7078376806"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t.password} *
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); resetForm(); }}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  {t.forgotPassword}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{t.loginBtn}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('customer_signin'); resetForm(); }}
                className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
              >
                {t.dontHaveAccount}
              </button>
            </div>

            {/* Legal Links on Login Screen */}
            <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => onNavigate?.('/privacy-policy')}
                className="text-blue-700 hover:text-blue-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Shield className="w-3 h-3 text-blue-600" />
                <span>{lang === 'hi' ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onNavigate?.('/terms')}
                className="text-blue-700 hover:text-blue-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3 h-3 text-amber-600" />
                <span>{lang === 'hi' ? 'नियम व शर्तें (Terms)' : 'Terms & Conditions'}</span>
              </button>
            </div>

            {/* Bottom Back Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => { setMode('select'); resetForm(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-900" />
                <span>{lang === 'hi' ? '← मुख्य पृष्ठ पर वापस जाएं (Back to Home)' : '← Back to Home'}</span>
              </button>
            </div>
          </form>
        )}

        {/* 4. OWNER SIGN IN (REGISTRATION & SETUP AS REQUESTED) */}
        {mode === 'owner_signin' && (
          <form onSubmit={handleOwnerRegister} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <h3 className="text-base sm:text-lg font-bold text-amber-950 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <span>{t.ownerSignIn}</span>
              </h3>
              <button
                type="button"
                onClick={() => { setMode('select'); resetForm(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition shadow-xs cursor-pointer"
                title={lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Home'}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? '← मुख्य पृष्ठ' : '← Home'}</span>
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              👑 {lang === 'hi'
                ? 'मालिक पंजीकरण: अपना नाम, मोबाइल नंबर व नया पासवर्ड दर्ज करके अपना मालिकाना खाता सुरक्षित बनाएं। इससे आपको संपूर्ण डेयरी प्रबंधन पर पूर्ण नियंत्रण प्राप्त होगा।'
                : 'Owner Sign In: Register your own name, mobile, and password for full dairy business control.'}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'मालिक का पूरा नाम (Owner Full Name)' : 'Owner Full Name'} *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder={lang === 'hi' ? 'उदा. अनीता देवी / आपका नाम' : 'e.g. Anita Devi / Your Name'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'मालिक का मोबाइल नंबर' : 'Owner Mobile Number'} *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={ownerMobile}
                onChange={(e) => setOwnerMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="7078376806"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'नया पासवर्ड बनाएं' : 'Create Password'} *
                </label>
                <input
                  type="password"
                  required
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'} *
                </label>
                <input
                  type="password"
                  required
                  value={ownerConfirmPassword}
                  onChange={(e) => setOwnerConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.twoFactorPin} (6-Digit PIN)
              </label>
              <input
                type="text"
                maxLength={6}
                value={ownerPin}
                onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 text-sm font-mono tracking-widest text-center font-bold bg-amber-50/40"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{lang === 'hi' ? 'मालिक खाता बनाएं व प्रवेश करें' : 'Create Owner Account & Enter'}</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setMode('owner_login'); resetForm(); }}
                className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
              >
                {lang === 'hi' ? 'पहले से मालिक खाता है? लॉगिन करें' : 'Already have owner account? Login'}
              </button>
            </div>

            {/* Bottom Back Button */}
            <div className="pt-2 border-t border-amber-200/60 flex justify-center">
              <button
                type="button"
                onClick={() => { setMode('select'); resetForm(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'hi' ? '← मुख्य पृष्ठ पर वापस जाएं (Back to Home)' : '← Back to Home'}</span>
              </button>
            </div>
          </form>
        )}

        {/* 5. OWNER LOGIN */}
        {mode === 'owner_login' && (
          <form onSubmit={handleOwnerLogin} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
              <h3 className="text-base sm:text-lg font-bold text-indigo-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>{t.ownerLogin}</span>
              </h3>
              <button
                type="button"
                onClick={() => { setMode('select'); resetForm(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition shadow-xs cursor-pointer"
                title={lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Home'}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? '← मुख्य पृष्ठ' : '← Home'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'मालिक का मोबाइल नंबर' : 'Owner Mobile Number'} *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="7078376806"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'मालिक पासवर्ड' : 'Owner Password'} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t.twoFactorPin} (वैकल्पिक / Optional)
                </label>
                <span className="text-[10px] text-slate-400">Default: 123456</span>
              </div>
              <input
                type="password"
                maxLength={6}
                value={ownerPin}
                onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 text-sm text-center font-mono font-bold tracking-widest bg-indigo-50/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{lang === 'hi' ? 'मालिक डैशबोर्ड में प्रवेश करें' : 'Enter Owner Dashboard'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('owner_signin'); resetForm(); }}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                + {lang === 'hi' ? 'नया मालिक खाता बनाएं / रीसेट करें (Owner Sign In)' : 'New Owner? Register here'}
              </button>
            </div>

            {/* Bottom Back Button & Legal Links for Owner Login */}
            <div className="pt-2 border-t border-indigo-100 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => { setMode('select'); resetForm(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-700" />
                <span>{lang === 'hi' ? '← मुख्य पृष्ठ पर वापस जाएं (Back to Home)' : '← Back to Home'}</span>
              </button>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate?.('/privacy-policy')}
                  className="text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Shield className="w-3 h-3" />
                  <span>Privacy Policy</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onNavigate?.('/terms')}
                  className="text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  <span>Terms</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 6. FORGOT PASSWORD */}
        {mode === 'forgot_password' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!mobile || !password) return;
              if (!otpVerified) {
                setError(lang === 'hi' ? 'कृपया पहले SMS OTP सत्यापित करें' : 'Please verify SMS OTP first');
                return;
              }
              setLoading(true);
              try {
                const res = await fetch('/api/auth/reset-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mobile, newPassword: password, firebaseVerified: true }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setSuccessNotice(data.message);
                setTimeout(() => setMode('customer_login'), 1500);
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Reset failed');
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-blue-950">{t.resetPassword}</h3>
              <button
                type="button"
                onClick={() => { setMode('customer_login'); resetForm(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-900 text-xs font-bold transition shadow-xs cursor-pointer"
                title={lang === 'hi' ? 'लॉगिन पर वापस जाएं' : 'Back to Login'}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? '← लॉगिन' : '← Login'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.mobileNumber}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="7078376806"
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
                <button
                  type="button"
                  disabled={otpLoading || otpVerified || otpCooldown > 0}
                  onClick={handleSendOtp}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                    otpVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-900 text-white hover:bg-blue-800'
                  }`}
                >
                  {otpLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {otpVerified ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'सत्यापित' : 'Verified'}</span>
                    </>
                  ) : otpCooldown > 0 ? (
                    <span>{otpCooldown}s</span>
                  ) : otpSent ? (
                    t.resendOtp
                  ) : (
                    t.sendOtp
                  )}
                </button>
              </div>
            </div>

            {otpSent && !otpVerified && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-blue-950">
                  {lang === 'hi' ? 'SMS में प्राप्त 6-अंकीय OTP कोड दर्ज करें:' : 'Enter 6-digit OTP code received via SMS:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="flex-1 px-3 py-2 rounded-xl border border-blue-300 text-base tracking-widest text-center font-mono font-bold bg-white text-blue-950 shadow-inner"
                  />
                  <button
                    type="button"
                    disabled={otpLoading || otp.trim().length !== 6}
                    onClick={handleVerifyOtp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {otpLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{t.verifyOtp}</span>
                  </button>
                </div>
              </div>
            )}

            {otpVerified && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.newPassword}</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{t.resetPassword}</span>
                </button>
              </div>
            )}

            {/* Bottom Back Button */}
            <div className="pt-2 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={() => { setMode('select'); resetForm(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-900" />
                <span>{lang === 'hi' ? '← मुख्य पृष्ठ पर वापस जाएं (Back to Home)' : '← Back to Home'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
