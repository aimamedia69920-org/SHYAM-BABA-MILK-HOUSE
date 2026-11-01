import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { Language } from '../../types/dairy';
import { Globe, LogOut, ArrowLeft, Home, Sparkles } from 'lucide-react';

interface Props {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  currentUser?: { name: string; role: 'customer' | 'owner' } | null;
  onLogout?: () => void;
  showSloganBanner?: boolean;
  onGoHome?: () => void;
  showBackButton?: boolean;
  onOpenAIMaker?: () => void;
}

export const BrandHeader: React.FC<Props> = ({
  lang,
  onLanguageChange,
  currentUser,
  onLogout,
  showSloganBanner = true,
  onGoHome,
  showBackButton = false,
  onOpenAIMaker,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/60 shadow-xs">
      {/* Top Devotional Slogan Ribbon */}
      {showSloganBanner && (
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-amber-200 px-3 py-1.5 text-center text-xs md:text-sm font-semibold tracking-wide border-b border-amber-500/30 flex items-center justify-center gap-2">
          <span>🙏</span>
          <span className="font-bold text-amber-300">
            {lang === 'hi' ? 'श्याम बाबा मिल्क हाउस' : 'SHYAM BABA MILK HOUSE'}
          </span>
          <span className="hidden sm:inline text-blue-200">•</span>
          <span className="hidden sm:inline text-white/90">
            {lang === 'hi' ? 'शुद्ध दूध • शुद्धता का विश्वास' : 'PURE MILK • PURE TRUST'}
          </span>
          <span className="hidden md:inline text-amber-300">
            {lang === 'hi' ? 'ताजा दूध, भरोसेमंद सेवा' : 'Fresh Milk, Trusted Service'}
          </span>
          <span>🙏</span>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Logo & Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          {showBackButton && onGoHome && (
            <button
              onClick={onGoHome}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title={lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Home'}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
            </button>
          )}

          <div
            onClick={onGoHome}
            className={`flex items-center gap-3 ${onGoHome ? 'cursor-pointer select-none group' : ''}`}
            title={onGoHome ? (lang === 'hi' ? 'मुख्य पृष्ठ पर जाएं' : 'Go to Home') : undefined}
          >
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-md shadow-blue-900/10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                <img
                  src="/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg"
                  alt="Shyam Baba Milk House Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              {/* Small Milk drop badge */}
              <div className="absolute -bottom-1 -right-1 bg-blue-700 text-white p-1 rounded-full text-[10px] shadow-sm border border-white" title="Pure Milk">
                🥛
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-blue-950 flex items-center gap-1.5 font-['Plus_Jakarta_Sans'] group-hover:text-blue-800 transition-colors">
                  <span>{lang === 'hi' ? 'श्याम बाबा मिल्क हाउस' : 'SHYAM BABA MILK HOUSE'}</span>
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-amber-700 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{lang === 'hi' ? 'ताज़ा शुद्ध डेयरी • सकित (एटा)' : 'Pure Fresh Dairy • Sakit (Etah)'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Home Navigation Icon for Quick Access */}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-950 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title={lang === 'hi' ? 'मुख्य पृष्ठ (होम)' : 'Home'}
            >
              <Home className="w-4 h-4 text-blue-900" />
              <span className="hidden md:inline">{lang === 'hi' ? 'होम' : 'Home'}</span>
            </button>
          )}

          {/* AI Maker Button */}
          {onOpenAIMaker && (
            <button
              onClick={onOpenAIMaker}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-blue-950 font-black text-xs shadow-md shadow-amber-500/25 border border-amber-300 flex items-center gap-1.5 transition transform hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'hi' ? 'AI मेकर स्टूडियो खोलें (पोस्टर, व्यंजन, प्रचार)' : 'Open AI Maker Studio'}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-950 fill-amber-200 shrink-0" />
              <span className="tracking-tight">{lang === 'hi' ? '✨ AI मेकर' : '✨ AI Maker'}</span>
            </button>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton lang={lang} />

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200 text-xs font-medium">
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                lang === 'hi'
                  ? 'bg-blue-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिं
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                lang === 'en'
                  ? 'bg-blue-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
          </div>

          {/* User info & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-blue-700">
                  {currentUser.role === 'owner' ? (lang === 'hi' ? 'मालिक' : 'Owner') : (lang === 'hi' ? 'ग्राहक' : 'Customer')}
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title={lang === 'hi' ? 'लॉगआउट करें' : 'Logout'}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
