import React, { useState, useRef, useEffect } from 'react';
import { Language, UserRole } from '../../types/dairy';
import { translations } from '../../i18n/translations';
import { MessageSquare, Send, X, Bot, User, Sparkles, RefreshCw } from 'lucide-react';

interface Props {
  lang: Language;
  role: UserRole;
  customerId?: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AIChatModal: React.FC<Props> = ({
  lang,
  role,
  customerId,
  onClose,
}) => {
  const t = translations[lang];
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init_1',
      sender: 'ai',
      text:
        role === 'customer'
          ? (lang === 'hi'
              ? '🙏 जय श्री श्याम! मैं श्याम बाबा मिल्क हाउस का AI सहायक हूँ। आप अपने दैनिक दूध, चालू महीने के कुल लीटर, मासिक बिल या ऑनलाइन भुगतान के बारे में कुछ भी पूछ सकते हैं।'
              : '🙏 Jai Shree Shyam! I am the Shyam Baba Milk House AI Assistant. Ask me about your milk delivery today, monthly liters, bills or online payment.')
          : (lang === 'hi'
              ? '🙏 नमस्ते व्यवस्थापक जी! मैं आपका डेयरी AI सलाहकार हूँ। आप आज की कुल बिक्री, ग्राहकों का बकाया, रद्द डिलीवरी या संपूर्ण व्यापार रिपोर्ट के बारे में पूछ सकते हैं।'
              : '🙏 Greetings! I am your Dairy AI Business Assistant. Ask me about today\'s sales, customer pending dues, monthly milk sold, or overall business metrics.'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          role,
          customerId,
          language: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI response failed');

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        id: `ai_err_${Date.now()}`,
        sender: 'ai',
        text: lang === 'hi' ? 'क्षमा करें, रिकॉर्ड्स प्राप्त करने में असमर्थ। कृपया पुनः प्रयास करें।' : 'Sorry, unable to fetch real records right now.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sampleCustomerQuestions = [
    t.q1,
    t.q2,
    t.q3,
    t.q4,
  ];

  const sampleOwnerQuestions = [
    t.ownerQ1,
    t.ownerQ2,
    t.ownerQ3,
  ];

  const suggestions = role === 'customer' ? sampleCustomerQuestions : sampleOwnerQuestions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-amber-200/80 flex flex-col h-[600px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-amber-200">
              <img
                src="/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg"
                alt="AI Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-1.5">
                <span>{t.aiAssistantTitle}</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-[11px] text-blue-200">
                {role === 'customer' ? (lang === 'hi' ? 'ग्राहक सहायता • लाइव डेटा से जुड़ा' : 'Customer Support • Live DB Connected') : (lang === 'hi' ? 'मालिक व्यवसाय सलाहकार' : 'Owner Business Advisor')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs sm:text-sm">
          {messages.map((m) => {
            const isAI = m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className="w-7 h-7 rounded-full bg-blue-900 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                    isAI
                      ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs whitespace-pre-wrap'
                      : 'bg-blue-900 text-white rounded-tr-xs'
                  }`}
                >
                  <div className="leading-relaxed">{m.text}</div>
                  <div className={`text-[10px] mt-1 text-right ${isAI ? 'text-slate-400' : 'text-blue-200'}`}>
                    {m.timestamp}
                  </div>
                </div>
                {!isAI && (
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl w-fit border border-slate-200">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-700" />
              <span>{lang === 'hi' ? 'डेयरी डेटाबेस से जानकारी जांची जा रही है...' : 'Querying live dairy records...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 shrink-0 font-medium">{lang === 'hi' ? 'त्वरित प्रश्न:' : 'Quick:'}</span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 text-slate-700 shrink-0 transition cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={t.aiPlaceholder}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white transition disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
