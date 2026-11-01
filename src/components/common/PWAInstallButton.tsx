import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

interface Props {
  lang?: 'hi' | 'en';
}

export const PWAInstallButton: React.FC<Props> = ({ lang = 'hi' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const label = lang === 'hi' ? 'ऐप इंस्टॉल करें' : 'Install App';
  const iosLabel = lang === 'hi' ? 'iPhone पर इंस्टॉल करें' : 'Install on iOS';

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs md:text-sm font-semibold shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
      >
        <Download className="w-4 h-4" />
        <span>{label}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400 text-amber-700 hover:bg-amber-500/20 text-xs md:text-sm font-semibold transition-all cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-amber-600" />
          <span>{iosLabel}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-blue-100">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-blue-950">
                  {lang === 'hi' ? 'iPhone / iPad पर ऐप इंस्टॉल करें' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 text-xs md:text-sm text-gray-600 space-y-2">
                <p>
                  1. Safari ब्राउज़र में नीचे दिए गए <strong>शेयर (Share) बटन</strong> पर टैप करें।
                </p>
                <p>
                  2. नीचे स्क्रॉल करें और <strong>'होम स्क्रीन में जोड़ें' (Add to Home Screen)</strong> चुनें।
                </p>
                <p className="text-amber-700 font-medium pt-1">
                  ऐप आपके फ़ोन के होम स्क्रीन पर बिना ऐप स्टोर के तुरंत इंस्टॉल हो जाएगा!
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-blue-900 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition"
              >
                {lang === 'hi' ? 'समझ गया' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers that don't trigger prompt event yet
  return (
    <button
      onClick={() => alert(lang === 'hi' ? 'ऐप इंस्टॉल करने के लिए ब्राउज़र मेनू (⋮) में जाकर "Install App" या "Add to Home Screen" पर क्लिक करें।' : 'To install, click "Install app" or "Add to Home screen" in your browser menu.')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-300 text-amber-800 hover:bg-amber-500/20 text-xs font-medium transition cursor-pointer"
      title={lang === 'hi' ? 'होम स्क्रीन में जोड़ें' : 'Add to home screen'}
    >
      <Download className="w-3.5 h-3.5 text-amber-600" />
      <span>{label}</span>
    </button>
  );
};
