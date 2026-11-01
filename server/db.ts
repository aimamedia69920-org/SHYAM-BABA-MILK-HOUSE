import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  CustomerProfile,
  OwnerProfile,
  MilkRateConfig,
  DeliveryRecord,
  MonthlyBill,
  PaymentRecord,
  WhatsAppLog,
  DairyProduct,
  ServiceablePinCode,
  DairyOrder,
  OTPRecord
} from '../src/types/dairy.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'shyam_baba_dairy.json');

export interface DairyDatabase {
  owner: OwnerProfile;
  rates: MilkRateConfig;
  customers: CustomerProfile[];
  deliveries: DeliveryRecord[];
  bills: MonthlyBill[];
  payments: PaymentRecord[];
  whatsappLogs: WhatsAppLog[];
  otpStore: Record<string, OTPRecord>;
  products: DairyProduct[];
  serviceablePinCodes: ServiceablePinCode[];
  orders: DairyOrder[];
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const defaultProducts: DairyProduct[] = [
  {
    id: 'prod_cow_milk',
    name: 'Desi Gir Cow Fresh Milk (A2 Raw)',
    nameHi: 'देसी गिर गाय का ताजा कच्चा दूध (A2)',
    category: 'cow_milk',
    price: 60,
    originalPrice: 70,
    unit: '1 Liter',
    description: 'Farm-fresh, pure raw desi cow milk rich in A2 beta-casein protein, unadulterated & naturally healthy.',
    descriptionHi: 'फार्म-ताजा, बिना किसी मिलावट का शुद्ध देसी गाय का दूध, प्राकृतिक पोषण व A2 प्रोटीन से भरपूर।',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    stockQuantity: 150,
    isFeatured: true,
    badge: 'Best Seller',
    badgeHi: 'सर्वाधिक लोकप्रिय',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_buffalo_milk',
    name: 'Pure Murrah Buffalo Milk (Thick & Creamy)',
    nameHi: 'शुद्ध मुर्रा भैंस का गाढ़ा मलाईदार दूध',
    category: 'buffalo_milk',
    price: 70,
    originalPrice: 80,
    unit: '1 Liter',
    description: 'Thick, creamy high-fat buffalo milk ideal for tea, coffee, making thick curd and homemade sweets.',
    descriptionHi: 'उच्च वसा वाला गाढ़ा दूध, मलाईदार चाय, गाढ़े दही और शुद्ध देशी मिठाइयों के लिए सर्वोत्तम।',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    stockQuantity: 120,
    isFeatured: true,
    badge: 'Super Creamy',
    badgeHi: 'मलाईदार',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_full_cream',
    name: 'Full Cream Gold Milk (6.0% Fat)',
    nameHi: 'फुल क्रीम गोल्ड दूध (6.0% फैट)',
    category: 'full_cream',
    price: 68,
    originalPrice: 75,
    unit: '1 Liter',
    description: 'Rich full cream pasteurized milk packed with essential vitamins and wholesome energy.',
    descriptionHi: 'विटामिन और पोषण से भरपूर गाढ़ा फुल क्रीम पाश्चुरीकृत दूध।',
    image: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    stockQuantity: 80,
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_toned_milk',
    name: 'Toned Fresh Milk (3.0% Fat)',
    nameHi: 'ताजा टोन्ड दूध (3.0% फैट)',
    category: 'toned_milk',
    price: 54,
    originalPrice: 60,
    unit: '1 Liter',
    description: 'Balanced low-fat fresh milk, easily digestible and perfect for fitness-conscious daily diets.',
    descriptionHi: 'हल्का, सुपाच्य और फिटनेस के प्रति जागरूक परिवार के लिए संतुलित दूध।',
    image: 'https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    stockQuantity: 90,
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_packaged_milk',
    name: 'Pasteurized Poly-Pack Fresh Milk',
    nameHi: 'पाश्चुरीकृत पॉली-पैक ताजा दूध',
    category: 'packaged_milk',
    price: 32,
    originalPrice: 35,
    unit: '500 ml',
    description: 'Hygienically sealed 500ml pouch milk tested for 100% purity and chilled at 4°C.',
    descriptionHi: 'पूरी स्वच्छता के साथ सीलबंद 500 मि.ली. ताजा दूध का पाउच।',
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    stockQuantity: 200,
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_curd_dahi',
    name: 'Traditional Clay-Pot Fresh Curd (Matka Dahi)',
    nameHi: 'पारंपरिक मटका ताजा मीठा दही',
    category: 'curd',
    price: 45,
    originalPrice: 50,
    unit: '500 gm',
    description: 'Naturally set thick, spoon-cut curd in earthenware pots with authentic Indian probiotic freshness.',
    descriptionHi: 'मिट्टी के बर्तन में जमाया गया गाढ़ा, प्राकृतिक रूप से स्वादिष्ट और पाचक ताजा दही।',
    image: 'https://images.unsplash.com/photo-1588710929895-6ef7ee0a4d04?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    stockQuantity: 60,
    isFeatured: true,
    badge: 'Probiotic',
    badgeHi: 'पाचक व ताजा',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_paneer',
    name: 'Fresh Malai Paneer (Soft Cottage Cheese)',
    nameHi: 'ताजा मलाई पनीर (सॉफ्ट व स्पंजी)',
    category: 'paneer',
    price: 110,
    originalPrice: 125,
    unit: '250 gm',
    description: 'Mouth-melting soft malai paneer prepared from pure whole milk, free from starch or adulteration.',
    descriptionHi: 'शुद्ध ताजे दूध से निर्मित मुंह में घुल जाने वाला अत्यंत नरम और प्रोटीनयुक्त मलाई पनीर।',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    stockQuantity: 50,
    isFeatured: true,
    badge: 'High Protein',
    badgeHi: 'उच्च प्रोटीन',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_desi_ghee',
    name: 'Pure Vedic Bilona Desi Cow Ghee (A2 Danedar)',
    nameHi: 'शुद्ध वैदिक बिलोना देसी गाय का दानेदार घी',
    category: 'ghee',
    price: 650,
    originalPrice: 750,
    unit: '500 ml',
    description: 'Slow-cooked traditional bilona golden ghee prepared from curd churned butter, carrying divine aroma and purity.',
    descriptionHi: 'दही को मथकर पारंपरिक धीमी आंच पर पकाया गया स्वर्ण समान शुद्ध, दानेदार और सुगंधित देसी घी।',
    image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    stockQuantity: 40,
    isFeatured: true,
    badge: '100% Pure',
    badgeHi: '100% शुद्ध',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_butter',
    name: 'Desi Fresh White Makhan (Hand-Churned)',
    nameHi: 'ताजा घर का बना सफेद मक्खन (मक्खन/माखन)',
    category: 'butter',
    price: 95,
    originalPrice: 110,
    unit: '200 gm',
    description: 'Unsalted traditional Indian white butter freshly churned from cultured cream, Lord Krishna’s favorite.',
    descriptionHi: 'ताजा मलाई से मथा हुआ बिना नमक का शुद्ध सफेद माखन, बाबा श्याम और कान्हा जी का प्रिय।',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    stockQuantity: 35,
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_chaach',
    name: 'Traditional Masala Spiced Chaach / Buttermilk',
    nameHi: 'देसी तड़का मसाला छाछ / मट्ठा',
    category: 'other',
    price: 20,
    originalPrice: 25,
    unit: '500 ml',
    description: 'Refreshing digestive buttermilk blended with roasted cumin, rock salt, mint, and desi spices.',
    descriptionHi: 'भुने जीरे, सेंधा नमक और पुदीने के तड़के से युक्त ताजगी भरी पाचक देशी छाछ।',
    image: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=600&auto=format&fit=crop&q=80',
    inStock: true,
    stockQuantity: 100,
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const defaultPinCodes: ServiceablePinCode[] = [
  {
    pinCode: '207121',
    city: 'Sakit',
    district: 'Etah',
    state: 'Uttar Pradesh',
    codAvailable: true,
    deliveryCharge: 0,
    estimatedDelivery: 'Same Day / Morning (प्रातः 6:00 - 8:00 AM)',
    isActive: true,
  },
  {
    pinCode: '207001',
    city: 'Etah City',
    district: 'Etah',
    state: 'Uttar Pradesh',
    codAvailable: true,
    deliveryCharge: 20,
    estimatedDelivery: 'Same Day Delivery (प्रातः/संध्या)',
    isActive: true,
  },
  {
    pinCode: '282001',
    city: 'Agra',
    district: 'Agra',
    state: 'Uttar Pradesh',
    codAvailable: true,
    deliveryCharge: 35,
    estimatedDelivery: '1-2 Days (Cold-Chain Verified)',
    isActive: true,
  },
  {
    pinCode: '202001',
    city: 'Aligarh',
    district: 'Aligarh',
    state: 'Uttar Pradesh',
    codAvailable: true,
    deliveryCharge: 35,
    estimatedDelivery: '1-2 Days (Cold-Chain Verified)',
    isActive: true,
  },
  {
    pinCode: '110001',
    city: 'Connaught Place',
    district: 'New Delhi',
    state: 'Delhi',
    codAvailable: false, // Prepaid online UPI for long distance cold-chain
    deliveryCharge: 60,
    estimatedDelivery: '2 Days Express Cold-Chain',
    isActive: true,
  },
  {
    pinCode: '201301',
    city: 'Noida',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    codAvailable: true,
    deliveryCharge: 50,
    estimatedDelivery: '1-2 Days Express Delivery',
    isActive: true,
  },
  {
    pinCode: '226001',
    city: 'Lucknow',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    codAvailable: true,
    deliveryCharge: 50,
    estimatedDelivery: '2 Days Delivery',
    isActive: true,
  },
  {
    pinCode: '208001',
    city: 'Kanpur',
    district: 'Kanpur Nagar',
    state: 'Uttar Pradesh',
    codAvailable: true,
    deliveryCharge: 50,
    estimatedDelivery: '2 Days Delivery',
    isActive: true,
  }
];

export function readDb(): DairyDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initial: DairyDatabase = {
      owner: {
        id: 'owner_anita',
        fullName: 'Anita Devi',
        mobile: '7078376806',
        passwordHash: hashPassword('owner@123'),
        twoFactorPin: '123456',
        businessName: 'SHYAM BABA MILK HOUSE',
        privateAddress: 'Mohalla Sahedpura, Chaprai Road, Sakit (Etah), Pincode 207121, Uttar Pradesh, India',
        supportPhone: '+917078376806',
        whatsappSupportUrl: 'https://wa.me/aimamedia69920',
        upiId: '7078376806@ptyes',
        qrPayeeName: 'Ankit Ankit',
        officialQrImage: '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__PAYMENT_QR_CODE_AI_47e8cd69.png',
        appLogo: '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg',
        isOwnerRegistered: true,
        freeDeliveryAbove: 499,
        defaultDeliveryCharge: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      rates: {
        cow: 60,
        buffalo: 70,
        mix: 65,
        other: 55,
        lastUpdated: new Date().toISOString(),
      },
      customers: [],
      deliveries: [],
      bills: [],
      payments: [],
      whatsappLogs: [],
      otpStore: {},
      products: defaultProducts,
      serviceablePinCodes: defaultPinCodes,
      orders: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed: DairyDatabase = JSON.parse(raw);

    let needsWrite = false;

    // Preserve existing data while enriching new schemas
    if (!parsed.products || parsed.products.length === 0) {
      parsed.products = defaultProducts;
      needsWrite = true;
    }
    if (!parsed.serviceablePinCodes || parsed.serviceablePinCodes.length === 0) {
      parsed.serviceablePinCodes = defaultPinCodes;
      needsWrite = true;
    }
    if (!parsed.orders) {
      parsed.orders = [];
      needsWrite = true;
    }
    if (!parsed.otpStore) {
      parsed.otpStore = {};
      needsWrite = true;
    }
    if (!parsed.owner.appLogo || parsed.owner.appLogo.includes('SHYAM_BABA_MILK_HOUSE_LOGO_e37cdb6c')) {
      parsed.owner.appLogo = '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg';
      needsWrite = true;
    }
    if (!parsed.owner.officialQrImage || parsed.owner.officialQrImage.includes('QR_CODE_Payment__ba0a81af')) {
      parsed.owner.officialQrImage = '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__PAYMENT_QR_CODE_AI_47e8cd69.png';
      needsWrite = true;
    }
    if (!parsed.owner.msg91AuthKey) {
      parsed.owner.msg91AuthKey = process.env.MSG91_AUTH_KEY || '586443AlX6TWYUC6ae71e24P1';
      needsWrite = true;
    }

    if (needsWrite) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }

    return parsed;
  } catch (err) {
    console.error('Error reading db, falling back to backup if available:', err);
    const backupFile = path.join(DATA_DIR, 'shyam_baba_dairy.backup.json');
    if (fs.existsSync(backupFile)) {
      const raw = fs.readFileSync(backupFile, 'utf-8');
      return JSON.parse(raw);
    }
    throw err;
  }
}

export function writeDb(db: DairyDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}
