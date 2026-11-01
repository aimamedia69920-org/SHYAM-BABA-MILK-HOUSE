import React from 'react';
import { MessageCircle, Bot, Sparkles } from 'lucide-react';
import { Language } from '../../types/dairy';

interface Props {
  lang: Language;
  onOpenAIChat: () => void;
  onOpenAIMaker?: () => void;
  whatsappSupportUrl?: string;
}

export const FloatingSupport: React.FC<Props> = ({
  lang,
  onOpenAIChat,
  onOpenAIMaker,
  whatsappSupportUrl = 'https://wa.me/aimamedia69920',
}) => {
  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-2.5">
      {/* AI Maker Floating Trigger */}
      {onOpenAIMaker && (
        <button
          onClick={onOpenAIMaker}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-blue-950 text-xs sm:text-sm font-black shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all border border-amber-200 cursor-pointer group"
          title={lang === 'hi' ? 'AI मेकर स्टूडियो (पोस्टर, व्यंजन, प्रचार)' : 'AI Maker Studio'}
        >
          <Sparkles className="w-4 h-4 text-blue-950 fill-amber-200" />
          <span>{lang === 'hi' ? '✨ AI मेकर' : '✨ AI Maker'}</span>
        </button>
      )}

      {/* AI Assistant Floating Trigger */}
      <button
        onClick={onOpenAIChat}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white text-xs sm:text-sm font-bold shadow-xl shadow-blue-950/20 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-amber-400/40 cursor-pointer group"
        title={lang === 'hi' ? 'डेयरी AI से पूछें' : 'Ask Dairy AI Assistant'}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Bot className="w-4 h-4 text-amber-300" />
        <span className="hidden sm:inline">
          {lang === 'hi' ? 'AI सहायता' : 'AI Assistant'}
        </span>
      </button>

      {/* WhatsApp Official Support Floating Button */}
      <a
        href={whatsappSupportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs sm:text-sm font-bold shadow-xl shadow-emerald-600/30 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all border border-white/20 cursor-pointer"
        title="WhatsApp Support"
      >
        <MessageCircle className="w-4 h-4 fill-white" />
        <span className="hidden sm:inline">
          {lang === 'hi' ? 'WhatsApp सहायता' : 'WhatsApp Support'}
        </span>
      </a>
    </div>
  );
};

