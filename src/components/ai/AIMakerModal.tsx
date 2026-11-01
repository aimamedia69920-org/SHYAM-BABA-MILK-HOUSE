import React, { useState, useRef } from 'react';
import {
  Sparkles,
  X,
  Download,
  Share2,
  Copy,
  Check,
  ChefHat,
  MessageSquare,
  Calculator,
  Image as ImageIcon,
  Flame,
  Award,
  Phone,
  QrCode,
  Send,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../../types/dairy';
import html2canvasPro from 'html2canvas-pro';

interface Props {
  lang: Language;
  onClose: () => void;
}

type MakerTab = 'poster' | 'recipe' | 'marketing' | 'calculator';

interface PosterTemplate {
  id: string;
  badge: string;
  badgeHi: string;
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  highlight: string;
  highlightHi: string;
  themeColor: string;
  imageUrl: string;
}

const posterTemplates: PosterTemplate[] = [
  {
    id: 'shyam_utsav',
    badge: 'Festival Special',
    badgeHi: 'त्योहार विशेष • बाबा श्याम कृपा',
    title: 'बाबा श्याम जन्मोत्सव एवं विशेष दूध प्रसाद',
    titleHi: 'बाबा श्याम जन्मोत्सव एवं विशेष दूध प्रसाद',
    subtitle: 'शुद्ध देसी गाय के दूध एवं बिलौना घी से बने भोग व प्रसाद हेतु अग्रिम बुकिंग प्रारंभ',
    subtitleHi: 'शुद्ध देसी गाय के दूध एवं बिलौना घी से बने भोग व प्रसाद हेतु अग्रिम बुकिंग प्रारंभ',
    highlight: 'हारे का सहारा, बाबा श्याम हमारा | 100% शुद्धता की गारंटी',
    highlightHi: 'हारे का सहारा, बाबा श्याम हमारा | 100% शुद्धता की गारंटी',
    themeColor: 'from-amber-600 via-amber-700 to-blue-950',
    imageUrl: '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg',
  },
  {
    id: 'cow_milk',
    badge: 'A2 Gir Cow Milk',
    badgeHi: 'देसी गिर गाय का ताजा दूध (A2)',
    title: 'शुद्ध देसी गिर गाय का कच्चा दूध',
    titleHi: 'शुद्ध देसी गिर गाय का कच्चा दूध',
    subtitle: 'प्रतिदिन सुबह 6:00 बजे आपके घर तक फार्म-ताजा, बिना किसी मिलावट का अमृतमय दूध',
    subtitleHi: 'प्रतिदिन सुबह 6:00 बजे आपके घर तक फार्म-ताजा, बिना किसी मिलावट का अमृतमय दूध',
    highlight: '₹40 / लीटर • नियमित होम डिलीवरी उपलब्ध (सकित व निकटवर्ती क्षेत्र)',
    highlightHi: '₹40 / लीटर • नियमित होम डिलीवरी उपलब्ध (सकित व निकटवर्ती क्षेत्र)',
    themeColor: 'from-blue-900 via-blue-800 to-indigo-950',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'bilona_ghee',
    badge: 'Traditional Bilona',
    badgeHi: 'पारंपरिक हाथ से मथा बिलौना घी',
    title: 'शुद्ध देसी दानेदार बिलौना घी',
    titleHi: 'शुद्ध देसी दानेदार बिलौना घी',
    subtitle: 'मिट्टी के बर्तन में मलाई मथकर तैयार किया गया सुगंधित व पोषक तत्वों से भरपूर घी',
    subtitleHi: 'मिट्टी के बर्तन में मलाई मथकर तैयार किया गया सुगंधित व पोषक तत्वों से भरपूर घी',
    highlight: '100% शुद्धता की गारंटी • पूजा व परिवार के स्वास्थ्य के लिए सर्वोत्तम',
    highlightHi: '100% शुद्धता की गारंटी • पूजा व परिवार के स्वास्थ्य के लिए सर्वोत्तम',
    themeColor: 'from-amber-700 via-yellow-700 to-blue-950',
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'malai_paneer',
    badge: 'Fresh Paneer',
    badgeHi: 'सॉफ्ट मलाई पनीर',
    title: 'शादी, पार्टी व त्योहारों हेतु ताजा पनीर',
    titleHi: 'शादी, पार्टी व त्योहारों हेतु ताजा पनीर',
    subtitle: 'मुंह में घुल जाने वाला स्पंजी ताजा मलाई पनीर, बिना किसी स्टार्च या रासायनिक मिलावट के',
    subtitleHi: 'मुंह में घुल जाने वाला स्पंजी ताजा मलाई पनीर, बिना किसी स्टार्च या रासायनिक मिलावट के',
    highlight: 'थोक व खुदरा ऑर्डर हेतु तुरंत संपर्क करें • होम डिलीवरी उपलब्ध',
    highlightHi: 'थोक व खुदरा ऑर्डर हेतु तुरंत संपर्क करें • होम डिलीवरी उपलब्ध',
    themeColor: 'from-emerald-900 via-teal-900 to-blue-950',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'morning_delivery',
    badge: 'Daily Trust',
    badgeHi: 'शुद्धता का विश्वास',
    title: 'सुप्रभातम्! रोज़ सुबह शुद्ध दूध आपके द्वार',
    titleHi: 'सुप्रभातम्! रोज़ सुबह शुद्ध दूध आपके द्वार',
    subtitle: 'श्याम बाबा मिल्क हाउस की विश्वसनीय सेवा • हर बूंद में सेहत और स्वाद का वादा',
    subtitleHi: 'श्याम बाबा मिल्क हाउस की विश्वसनीय सेवा • हर बूंद में सेहत और स्वाद का वादा',
    highlight: 'सकित (एटा) पिन कोड 207121 • ऑनलाइन UPI भुगतान व मासिक बिल सुविधा',
    highlightHi: 'सकित (एटा) पिन कोड 207121 • ऑनलाइन UPI भुगतान व मासिक बिल सुविधा',
    themeColor: 'from-blue-950 via-slate-900 to-blue-900',
    imageUrl: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=800&auto=format&fit=crop&q=80',
  },
];

interface Recipe {
  id: string;
  name: string;
  nameHi: string;
  prepTime: string;
  milkRequired: string;
  difficulty: string;
  nutrition: string;
  ingredients: string[];
  steps: string[];
  chefTip: string;
}

const dairyRecipes: Recipe[] = [
  {
    id: 'rabdi',
    name: 'Halwai Style Creamy Malai Rabdi',
    nameHi: 'हलवाई जैसी मखमली लच्छेदार रबड़ी',
    prepTime: '45 मिनट (Mins)',
    milkRequired: '2 लीटर शुद्ध भैंस/फुल क्रीम दूध',
    difficulty: 'मध्यम (Medium)',
    nutrition: 'प्रोटीन, कैल्शियम और ऊर्जा से भरपूर',
    ingredients: [
      '2 लीटर श्याम बाबा फुल क्रीम ताजा दूध',
      '4-5 बड़े चम्मच चीनी (स्वादानुसार)',
      '1/2 चम्मच इलायची पाउडर',
      '10-12 भीगे कटे बादाम व पिस्ता',
      'कुछ रेशे शुद्ध केसर (दूध में भीगे)',
    ],
    steps: [
      'एक चौड़ी व भारी तले की कड़ाही में दूध को तेज आंच पर उबालें।',
      'उबाल आने के बाद आंच धीमी कर दें और दूध की सतह पर बनने वाली मलाई की परत को कड़ाही के किनारों पर चिपकाते जाएं।',
      'दूध को 1/3 रह जाने तक लगातार धीमी आंच पर गाढ़ा होने दें।',
      'अब इसमें चीनी, इलायची पाउडर और केसर वाला दूध डालकर 5 मिनट और पकाएं।',
      'कड़ाही के किनारों से जमी हुई मलाई के लच्छों को खुरचकर गाढ़े दूध में मिला लें।',
      'ऊपर से कटे बादाम व पिस्ता डालकर ठंडा होने दें। मटके या कुल्हड़ में परोसें।',
    ],
    chefTip: 'श्याम बाबा का फुल क्रीम दूध इस्तेमाल करें ताकि लच्छे गाढ़े और प्राकृतिक रूप से मीठे बनें।',
  },
  {
    id: 'bilona_ghee_recipe',
    name: 'Traditional Vedic Bilona Desi Ghee',
    nameHi: 'पारंपरिक वैदिक बिलौना देसी घी',
    prepTime: '30 मिनट (Mins)',
    milkRequired: 'ताजा मलाई / मक्खन',
    difficulty: 'सरल (Easy)',
    nutrition: 'ओमेगा-3, विटामिन A, D, E व रोग प्रतिरोधक क्षमता',
    ingredients: [
      '7-8 दिन की ताजी दूध की मलाई (दही का जामन देकर जमाई गई)',
      'ठंडा पानी व बर्फ के टुकड़े (मक्खन अलग करने हेतु)',
      'कड़ाही व मथानी (हैंड ब्लेंडर या पारंपरिक रई)',
    ],
    steps: [
      'जमी हुई खट्टी मलाई को एक बड़े बर्तन में डालकर मथानी से 5-7 मिनट तक मथें।',
      'मथते समय थोड़ा ठंडा पानी या बर्फ डालें। मक्खन (सफेद माखन) ऊपर तैरने लगेगा और मट्ठा (छाछ) अलग हो जाएगा।',
      'मक्खन को हल्के हाथों से निकालकर ठंडे पानी से 2 बार धो लें ताकि छाछ का अंश निकल जाए।',
      'अब इस मक्खन को धीमी आंच पर कड़ाही में गर्म करें।',
      'हल्के सुनहरे बुलबुले बनने तक पकाएं। जब घी पारदर्शी होकर सुनहरे रंग का हो जाए और भीनी सुगंध आने लगे, तो गैस बंद कर दें।',
      'छानकर कांच के सूखे जार में रखें। ठंडा होने पर दानेदार घी तैयार होगा।',
    ],
    chefTip: 'घी को हमेशा धीमी आंच पर पकाएं ताकि उसके प्राकृतिक औषधीय गुण और सुगंध सुरक्षित रहें।',
  },
  {
    id: 'malai_paneer_recipe',
    name: 'Soft Restaurant-Style Malai Paneer',
    nameHi: 'शादियों जैसा सॉफ्ट मलाई पनीर',
    prepTime: '25 मिनट (Mins)',
    milkRequired: '1.5 लीटर ताजा गाय या भैंस का दूध',
    difficulty: 'सरल (Easy)',
    nutrition: 'हाई प्रोटीन (25g प्रति 100g) और मजबूत हड्डियों के लिए कैल्शियम',
    ingredients: [
      '1.5 लीटर श्याम बाबा ताजा दूध',
      '2 बड़े चम्मच नींबू का रस या सिरका (2 चम्मच पानी में मिला हुआ)',
      'मलमल या सूती कपड़ा और भारी वजन',
    ],
    steps: [
      'दूध को एक गहरे बर्तन में अच्छी तरह उबाल लें।',
      'उबाल आने के बाद गैस बंद करें और 2 मिनट रुकें ताकि तापमान थोड़ा कम हो (85°C)।',
      'धीरे-धीरे नींबू रस या सिरके का पानी डालते हुए चम्मच से हल्के हाथ से हिलाएं।',
      'हरा पानी (whey) और छेना अलग होते ही तुरंत छान लें।',
      'छेना को 2 बार ताजे ठंडे पानी से धोएं ताकि नींबू का खट्टापन निकल जाए।',
      'कपड़े की पोटली बनाकर 20-30 मिनट तक हल्का वजन रखें। सॉफ्ट पनीर तैयार है।',
    ],
    chefTip: 'पनीर को 15 मिनट ठंडे पानी के बाउल में डुबोकर रखें, यह बेहद स्पंजी और बाजार से कहीं ज्यादा सॉफ्ट रहेगा।',
  },
  {
    id: 'matka_kulfi',
    name: 'Authentic Earthen Pot Matka Kulfi',
    nameHi: 'पारंपरिक मिट्टी के मटके वाली मलाई कुल्फी',
    prepTime: '40 मिनट + 6 घंटे जमने का समय',
    milkRequired: '1 लीटर फुल क्रीम दूध',
    difficulty: 'मध्यम (Medium)',
    nutrition: 'कैल्शियम, प्राकृतिक वसा और ताजगी',
    ingredients: [
      '1 लीटर श्याम बाबा गाढ़ा दूध',
      '4 बड़े चम्मच चीनी या देसी खांड',
      '1/4 चम्मच इलायची पाउडर',
      'केसर के रेशे और बारीक कटे मेवे',
    ],
    steps: [
      'दूध को धीमी आंच पर तब तक पकाएं जब तक वह आधा न रह जाए।',
      'चीनी, इलायची और केसर डालकर 5 मिनट और पकाएं।',
      'मिश्रण को पूरी तरह ठंडा करें और मिट्टी के कुल्हड़ या कुल्फी मोल्ड में भरें।',
      'ऊपर से फॉयल पेपर लगाकर फ्रीजर में 6 घंटे जमने दें।',
    ],
    chefTip: 'मिट्टी के बर्तन में जमाने से कुल्फी में अनोखी सौंधी खुशबू आती है।',
  },
];

interface MarketingTemplate {
  id: string;
  category: string;
  title: string;
  text: string;
}

const marketingTemplates: MarketingTemplate[] = [
  {
    id: 'm1',
    category: 'त्योहार विशेष (Festival Special)',
    title: 'बाबा श्याम जन्मोत्सव एवं पर्वों पर दूध व घी की अग्रिम बुकिंग',
    text: `🙏 जय श्री श्याम! हारे का सहारा बाबा श्याम हमारा 🙏\n\nप्रिय ग्राहक,\nश्याम बाबा मिल्क हाउस की ओर से आपको आगामी पर्व की हार्दिक शुभकामनाएं!\n\nत्योहारों पर पूजा, खीर, मावे और भोग के लिए हमारे पास 100% शुद्ध देसी गाय का कच्चा दूध, ताजा मलाई पनीर और पारंपरिक दानेदार बिलौना घी उपलब्ध है।\n\n📌 किसी भी मिलावट से मुक्त, पूरी तरह शुद्ध एवं प्राकृतिक।\n📍 डिलीवरी क्षेत्र: सकित (एटा) एवं निकटवर्ती क्षेत्र\n📞 बुकिंग एवं संपर्क: 7078376806\n\n— श्याम बाबा मिल्क हाउस (शुद्ध दूध • शुद्धता का विश्वास)`,
  },
  {
    id: 'm2',
    category: 'मासिक बिल रिमाइंडर (Bill Reminder)',
    title: 'मासिक दूध बिल एवं ऑनलाइन QR कोड भुगतान सूचना',
    text: `🙏 नमस्कार!\n\nश्याम बाबा मिल्क हाउस की ओर से आपके पिछले माह के दूध का सही हिसाब तैयार कर दिया गया है।\n\nआप अपने मोबाइल ऐप में जाकर 'मेरे दूध के बिल' सेक्शन में पूरा ब्योरा, कुल प्राप्त लीटर और अंतिम शेष राशि देख सकते हैं।\n\n💳 कृपया अपना बकाया भुगतान आधिकारिक UPI पर कर सकते हैं:\nUPI ID: 7078376806@ptyes\n(पेयी नाम: SHYAM BABA MILK HOUSE)\n\nभुगतान के पश्चात स्क्रीनशॉट ऐप या WhatsApp पर साझा करें। आपके सहयोग के लिए बहुत-बहुत धन्यवाद! 🙏`,
  },
  {
    id: 'm3',
    category: 'ताजा आपूर्ति (Fresh Supply Announcement)',
    title: 'आज सुबह का ताजा A2 गाय व भैंस का दूध उपलब्ध',
    text: `🥛 सुप्रभातम्! जय श्री श्याम 🙏\n\nआज सुबह का फार्म-ताजा कच्चा दूध उपलब्ध है:\n🐄 देसी गाय का दूध (A2): ₹40 / लीटर\n🐃 शुद्ध भैंस का गाढ़ा दूध: ₹65 / लीटर\n🧀 ताजा सॉफ्ट मलाई पनीर: ₹110 / 250 ग्राम\n\nपूरी स्वच्छता और शुद्धता के साथ पैक किया गया।\nसुबह 6:00 बजे से 8:00 बजे तक आपके दरवाजे पर होम डिलीवरी।\n\n📞 संपर्क करें: 7078376806\n— श्याम बाबा मिल्क हाउस, सकित (एटा)`,
  },
  {
    id: 'm4',
    category: 'गुणवत्ता व स्वास्थ्य (Purity Promise)',
    title: 'अपने परिवार को पिलाएं सिर्फ 100% शुद्ध व मिलावट-मुक्त दूध',
    text: `🙏 स्वास्थ्य ही सबसे बड़ा धन है! 🙏\n\nकेमिकल और पाउडर वाले पैकेज्ड दूध से बचें। अपने परिवार और बच्चों के स्वस्थ विकास के लिए चुनें "श्याम बाबा मिल्क हाउस" का प्राकृतिक कच्चा दूध।\n\n✅ शून्य मिलावट • कोई प्रिजर्वेटिव नहीं\n✅ उच्च प्रोटीन, प्राकृतिक वसा और कैल्शियम\n✅ प्रतिदिन सुबह ताजा वितरण\n\nआज ही अपने घर का दैनिक दूध शुरू करने हेतु कॉल करें: +91 7078376806\n— शुद्ध दूध • शुद्धता का विश्वास`,
  },
];

export const AIMakerModal: React.FC<Props> = ({ lang, onClose }) => {
  const [activeTab, setActiveTab] = useState<MakerTab>('poster');
  const [selectedPoster, setSelectedPoster] = useState<PosterTemplate>(posterTemplates[0]);
  const [customHeadline, setCustomHeadline] = useState(posterTemplates[0].titleHi);
  const [customSubtitle, setCustomSubtitle] = useState(posterTemplates[0].subtitleHi);
  const [customOffer, setCustomOffer] = useState(posterTemplates[0].highlightHi);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(dairyRecipes[0]);
  const [selectedMarketing, setSelectedMarketing] = useState<MarketingTemplate>(marketingTemplates[0]);

  // Calculator State
  const [calcMilkType, setCalcMilkType] = useState<'cow' | 'buffalo'>('cow');
  const [calcFat, setCalcFat] = useState<number>(4.2);
  const [calcSnf, setCalcSnf] = useState<number>(8.5);
  const [calcLiters, setCalcLiters] = useState<number>(10);

  // AI Prompt Maker State
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedText, setAiGeneratedText] = useState<string | null>(null);

  // Copy / Download States
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  // Calculate estimated price based on Fat & SNF
  // Standard Indian Dairy Formula: Base Rate + (Fat Diff * Rate) + (SNF Diff * Rate)
  const calculateRate = () => {
    if (calcMilkType === 'cow') {
      // Standard cow: 4.0 Fat, 8.5 SNF => Base Rs. 40
      const fatDiff = calcFat - 4.0;
      const snfDiff = calcSnf - 8.5;
      const rate = 40 + fatDiff * 4.5 + snfDiff * 2.5;
      return Math.max(30, Math.round(rate * 10) / 10);
    } else {
      // Standard buffalo: 6.5 Fat, 9.0 SNF => Base Rs. 65
      const fatDiff = calcFat - 6.5;
      const snfDiff = calcSnf - 9.0;
      const rate = 65 + fatDiff * 6.0 + snfDiff * 3.0;
      return Math.max(50, Math.round(rate * 10) / 10);
    }
  };

  const currentRate = calculateRate();
  const totalCalcAmount = Math.round(currentRate * calcLiters);

  // Handle Download Poster
  const handleDownloadPoster = async () => {
    if (!posterRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvasPro(posterRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#030d24',
      });
      const link = document.createElement('a');
      link.download = `ShyamBaba_Dairy_Poster_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating poster image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle WhatsApp Share for Poster
  const handleSharePoster = () => {
    const text = `🙏 जय श्री श्याम! 🙏\n*${customHeadline}*\n\n${customSubtitle}\n\n✨ *विशेष:* ${customOffer}\n\n🥛 *SHYAM BABA MILK HOUSE*\nमालिक: अंकित कुमार • 📱 7078376806\nसकित (एटा) पिन 207121\nUPI ID: 7078376806@ptyes`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Handle Copy Marketing text
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Handle WhatsApp Share for Marketing Message
  const handleShareMarketing = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Handle Custom AI Prompt Generation
  const handleGenerateCustomAI = async () => {
    if (!customAiPrompt.trim() || isAiGenerating) return;
    setIsAiGenerating(true);
    setAiGeneratedText(null);

    try {
      const res = await fetch('/api/ai/maker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          prompt: customAiPrompt,
          language: lang,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setAiGeneratedText(data.result);
      } else {
        // Fallback generator
        setAiGeneratedText(
          `🙏 जय श्री श्याम! श्याम बाबा मिल्क हाउस विशेष प्रचार संदेश:\n\n✨ ${customAiPrompt}\n\nताजा व शुद्ध दूध, मलाई पनीर और बिलौना घी के लिए आज ही ऑर्डर करें।\n📞 संपर्क: 7078376806 (अंकित कुमार) • सकित (एटा)\nशुद्ध दूध • शुद्धता का विश्वास 🙏`
        );
      }
    } catch {
      setAiGeneratedText(
        `🙏 जय श्री श्याम! श्याम बाबा मिल्क हाउस विशेष संदेश:\n\n${customAiPrompt}\n\nताजा व शुद्ध दूध, मलाई पनीर और बिलौना घी के लिए संपर्क करें:\n📱 7078376806 • शुद्ध दूध, शुद्धता का विश्वास!`
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-amber-300/40 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg"
                alt="Logo"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-extrabold text-base sm:text-xl tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
                  <span>SHYAM BABA AI MAKER STUDIO</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-300/30">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-xs text-blue-200">
                {lang === 'hi'
                  ? 'शुद्ध दूध • शुद्धता का विश्वास | AI पावर्ड डेयरी पोस्टर, व्यंजन व प्रचार मेकर'
                  : 'Pure Milk • Pure Trust | AI Powered Dairy Poster, Recipe & Marketing Studio'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-3 sm:px-6 overflow-x-auto text-xs sm:text-sm font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('poster')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'poster'
                ? 'border-blue-900 text-blue-950 bg-white font-extrabold shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-amber-600" />
            <span>{lang === 'hi' ? '🎨 AI पोस्टर व बैनर' : '🎨 Poster Maker'}</span>
          </button>

          <button
            onClick={() => setActiveTab('recipe')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'recipe'
                ? 'border-blue-900 text-blue-950 bg-white font-extrabold shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ChefHat className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'hi' ? '🍲 डेयरी व्यंजन व रेसिपी' : '🍲 Dairy Recipes'}</span>
          </button>

          <button
            onClick={() => setActiveTab('marketing')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'marketing'
                ? 'border-blue-900 text-blue-950 bg-white font-extrabold shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>{lang === 'hi' ? '📢 व्हाट्सएप प्रचार मेकर' : '📢 WhatsApp Messages'}</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'calculator'
                ? 'border-blue-900 text-blue-950 bg-white font-extrabold shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4 text-indigo-600" />
            <span>{lang === 'hi' ? '⚖️ फैट व दर कैलकुलेटर' : '⚖️ Fat & Rate Calc'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: POSTER MAKER */}
          {activeTab === 'poster' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Controls Column */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {lang === 'hi' ? '1. पोस्टर टेम्पलेट चुनें' : '1. Select Poster Template'}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {posterTemplates.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPoster(p);
                          setCustomHeadline(p.titleHi);
                          setCustomSubtitle(p.subtitleHi);
                          setCustomOffer(p.highlightHi);
                        }}
                        className={`text-left p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                          selectedPoster.id === p.id
                            ? 'border-blue-900 bg-blue-50/70 shadow-sm ring-1 ring-blue-900'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            {lang === 'hi' ? p.badgeHi : p.badge}
                          </span>
                          <div className="font-bold text-xs text-slate-900 truncate mt-1">
                            {lang === 'hi' ? p.titleHi : p.title}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {lang === 'hi' ? 'पोस्टर मुख्य शीर्षक (Headline)' : 'Poster Headline'}
                    </label>
                    <input
                      type="text"
                      value={customHeadline}
                      onChange={(e) => setCustomHeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {lang === 'hi' ? 'उप-शीर्षक / विवरण (Subtitle)' : 'Subtitle / Details'}
                    </label>
                    <textarea
                      rows={2}
                      value={customSubtitle}
                      onChange={(e) => setCustomSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {lang === 'hi' ? 'ऑफर / मुख्य आकर्षण (Highlight)' : 'Offer / Key Highlight'}
                    </label>
                    <input
                      type="text"
                      value={customOffer}
                      onChange={(e) => setCustomOffer(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs focus:ring-2 focus:ring-blue-900 outline-none text-amber-800"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleDownloadPoster}
                    disabled={isDownloading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-900 to-blue-950 text-white rounded-xl font-bold text-xs hover:from-blue-800 hover:to-blue-900 transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 text-amber-300" />
                    )}
                    <span>{lang === 'hi' ? 'पोस्टर डाउनलोड करें (PNG)' : 'Download Poster (PNG)'}</span>
                  </button>

                  <button
                    onClick={handleSharePoster}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'WhatsApp शेयर' : 'Share'}</span>
                  </button>
                </div>
              </div>

              {/* Live Poster Preview Column */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{lang === 'hi' ? 'लाइव पोस्टर प्रीव्यू (HD 1080p)' : 'Live Poster Preview'}</span>
                </div>

                <div
                  ref={posterRef}
                  className="w-full max-w-[420px] rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400/60 bg-gradient-to-b from-[#03153b] via-[#07245b] to-[#010c24] text-white relative flex flex-col select-none"
                  style={{ minHeight: '580px' }}
                >
                  {/* Devotional Top Header */}
                  <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 py-1.5 px-3 text-center text-[11px] font-black text-blue-950 uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm">
                    <span>🙏</span>
                    <span>हारे का सहारा, बाबा श्याम हमारा</span>
                    <span>🙏</span>
                  </div>

                  {/* Brand Ribbon with Logo & Malik */}
                  <div className="p-4 flex items-center gap-3 border-b border-amber-400/20 bg-blue-950/60">
                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src="/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg"
                        alt="Logo"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-amber-300 leading-tight tracking-wide">
                        SHYAM BABA MILK HOUSE
                      </h2>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <span>मालिक: अंकित कुमार</span>
                        <span className="text-amber-400">•</span>
                        <span className="text-amber-300 flex items-center gap-0.5">
                          <Phone className="w-3 h-3 inline" /> 7078376806
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-200/90 font-medium">
                        शुद्ध दूध • शुद्धता का विश्वास • सकित (एटा)
                      </div>
                    </div>
                  </div>

                  {/* Poster Hero Visual */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                    <img
                      src={selectedPoster.imageUrl}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07245b] via-transparent to-transparent opacity-90" />
                    <div className="absolute top-3 left-3 bg-amber-400 text-blue-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                      {selectedPoster.badgeHi}
                    </div>
                  </div>

                  {/* Poster Content Area */}
                  <div className="p-4 flex-1 flex flex-col justify-between text-center space-y-3">
                    <div>
                      <h3 className="text-xl font-black text-amber-300 leading-snug drop-shadow-md">
                        {customHeadline}
                      </h3>
                      <p className="text-xs text-blue-100 font-medium mt-1 leading-relaxed">
                        {customSubtitle}
                      </p>
                    </div>

                    {/* Highlight Box */}
                    <div className="p-2.5 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-200 font-bold text-xs shadow-inner">
                      ✨ {customOffer} ✨
                    </div>

                    {/* Footer Info & Official UPI QR */}
                    <div className="pt-2 border-t border-amber-400/20 flex items-center justify-between text-left text-[10px] text-blue-200">
                      <div>
                        <div className="font-bold text-white">स्थान: मोहल्ला साहेदपुरा, छपरई रोड</div>
                        <div>सकित (एटा) पिन कोड: 207121</div>
                        <div className="text-amber-300 font-mono font-bold mt-0.5">
                          UPI: 7078376806@ptyes
                        </div>
                      </div>

                      <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center shadow-md">
                        <img
                          src="/assets/aistudio/SHYAM_BABA_MILK_HOUSE__PAYMENT_QR_CODE_AI_47e8cd69.png"
                          alt="QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DAIRY RECIPES */}
          {activeTab === 'recipe' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Recipe Selector */}
              <div className="lg:col-span-4 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {lang === 'hi' ? 'पारंपरिक डेयरी व्यंजन चुनें' : 'Select Dairy Recipe'}
                </label>
                {dairyRecipes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRecipe(r)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                      selectedRecipe.id === r.id
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                      🍲
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{r.nameHi}</div>
                      <div className="text-[11px] text-slate-500 font-medium truncate">{r.name}</div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                        <span>⏱️ {r.prepTime}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Recipe Detail Card */}
              <div className="lg:col-span-8 bg-slate-50/80 rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      {selectedRecipe.difficulty}
                    </span>
                    <h3 className="text-xl font-extrabold text-blue-950 mt-1">
                      {selectedRecipe.nameHi}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedRecipe.name}</p>
                  </div>

                  <button
                    onClick={() => {
                      const text = `🍲 *${selectedRecipe.nameHi} (${selectedRecipe.name})*\n\n⏱️ समय: ${selectedRecipe.prepTime}\n🥛 आवश्यक दूध: ${selectedRecipe.milkRequired}\n\n*सामग्री:*\n${selectedRecipe.ingredients.map(i => `• ${i}`).join('\n')}\n\n*बनाने की विधि:*\n${selectedRecipe.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}\n\n✨ *शेफ टिप:* ${selectedRecipe.chefTip}\n\n— श्याम बाबा मिल्क हाउस (शुद्ध दूध • शुद्धता का विश्वास)`;
                      handleCopyText(text);
                    }}
                    className="self-start sm:self-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'कॉपी हो गया!' : 'रेसिपी कॉपी करें'}</span>
                  </button>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200">
                    <span className="text-slate-400 font-semibold block text-[10px]">आवश्यक दूध</span>
                    <span className="font-bold text-blue-950">{selectedRecipe.milkRequired}</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-slate-200">
                    <span className="text-slate-400 font-semibold block text-[10px]">तैयारी समय</span>
                    <span className="font-bold text-slate-800">{selectedRecipe.prepTime}</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 font-semibold block text-[10px]">पोषण गुण</span>
                    <span className="font-bold text-emerald-700">{selectedRecipe.nutrition}</span>
                  </div>
                </div>

                {/* Ingredients List */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🛒</span>
                    <span>आवश्यक सामग्री (Ingredients)</span>
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👨‍🍳</span>
                    <span>बनाने की विधि (Step-by-Step Steps)</span>
                  </h4>
                  <ol className="space-y-2 text-xs text-slate-700">
                    {selectedRecipe.steps.map((st, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{st}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Chef Tip */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-medium flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <strong className="font-bold text-amber-950">शुद्धता टिप: </strong>
                    {selectedRecipe.chefTip}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MARKETING MESSAGES */}
          {activeTab === 'marketing' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Template Category Selector */}
              <div className="lg:col-span-5 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {lang === 'hi' ? 'व्हाट्सएप संदेश टेम्पलेट' : 'WhatsApp Message Templates'}
                </label>
                {marketingTemplates.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMarketing(m)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                      selectedMarketing.id === m.id
                        ? 'border-blue-900 bg-blue-50/70 shadow-sm ring-1 ring-blue-900'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      {m.category}
                    </span>
                    <div className="font-bold text-xs text-slate-900 mt-1">{m.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-mono">
                      {m.text}
                    </div>
                  </button>
                ))}

                {/* AI Custom Generator Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-blue-50 border border-amber-200 space-y-2.5 pt-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-950">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>कस्टम AI प्रचार संदेश बनाएं</span>
                  </div>
                  <input
                    type="text"
                    value={customAiPrompt}
                    onChange={(e) => setCustomAiPrompt(e.target.value)}
                    placeholder="उदा. होली पर मावे और दूध के डिस्काउंट का संदेश"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleGenerateCustomAI}
                    disabled={isAiGenerating || !customAiPrompt.trim()}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-blue-950 font-black text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isAiGenerating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isAiGenerating ? 'AI लिख रहा है...' : '✨ नया AI संदेश बनाएं'}</span>
                  </button>
                </div>
              </div>

              {/* Message Preview Column */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                      {selectedMarketing.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedMarketing.title}
                    </h3>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    ✓ WhatsApp Ready
                  </span>
                </div>

                {/* WhatsApp Chat Style Message Box */}
                <div className="p-4 rounded-2xl bg-[#e5ddd5] border border-slate-300 text-xs sm:text-sm text-slate-900 font-sans whitespace-pre-line leading-relaxed shadow-inner">
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-md border border-slate-200">
                    {aiGeneratedText || selectedMarketing.text}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => handleCopyText(aiGeneratedText || selectedMarketing.text)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'मैसेज कॉपी हो गया!' : 'मैसेज कॉपी करें (Copy)'}</span>
                  </button>

                  <button
                    onClick={() => handleShareMarketing(aiGeneratedText || selectedMarketing.text)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>WhatsApp पर भेजें</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MILK FAT & SNF CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Inputs */}
              <div className="lg:col-span-6 bg-slate-50/80 rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-base font-extrabold text-blue-950 pb-2 border-b border-slate-200">
                  <Sliders className="w-5 h-5 text-blue-900" />
                  <span>{lang === 'hi' ? 'दूध फैट व SNF दर कैलकुलेटर' : 'Milk Fat & SNF Calculator'}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {lang === 'hi' ? 'दूध का प्रकार (Milk Type)' : 'Milk Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setCalcMilkType('cow');
                        setCalcFat(4.2);
                        setCalcSnf(8.5);
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-center transition cursor-pointer ${
                        calcMilkType === 'cow'
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🐄 देसी गाय (Cow Milk)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCalcMilkType('buffalo');
                        setCalcFat(6.5);
                        setCalcSnf(9.0);
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-center transition cursor-pointer ${
                        calcMilkType === 'buffalo'
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🐃 शुद्ध भैंस (Buffalo Milk)
                    </button>
                  </div>
                </div>

                {/* Fat Slider & Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">दूध फैट (Fat %)</label>
                    <span className="font-mono font-black text-blue-900 text-sm bg-blue-100 px-2 py-0.5 rounded-md">
                      {calcFat}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="10.0"
                    step="0.1"
                    value={calcFat}
                    onChange={(e) => setCalcFat(parseFloat(e.target.value))}
                    className="w-full accent-blue-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>3.0% (हल्का)</span>
                    <span>5.0% (मध्यम)</span>
                    <span>10.0% (अत्यधिक गाढ़ा)</span>
                  </div>
                </div>

                {/* SNF Slider & Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">ठोस पदार्थ (SNF %)</label>
                    <span className="font-mono font-black text-emerald-800 text-sm bg-emerald-100 px-2 py-0.5 rounded-md">
                      {calcSnf}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="7.5"
                    max="10.0"
                    step="0.1"
                    value={calcSnf}
                    onChange={(e) => setCalcSnf(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>7.5%</span>
                    <span>8.5% (मानक गाय)</span>
                    <span>9.0% (मानक भैंस)</span>
                    <span>10.0%</span>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'hi' ? 'दूध की कुल मात्रा (लीटर)' : 'Total Liters'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={calcLiters}
                    onChange={(e) => setCalcLiters(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Calculated Results */}
              <div className="lg:col-span-6 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-6 text-white space-y-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    सटीक डेयरी मूल्यांकन
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                    ✓ UP डेयरी मानक दर
                  </span>
                </div>

                <div className="text-center py-2 space-y-1">
                  <span className="text-xs text-blue-200">गणना की गई प्रति लीटर उचित दर</span>
                  <div className="text-4xl sm:text-5xl font-black text-amber-300 font-mono">
                    ₹{currentRate}
                    <span className="text-base text-blue-200 font-normal"> / लीटर</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2 border border-white/10 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-blue-200">दूध का प्रकार:</span>
                    <span className="font-bold text-white">
                      {calcMilkType === 'cow' ? 'देसी गाय (A2)' : 'शुद्ध भैंस'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-blue-200">फैट एवं SNF:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {calcFat}% Fat • {calcSnf}% SNF
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-blue-200">कुल मात्रा:</span>
                    <span className="font-mono font-bold text-white">{calcLiters} Liters</span>
                  </div>
                  <div className="flex justify-between py-2 pt-2 text-sm sm:text-base font-black">
                    <span className="text-amber-200">कुल बिल / भुगतान राशि:</span>
                    <span className="text-emerald-300 font-mono text-lg">₹{totalCalcAmount}</span>
                  </div>
                </div>

                <div className="text-[11px] text-blue-200/80 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  💡 <strong>ज्ञानवर्धक टिप:</strong> भारतीय मानक के अनुसार शुद्ध गाय के दूध में न्यूनतम 3.5% फैट और 8.5% SNF होना चाहिए। भैंस के दूध में न्यूनतम 6.0% फैट और 9.0% SNF होना चाहिए।
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>SHYAM BABA MILK HOUSE • Sakit (Etah) 207121</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            {lang === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
