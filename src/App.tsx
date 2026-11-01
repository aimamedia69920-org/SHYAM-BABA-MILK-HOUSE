import React, { useState, useEffect } from 'react';
import { CustomerProfile, OwnerProfile, Language } from './types/dairy';
import { translations } from './i18n/translations';
import { BrandHeader } from './components/common/BrandHeader';
import { AuthSection } from './components/auth/AuthSection';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { AIChatModal } from './components/ai/AIChatModal';
import { AIMakerModal } from './components/ai/AIMakerModal';
import { FloatingSupport } from './components/common/FloatingSupport';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsAndConditions } from './components/legal/TermsAndConditions';
import { WifiOff, ArrowLeft, Home, Shield, FileText, ExternalLink } from 'lucide-react';

type UserSession =
  | { role: 'customer'; data: CustomerProfile }
  | { role: 'owner'; data: OwnerProfile }
  | null;

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('shyam_baba_lang') as Language) || 'hi';
  });

  const [session, setSession] = useState<UserSession>(() => {
    try {
      const stored = localStorage.getItem('shyam_baba_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Client-side SPA routing: '/' | '/privacy-policy' | '/terms'
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/privacy-policy' || p === '/terms') return p;
    }
    return '/';
  });

  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAIMakerOpen, setIsAIMakerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p === '/privacy-policy' || p === '/terms') {
        setCurrentPath(p);
      } else {
        setCurrentPath('/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('shyam_baba_lang', newLang);
  };

  const handleCustomerLoginSuccess = (customer: CustomerProfile) => {
    const newSession: UserSession = { role: 'customer', data: customer };
    setSession(newSession);
    localStorage.setItem('shyam_baba_session', JSON.stringify(newSession));
    if (customer.preferredLanguage) {
      handleLanguageChange(customer.preferredLanguage);
    }
    navigateTo('/');
  };

  const handleOwnerLoginSuccess = (owner: OwnerProfile) => {
    const newSession: UserSession = { role: 'owner', data: owner };
    setSession(newSession);
    localStorage.setItem('shyam_baba_session', JSON.stringify(newSession));
    navigateTo('/');
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('shyam_baba_session');
    navigateTo('/');
  };

  const handleOwnerProfileUpdated = (updatedOwner: OwnerProfile) => {
    if (session?.role === 'owner') {
      const newSession: UserSession = { role: 'owner', data: updatedOwner };
      setSession(newSession);
      localStorage.setItem('shyam_baba_session', JSON.stringify(newSession));
    }
  };

  const isPolicyOrTerms = currentPath === '/privacy-policy' || currentPath === '/terms';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-amber-100 selection:text-blue-900">
      {/* Offline Toast */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-600 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'आप ऑफ़लाइन हैं। सुरक्षित डेटा प्रदर्शित हो रहा है।' : 'You are offline. Showing cached dairy data.'}</span>
        </div>
      )}

      {/* Brand Header with universal Home / Back navigation */}
      <BrandHeader
        lang={lang}
        onLanguageChange={handleLanguageChange}
        currentUser={
          session
            ? {
                name: session.data.fullName,
                role: session.role,
              }
            : null
        }
        onLogout={session ? handleLogout : undefined}
        onGoHome={() => navigateTo('/')}
        showBackButton={isPolicyOrTerms}
        onOpenAIMaker={() => setIsAIMakerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPath === '/privacy-policy' ? (
          <PrivacyPolicy lang={lang} onBack={() => navigateTo('/')} />
        ) : currentPath === '/terms' ? (
          <TermsAndConditions lang={lang} onBack={() => navigateTo('/')} />
        ) : !session ? (
          <AuthSection
            lang={lang}
            onCustomerLoginSuccess={handleCustomerLoginSuccess}
            onOwnerLoginSuccess={handleOwnerLoginSuccess}
            onNavigate={navigateTo}
            onOpenAIChat={() => setIsAIChatOpen(true)}
          />
        ) : session.role === 'customer' ? (
          <CustomerDashboard
            customer={session.data}
            lang={lang}
            onOpenAIChat={() => setIsAIChatOpen(true)}
            onOpenAIMaker={() => setIsAIMakerOpen(true)}
          />
        ) : (
          <OwnerDashboard
            owner={session.data}
            lang={lang}
            onOpenAIChat={() => setIsAIChatOpen(true)}
            onOwnerProfileUpdated={handleOwnerProfileUpdated}
            onOpenAIMaker={() => setIsAIMakerOpen(true)}
          />
        )}
      </main>

      {/* Omnipresent Floating Back to Home Button (Accessible from anywhere) */}
      <button
        onClick={() => {
          if (currentPath !== '/') {
            navigateTo('/');
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className="fixed bottom-5 left-4 sm:left-6 z-40 bg-gradient-to-r from-blue-950 to-blue-900 hover:from-blue-900 hover:to-blue-800 text-white px-3.5 py-2.5 rounded-full shadow-2xl border border-amber-400/40 backdrop-blur-md flex items-center gap-2 text-xs font-bold transition hover:scale-105 active:scale-95 cursor-pointer group"
        title={lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Go Back to Home'}
      >
        <ArrowLeft className="w-4 h-4 text-amber-300 group-hover:-translate-x-1 transition-transform" />
        <Home className="w-3.5 h-3.5 text-blue-200" />
        <span>{lang === 'hi' ? 'मुख्य पृष्ठ (होम)' : 'Home'}</span>
      </button>

      {/* Floating Support (WhatsApp + AI Bot + AI Maker) */}
      <FloatingSupport
        lang={lang}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        onOpenAIMaker={() => setIsAIMakerOpen(true)}
        whatsappSupportUrl={
          session?.role === 'owner'
            ? session.data.whatsappSupportUrl
            : 'https://wa.me/aimamedia69920'
        }
      />

      {/* AI Chat Modal */}
      {isAIChatOpen && (
        <AIChatModal
          lang={lang}
          role={session?.role || 'customer'}
          customerId={session?.role === 'customer' ? session.data.id : undefined}
          onClose={() => setIsAIChatOpen(false)}
        />
      )}

      {/* AI Maker Modal Studio */}
      {isAIMakerOpen && (
        <AIMakerModal
          lang={lang}
          onClose={() => setIsAIMakerOpen(false)}
        />
      )}

      {/* Devotional & Trusted Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white/95 backdrop-blur-xs py-7 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-blue-900 font-bold">
            <span>🙏</span>
            <span>SHYAM BABA MILK HOUSE</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">शुद्ध दूध • शुद्धता का विश्वास</span>
            <span>🙏</span>
          </div>

          <p className="text-[11px] text-slate-500">
            {lang === 'hi'
              ? 'ताजा व शुद्ध दूध वितरण प्रबंधन प्रणाली • सकित (एटा), उत्तर प्रदेश - 207121'
              : 'Pure Dairy Milk Delivery Management System • Sakit (Etah), Uttar Pradesh - 207121'}
          </p>

          {/* Legal Navigation Links: Privacy Policy & Terms & Conditions */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-1 text-xs">
            <button
              onClick={() => navigateTo('/privacy-policy')}
              className="inline-flex items-center gap-1.5 text-blue-800 hover:text-blue-950 font-semibold hover:underline cursor-pointer transition"
            >
              <Shield className="w-3.5 h-3.5 text-blue-700" />
              <span>{lang === 'hi' ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => navigateTo('/terms')}
              className="inline-flex items-center gap-1.5 text-blue-800 hover:text-blue-950 font-semibold hover:underline cursor-pointer transition"
            >
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>{lang === 'hi' ? 'नियम व शर्तें (Terms & Conditions)' : 'Terms & Conditions'}</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => navigateTo('/')}
              className="inline-flex items-center gap-1.5 text-blue-800 hover:text-blue-950 font-semibold hover:underline cursor-pointer transition"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'hi' ? 'मुख्य पृष्ठ (Home)' : 'Home'}</span>
            </button>
          </div>

          {/* Official Hostnames & Official UPI Info */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] text-slate-400 border-t border-slate-100">
            <div className="flex items-center gap-1 font-medium">
              <span>Domain:</span>
              <a
                href="https://www.sbmh.org"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-blue-700 hover:underline inline-flex items-center gap-0.5"
              >
                www.SBMH.org / SBMH.org
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span>Official UPI:</span>
              <span className="font-mono font-semibold text-slate-700">7078376806@ptyes (Ankit Ankit)</span>
            </div>
            <span>•</span>
            <div className="text-slate-400">
              हेल्पलाइन: <span className="font-semibold text-slate-600">+91 7078376806</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
