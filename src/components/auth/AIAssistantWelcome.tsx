import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, MessageSquare, Bot } from 'lucide-react';
import { Language } from '../../types/dairy';

interface Props {
  lang: Language;
  onOpenAIChat?: () => void;
}

export const AIAssistantWelcome: React.FC<Props> = ({
  lang,
  onOpenAIChat,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const welcomeTextHi = `नमस्कार! शुद्ध दूध, शुद्धता का विश्वास। मैं श्याम बाबा मिल्क हाउस का एआई असिस्टेंट हूँ। मैं आपको दूध ऑर्डर करने, डिलीवरी देखने, बिल चेक करने और भुगतान में सहायता कर सकता हूँ।`;
  const welcomeTextEn = `Welcome to Shyam Baba Milk House. Pure milk, pure trust. I am the AI Assistant for Shyam Baba Milk House. I can help you order fresh dairy products, check daily milk deliveries, review monthly bills, and make payments.`;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setVoiceSupported(true);
    }
  }, []);

  const handleToggleVoice = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech

    const textToSpeak = lang === 'hi' ? welcomeTextHi : welcomeTextEn;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Pick a natural Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find((v) =>
      lang === 'hi' ? v.lang.startsWith('hi') : v.lang.startsWith('en')
    );
    if (targetVoice) utterance.voice = targetVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="relative rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-4 sm:p-5 shadow-xl border border-amber-400/40 overflow-hidden mb-5">
      {/* Background glow & sparkles */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Animated AI Mascot Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-blue-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
              <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
              {/* Subtle speaking pulse indicator */}
              {isSpeaking && (
                <div className="absolute inset-0 bg-blue-600/30 animate-pulse rounded-xl" />
              )}
            </div>
          </div>

          {/* Online badge */}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-blue-950 rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </span>
        </div>

        {/* Content text */}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Assistant</span>
            </span>
            <span className="text-blue-300 text-xs">•</span>
            <span className="text-xs font-semibold text-blue-200">24/7 सहायता</span>
          </div>

          <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
            "Welcome to SHYAM BABA MILK HOUSE"
          </h4>

          <div className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed space-y-1 pt-0.5">
            <p className="font-bold text-amber-200">
              🙏 नमस्कार! शुद्ध दूध • शुद्धता का विश्वास।
            </p>
            <p className="text-[11px] sm:text-xs text-blue-100">
              मैं <strong>SHYAM BABA MILK HOUSE</strong> का AI Assistant हूँ। मैं आपको दूध ऑर्डर करने, डिलीवरी देखने, बिल चेक करने और भुगतान में सहायता कर सकता हूँ।
            </p>
          </div>

          {/* Action buttons: Voice Speaker button & Chat button */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
            {voiceSupported && (
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isSpeaking
                    ? 'bg-amber-400 text-blue-950 animate-pulse'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
                title={isSpeaking ? 'आवाज बंद करें (Stop)' : 'AI का स्वागत संदेश सुनें (Listen in Voice)'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4 text-blue-950" />
                    <span>बोलना बंद करें (Stop)</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-300" />
                    <span>🔊 सुनें (Listen Voice)</span>
                  </>
                )}
              </button>
            )}

            {onOpenAIChat && (
              <button
                type="button"
                onClick={onOpenAIChat}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-blue-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-950" />
                <span>AI से बात करें (Chat with AI)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
