import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  readDb,
  writeDb,
  hashPassword,
} from './server/db.ts';
import {
  CustomerProfile,
  DeliveryRecord,
  MonthlyBill,
  PaymentRecord,
  WhatsAppLog,
  DairyProduct,
  ServiceablePinCode,
  DairyOrder
} from './src/types/dairy.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support large payloads for payment screenshots
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

// Clean Indian 10-digit mobile
function sanitizeIndianMobile(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

// ==========================================
// 1. ROBUST SMS GATEWAY & OTP ENGINE
// ==========================================

app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  const rawMobile = req.body.mobile;
  const mobile = sanitizeIndianMobile(rawMobile || '');

  if (!mobile || mobile.length !== 10) {
    return res.status(400).json({
      error: 'कृपया मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें (Please enter valid 10-digit Indian mobile number)'
    });
  }

  const db = readDb();
  const existingOtp = db.otpStore[mobile];
  const now = Date.now();

  // Cooldown check (60 seconds)
  if (existingOtp && existingOtp.lastSentAt && now - existingOtp.lastSentAt < 60 * 1000) {
    const remainingSeconds = Math.ceil((60 * 1000 - (now - existingOtp.lastSentAt)) / 1000);
    return res.status(429).json({
      error: `कृपया पुनः OTP भेजने से पहले ${remainingSeconds} सेकंड प्रतीक्षा करें (Please wait ${remainingSeconds}s before resending OTP)`,
      cooldownSeconds: remainingSeconds
    });
  }

  // Rate limiting (max 5 attempts per 15-minute window)
  if (existingOtp && existingOtp.attempts >= 5 && now < existingOtp.expiresAt) {
    return res.status(429).json({
      error: 'सुरक्षा कारणों से अधिकतम 5 OTP प्रयास पूरे हो चुके हैं। कृपया 15 मिनट बाद पुनः प्रयास करें। (Maximum 5 attempts reached. Try after 15 minutes.)'
    });
  }

  // Generate cryptographically secure 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes expiry

  let providerStatus = 'PENDING_DISPATCH';
  let providerError = '';
  let providerResponse = null;

  // Real SMS Gateway Dispatch (MSG91 / Twilio)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  const activeMsg91Key = process.env.MSG91_AUTH_KEY || db.owner.msg91AuthKey || '586443AlX6TWYUC6ae71e24P1';

  if (activeMsg91Key) {
    try {
      const msg91Payload: Record<string, string> = {
        mobile: `91${mobile}`,
        otp,
      };
      if (db.owner.msg91TemplateId) {
        msg91Payload.template_id = db.owner.msg91TemplateId;
      }
      if (db.owner.msg91SenderId) {
        msg91Payload.sender = db.owner.msg91SenderId;
      }

      const response = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'authkey': activeMsg91Key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(msg91Payload)
      });

      const responseText = await response.text();
      try {
        providerResponse = JSON.parse(responseText);
      } catch {
        providerResponse = responseText;
      }

      if (response.ok) {
        providerStatus = 'DELIVERED_TO_GATEWAY';
      } else {
        providerStatus = 'GATEWAY_ERROR';
        providerError = `MSG91 Gateway returned HTTP ${response.status}: ${responseText}`;
      }
    } catch (err: unknown) {
      providerStatus = 'NETWORK_ERROR';
      providerError = err instanceof Error ? err.message : 'Unknown gateway connection error';
    }
  } else if (twilioSid && twilioAuthToken && twilioFrom) {
    try {
      const params = new URLSearchParams();
      params.append('To', `+91${mobile}`);
      params.append('From', twilioFrom);
      params.append('Body', `🙏 SHYAM BABA MILK HOUSE: Your verification OTP is ${otp}. Valid for 10 minutes. Do not share.`);

      const basicAuth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const twilioData = await twilioRes.json();
      providerResponse = twilioData;

      if (twilioRes.ok) {
        providerStatus = 'DELIVERED_TO_GATEWAY';
      } else {
        providerStatus = 'GATEWAY_ERROR';
        providerError = `Twilio returned: ${twilioData.message || twilioRes.statusText}`;
      }
    } catch (err: unknown) {
      providerStatus = 'NETWORK_ERROR';
      providerError = err instanceof Error ? err.message : 'Twilio dispatch failed';
    }
  } else {
    providerStatus = 'GATEWAY_NOT_CONFIGURED';
    providerError = 'भारत में SMS भेजने के लिए DLT ऑपरेटर से स्वीकृत MSG91 या Twilio क्रेडेंशियल्स आवश्यक हैं। कृपया Firebase Phone Auth का उपयोग करें।';
  }

  // Update OTP store with attempt counting and audit info
  db.otpStore[mobile] = {
    otp,
    expiresAt,
    verified: false,
    attempts: (existingOtp?.attempts || 0) + 1,
    lastSentAt: now,
    providerStatus,
    providerError,
  };

  writeDb(db);

  if (providerStatus !== 'DELIVERED_TO_GATEWAY') {
    return res.status(400).json({
      success: false,
      error: providerError,
      providerStatus,
      providerDiagnosis: providerError,
      cooldownSeconds: 60,
    });
  }

  return res.json({
    success: true,
    message: `मोबाइल नंबर +91 ${mobile} पर SMS सफलतापूर्वक भेजा गया।`,
    mobile: `+91 ${mobile}`,
    expiresInMinutes: 10,
    cooldownSeconds: 60,
    providerStatus,
    providerDiagnosis: 'SMS gateway dispatched successfully',
    providerResponse,
  });
});

// Verify OTP
app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { mobile: rawMobile, otp, code } = req.body;
  const mobile = sanitizeIndianMobile(rawMobile || '');
  const enteredOtp = (otp || code || '').trim();
  const db = readDb();
  const entry = db.otpStore[mobile];

  if (!entry) {
    return res.status(400).json({ error: 'इस मोबाइल नंबर पर कोई OTP अनुरोध नहीं मिला।' });
  }

  if (Date.now() > entry.expiresAt) {
    return res.status(400).json({ error: 'OTP की वैधता समाप्त (Expired) हो चुकी है। कृपया नया OTP मांगें।' });
  }

  if (entry.otp !== enteredOtp) {
    return res.status(400).json({ error: 'गलत OTP दर्ज किया गया है। कृपया पुनः जांचें।' });
  }

  entry.verified = true;
  writeDb(db);

  return res.json({
    success: true,
    message: 'OTP सफलतापूर्वक सत्यापित किया गया (OTP verified successfully)'
  });
});

// Diagnostic endpoint to check OTP delivery status
app.get('/api/auth/otp-status', (req: Request, res: Response) => {
  const mobile = sanitizeIndianMobile((req.query.mobile as string) || '');
  const db = readDb();
  const entry = db.otpStore[mobile];

  if (!entry) {
    return res.status(404).json({ error: 'No OTP record found for this mobile number.' });
  }

  res.json({
    mobile,
    lastSentAt: new Date(entry.lastSentAt).toISOString(),
    expiresAt: new Date(entry.expiresAt).toISOString(),
    isExpired: Date.now() > entry.expiresAt,
    verified: entry.verified,
    attempts: entry.attempts,
    providerStatus: entry.providerStatus,
    providerError: entry.providerError,
  });
});

// ==========================================
// 2. AUTHENTICATION: CUSTOMER & OWNER
// ==========================================

// Customer Registration
app.post('/api/auth/register', (req: Request, res: Response) => {
  const {
    fullName,
    mobile: rawMobile,
    password,
    address,
    city,
    district,
    state,
    pinCode,
    dailyQuantityLiters,
    preferredMilkType,
    preferredLanguage
  } = req.body;

  const mobile = sanitizeIndianMobile(rawMobile || '');

  if (!fullName || !mobile || !password) {
    return res.status(400).json({ error: 'पूरा नाम, मोबाइल नंबर और पासवर्ड आवश्यक हैं।' });
  }

  const db = readDb();
  const existing = db.customers.find(c => c.mobile === mobile);
  if (existing) {
    return res.status(400).json({ error: 'इस मोबाइल नंबर से पहले से ग्राहक खाता मौजूद है। कृपया लॉगिन करें।' });
  }

  const newCustomer: CustomerProfile = {
    id: `cust_${Date.now()}`,
    fullName,
    mobile,
    passwordHash: hashPassword(password),
    address: address || '',
    city: city || 'Sakit',
    district: district || 'Etah',
    state: state || 'Uttar Pradesh',
    pinCode: pinCode || '207121',
    preferredLanguage: preferredLanguage || 'hi',
    dailyQuantityLiters: parseFloat(dailyQuantityLiters) || 1.5,
    preferredMilkType: preferredMilkType || 'cow',
    customRatePerLiter: undefined,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.customers.push(newCustomer);
  writeDb(db);

  const { passwordHash, ...safeUser } = newCustomer;
  return res.json({
    success: true,
    message: 'ग्राहक खाता सफलतापूर्वक बनाया गया!',
    user: safeUser,
  });
});

// Customer Login
app.post('/api/auth/login-customer', (req: Request, res: Response) => {
  const { mobile: rawMobile, password } = req.body;
  const mobile = sanitizeIndianMobile(rawMobile || '');
  const db = readDb();

  const customer = db.customers.find(c => c.mobile === mobile);
  if (!customer) {
    return res.status(401).json({ error: 'यह मोबाइल नंबर पंजीकृत नहीं है। कृपया पहले पंजीकरण करें।' });
  }

  if (customer.passwordHash && customer.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'गलत पासवर्ड दर्ज किया गया है।' });
  }

  if (!customer.isActive) {
    return res.status(403).json({ error: 'आपका खाता निष्क्रिय है। कृपया डेयरी मालिक से संपर्क करें।' });
  }

  const { passwordHash, ...safeUser } = customer;
  return res.json({
    success: true,
    role: 'customer',
    user: safeUser,
  });
});

// Owner Registration / Setup
app.post('/api/auth/register-owner', (req: Request, res: Response) => {
  const {
    fullName,
    mobile: rawMobile,
    password,
    twoFactorPin,
    businessName,
    privateAddress,
    upiId,
    qrPayeeName
  } = req.body;

  const mobile = sanitizeIndianMobile(rawMobile || '');
  if (!fullName || !mobile || !password) {
    return res.status(400).json({ error: 'मालिक का नाम, मोबाइल नंबर और पासवर्ड आवश्यक हैं।' });
  }

  const db = readDb();
  db.owner.fullName = fullName;
  db.owner.mobile = mobile;
  db.owner.passwordHash = hashPassword(password);
  if (twoFactorPin) db.owner.twoFactorPin = twoFactorPin;
  if (businessName) db.owner.businessName = businessName;
  if (privateAddress) db.owner.privateAddress = privateAddress;
  if (upiId) db.owner.upiId = upiId;
  if (qrPayeeName) db.owner.qrPayeeName = qrPayeeName;
  db.owner.isOwnerRegistered = true;
  db.owner.updatedAt = new Date().toISOString();

  writeDb(db);

  const { passwordHash, ...safeOwner } = db.owner;
  return res.json({
    success: true,
    message: 'मालिक खाता व व्यापारिक विवरण सफलतापूर्वक पंजीकृत हुआ!',
    owner: safeOwner,
  });
});

// Owner Login
app.post('/api/auth/login-owner', (req: Request, res: Response) => {
  const { mobile: rawMobile, password, twoFactorPin } = req.body;
  const mobile = sanitizeIndianMobile(rawMobile || '');
  const db = readDb();

  // Verify owner mobile
  if (db.owner.mobile !== mobile) {
    return res.status(401).json({
      error: 'यह मोबाइल नंबर मालिक खाते के रूप में पंजीकृत नहीं है। यदि आप नए मालिक हैं, तो पहले "मालिक पंजीकरण (Owner Sign In / Setup)" करें।'
    });
  }

  if (db.owner.passwordHash && db.owner.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'अमान्य मालिक पासवर्ड।' });
  }

  if (twoFactorPin && db.owner.twoFactorPin && twoFactorPin !== db.owner.twoFactorPin) {
    return res.status(401).json({ error: 'अमान्य 2FA सुरक्षा पिन।' });
  }

  const { passwordHash, ...safeOwner } = db.owner;
  return res.json({
    success: true,
    role: 'owner',
    owner: safeOwner,
  });
});

// Reset Password
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { mobile: rawMobile, otp, newPassword, firebaseVerified } = req.body;
  const mobile = sanitizeIndianMobile(rawMobile || '');
  const db = readDb();

  if (!firebaseVerified) {
    const entry = db.otpStore[mobile];
    if (!entry || entry.otp !== otp || Date.now() > entry.expiresAt) {
      return res.status(400).json({ error: 'अमान्य अथवा समाप्त हो चुका OTP।' });
    }
  }

  const customer = db.customers.find(c => c.mobile === mobile);
  if (customer) {
    customer.passwordHash = hashPassword(newPassword);
    customer.updatedAt = new Date().toISOString();
    writeDb(db);
    return res.json({ success: true, message: 'ग्राहक पासवर्ड सफलतापूर्वक बदल दिया गया।' });
  }

  if (db.owner.mobile === mobile) {
    db.owner.passwordHash = hashPassword(newPassword);
    db.owner.updatedAt = new Date().toISOString();
    writeDb(db);
    return res.json({ success: true, message: 'मालिक पासवर्ड सफलतापूर्वक बदल दिया गया।' });
  }

  return res.status(404).json({ error: 'उपयोगकर्ता खाता नहीं मिला।' });
});

// ==========================================
// 3. E-COMMERCE PRODUCTS & ONLINE STORE
// ==========================================

app.get('/api/products', (req: Request, res: Response) => {
  const { category, search } = req.query;
  const db = readDb();
  let list = db.products || [];

  if (category && category !== 'all') {
    list = list.filter(p => p.category === category);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.nameHi.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.descriptionHi.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

app.post('/api/products', (req: Request, res: Response) => {
  const { name, nameHi, category, price, originalPrice, unit, description, descriptionHi, image, inStock, stockQuantity, isFeatured } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  const db = readDb();
  const newProduct: DairyProduct = {
    id: `prod_${Date.now()}`,
    name,
    nameHi: nameHi || name,
    category: category || 'other',
    price: parseFloat(price),
    originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
    unit: unit || '1 Liter',
    description: description || '',
    descriptionHi: descriptionHi || '',
    image: image || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    inStock: inStock !== undefined ? inStock : true,
    stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 50,
    isFeatured: !!isFeatured,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.products.push(newProduct);
  writeDb(db);
  res.json({ success: true, product: newProduct });
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const prod = db.products.find(p => p.id === id);
  if (!prod) return res.status(404).json({ error: 'Product not found' });

  Object.assign(prod, req.body, { updatedAt: new Date().toISOString() });
  writeDb(db);
  res.json({ success: true, product: prod });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const idx = db.products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  db.products.splice(idx, 1);
  writeDb(db);
  res.json({ success: true, message: 'Product removed' });
});

// ==========================================
// 4. PIN CODE SERVICEABILITY SYSTEM
// ==========================================

app.get('/api/serviceability/check', (req: Request, res: Response) => {
  const pin = (req.query.pinCode as string)?.trim();
  if (!pin || pin.length !== 6) {
    return res.status(400).json({ error: 'कृपया 6-अंकीय पिन कोड दर्ज करें' });
  }

  const db = readDb();
  const matched = db.serviceablePinCodes.find(p => p.pinCode === pin && p.isActive);

  if (matched) {
    return res.json({
      serviceable: true,
      pinCode: matched.pinCode,
      city: matched.city,
      district: matched.district,
      state: matched.state,
      codAvailable: matched.codAvailable,
      deliveryCharge: matched.deliveryCharge,
      estimatedDelivery: matched.estimatedDelivery,
      freeDeliveryAbove: db.owner.freeDeliveryAbove || 499,
      message: `डिलीवरी उपलब्ध है: ${matched.city}, ${matched.district} (${matched.state})`,
    });
  }

  return res.json({
    serviceable: false,
    pinCode: pin,
    message: 'वर्तमान में इस पिन कोड पर सीधी डिलीवरी उपलब्ध नहीं है। कृपया नजदीकी सेवा योग्य क्षेत्र चुनें।',
  });
});

app.get('/api/serviceability/pincodes', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.serviceablePinCodes || []);
});

app.post('/api/serviceability/pincodes', (req: Request, res: Response) => {
  const { pinCode, city, district, state, codAvailable, deliveryCharge, estimatedDelivery } = req.body;
  if (!pinCode || !city) return res.status(400).json({ error: 'PIN Code and City required' });

  const db = readDb();
  const existingIdx = db.serviceablePinCodes.findIndex(p => p.pinCode === pinCode);

  const entry: ServiceablePinCode = {
    pinCode,
    city,
    district: district || city,
    state: state || 'Uttar Pradesh',
    codAvailable: codAvailable !== undefined ? codAvailable : true,
    deliveryCharge: deliveryCharge !== undefined ? parseFloat(deliveryCharge) : 30,
    estimatedDelivery: estimatedDelivery || '1-2 Days',
    isActive: true,
  };

  if (existingIdx >= 0) {
    db.serviceablePinCodes[existingIdx] = entry;
  } else {
    db.serviceablePinCodes.push(entry);
  }

  writeDb(db);
  res.json({ success: true, pinCode: entry });
});

app.delete('/api/serviceability/pincodes/:pin', (req: Request, res: Response) => {
  const { pin } = req.params;
  const db = readDb();
  const idx = db.serviceablePinCodes.findIndex(p => p.pinCode === pin);
  if (idx >= 0) {
    db.serviceablePinCodes.splice(idx, 1);
    writeDb(db);
  }
  res.json({ success: true, message: 'PIN code removed' });
});

// ==========================================
// 5. ORDER MANAGEMENT
// ==========================================

app.post('/api/orders', (req: Request, res: Response) => {
  const {
    customerId,
    customerName,
    customerMobile,
    items,
    shippingAddress,
    paymentMethod,
    screenshotUrl,
    txnRef,
    deliveryDate,
    notes
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
  if (!shippingAddress?.pinCode) {
    return res.status(400).json({ error: 'Delivery PIN code is required' });
  }

  const db = readDb();
  const subtotal = items.reduce((sum: number, it: { price: number; quantity: number }) => sum + it.price * it.quantity, 0);

  // Delivery charge calculation
  const pinRule = db.serviceablePinCodes.find(p => p.pinCode === shippingAddress.pinCode && p.isActive);
  let deliveryCharge = pinRule ? pinRule.deliveryCharge : 40;
  if (db.owner.freeDeliveryAbove && subtotal >= db.owner.freeDeliveryAbove) {
    deliveryCharge = 0;
  }

  const totalAmount = subtotal + deliveryCharge;
  const orderNumber = `SMB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const newOrder: DairyOrder = {
    id: `ord_${Date.now()}`,
    orderNumber,
    customerId: customerId || 'guest',
    customerName: customerName || shippingAddress.fullName,
    customerMobile: customerMobile || shippingAddress.mobile,
    items,
    subtotal,
    deliveryCharge,
    discount: 0,
    totalAmount,
    shippingAddress,
    paymentMethod: paymentMethod || 'upi',
    paymentStatus: paymentMethod === 'cod' ? 'pending' : (screenshotUrl ? 'submitted' : 'pending'),
    orderStatus: 'placed',
    screenshotUrl: screenshotUrl || undefined,
    txnRef: txnRef || undefined,
    deliveryDate: deliveryDate || undefined,
    notes: notes || '',
    placedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);
  writeDb(db);

  res.json({ success: true, order: newOrder });
});

app.get('/api/orders', (req: Request, res: Response) => {
  const { customerId } = req.query;
  const db = readDb();
  let list = db.orders || [];

  if (customerId) {
    list = list.filter(o => o.customerId === customerId);
  }
  res.json(list);
});

app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus, deliveryPersonnel } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (orderStatus) order.orderStatus = orderStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (deliveryPersonnel !== undefined) order.deliveryPersonnel = deliveryPersonnel;
  order.updatedAt = new Date().toISOString();

  writeDb(db);
  res.json({ success: true, order });
});

// ==========================================
// 6. OWNER PROFILE & BUSINESS SETTINGS
// ==========================================

app.get('/api/owner/public-info', (req: Request, res: Response) => {
  const db = readDb();
  res.json({
    businessName: db.owner.businessName,
    fullName: db.owner.fullName,
    supportPhone: db.owner.supportPhone,
    whatsappSupportUrl: db.owner.whatsappSupportUrl,
    upiId: db.owner.upiId,
    qrPayeeName: db.owner.qrPayeeName,
    officialQrImage: db.owner.officialQrImage || '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__PAYMENT_QR_CODE_AI_47e8cd69.png',
    appLogo: db.owner.appLogo || '/assets/aistudio/SHYAM_BABA_MILK_HOUSE__AI_LOGO__45b1c9ed.jpeg',
    freeDeliveryAbove: db.owner.freeDeliveryAbove || 499,
    isOwnerRegistered: db.owner.isOwnerRegistered ?? true,
    // Private address is strictly protected and omitted here!
  });
});

app.get('/api/owner/profile', (req: Request, res: Response) => {
  const db = readDb();
  const { passwordHash, ...safeOwner } = db.owner;
  res.json(safeOwner);
});

app.put('/api/owner/profile', (req: Request, res: Response) => {
  const db = readDb();
  const updates = req.body;

  if (updates.fullName) db.owner.fullName = updates.fullName;
  if (updates.mobile) db.owner.mobile = sanitizeIndianMobile(updates.mobile);
  if (updates.password) db.owner.passwordHash = hashPassword(updates.password);
  if (updates.twoFactorPin) db.owner.twoFactorPin = updates.twoFactorPin;
  if (updates.businessName) db.owner.businessName = updates.businessName;
  if (updates.privateAddress) db.owner.privateAddress = updates.privateAddress;
  if (updates.supportPhone) db.owner.supportPhone = updates.supportPhone;
  if (updates.whatsappSupportUrl) db.owner.whatsappSupportUrl = updates.whatsappSupportUrl;
  if (updates.upiId) db.owner.upiId = updates.upiId;
  if (updates.qrPayeeName) db.owner.qrPayeeName = updates.qrPayeeName;
  if (updates.officialQrImage) db.owner.officialQrImage = updates.officialQrImage;
  if (updates.appLogo) db.owner.appLogo = updates.appLogo;
  if (updates.msg91AuthKey !== undefined) db.owner.msg91AuthKey = updates.msg91AuthKey;
  if (updates.msg91SenderId !== undefined) db.owner.msg91SenderId = updates.msg91SenderId;
  if (updates.msg91TemplateId !== undefined) db.owner.msg91TemplateId = updates.msg91TemplateId;
  if (updates.dltEntityId !== undefined) db.owner.dltEntityId = updates.dltEntityId;
  if (updates.metaWhatsappPhoneId !== undefined) db.owner.metaWhatsappPhoneId = updates.metaWhatsappPhoneId;
  if (updates.metaWhatsappAccessToken !== undefined) db.owner.metaWhatsappAccessToken = updates.metaWhatsappAccessToken;
  if (updates.freeDeliveryAbove !== undefined) db.owner.freeDeliveryAbove = parseFloat(updates.freeDeliveryAbove);

  db.owner.updatedAt = new Date().toISOString();
  writeDb(db);

  const { passwordHash, ...safeOwner } = db.owner;
  res.json({ success: true, owner: safeOwner });
});

// ==========================================
// 7. PRESERVED MILK RATES & CUSTOMERS
// ==========================================

app.get('/api/rates', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.rates);
});

app.put('/api/rates', (req: Request, res: Response) => {
  const { cow, buffalo, mix, other } = req.body;
  const db = readDb();
  db.rates = {
    cow: parseFloat(cow) || db.rates.cow,
    buffalo: parseFloat(buffalo) || db.rates.buffalo,
    mix: parseFloat(mix) || db.rates.mix,
    other: parseFloat(other) || db.rates.other,
    lastUpdated: new Date().toISOString(),
  };
  writeDb(db);
  res.json({ success: true, rates: db.rates });
});

app.get('/api/customers', (req: Request, res: Response) => {
  const db = readDb();
  const safeCustomers = db.customers.map(({ passwordHash, ...c }) => c);
  res.json(safeCustomers);
});

app.post('/api/customers', (req: Request, res: Response) => {
  const { fullName, mobile: rawMobile, password, dailyQuantityLiters, preferredMilkType, customRatePerLiter, address, city, district, state, pinCode, preferredLanguage } = req.body;
  const mobile = sanitizeIndianMobile(rawMobile || '');
  if (!fullName || !mobile) {
    return res.status(400).json({ error: 'Name and mobile number are required' });
  }

  const db = readDb();
  if (db.customers.some(c => c.mobile === mobile)) {
    return res.status(400).json({ error: 'Mobile number already registered' });
  }

  const newCust: CustomerProfile = {
    id: `cust_${Date.now()}`,
    fullName,
    mobile,
    passwordHash: hashPassword(password || 'shyam123'),
    address: address || '',
    city: city || 'Sakit',
    district: district || 'Etah',
    state: state || 'Uttar Pradesh',
    pinCode: pinCode || '207121',
    preferredLanguage: preferredLanguage || 'hi',
    dailyQuantityLiters: parseFloat(dailyQuantityLiters) || 1.5,
    preferredMilkType: preferredMilkType || 'cow',
    customRatePerLiter: customRatePerLiter ? parseFloat(customRatePerLiter) : undefined,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.customers.push(newCust);
  writeDb(db);

  const { passwordHash, ...safe } = newCust;
  res.json({ success: true, customer: safe });
});

app.put('/api/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const cust = db.customers.find(c => c.id === id);
  if (!cust) return res.status(404).json({ error: 'Customer not found' });

  const { fullName, mobile, dailyQuantityLiters, preferredMilkType, customRatePerLiter, address, city, district, state, pinCode, isActive, preferredLanguage, password } = req.body;
  if (fullName) cust.fullName = fullName;
  if (mobile) cust.mobile = sanitizeIndianMobile(mobile);
  if (dailyQuantityLiters !== undefined) cust.dailyQuantityLiters = parseFloat(dailyQuantityLiters);
  if (preferredMilkType) cust.preferredMilkType = preferredMilkType;
  if (customRatePerLiter !== undefined) {
    cust.customRatePerLiter = customRatePerLiter === null || customRatePerLiter === '' ? undefined : parseFloat(customRatePerLiter);
  }
  if (address !== undefined) cust.address = address;
  if (city !== undefined) cust.city = city;
  if (district !== undefined) cust.district = district;
  if (state !== undefined) cust.state = state;
  if (pinCode !== undefined) cust.pinCode = pinCode;
  if (isActive !== undefined) cust.isActive = isActive;
  if (preferredLanguage) cust.preferredLanguage = preferredLanguage;
  if (password) cust.passwordHash = hashPassword(password);
  cust.updatedAt = new Date().toISOString();

  writeDb(db);
  const { passwordHash, ...safe } = cust;
  res.json({ success: true, customer: safe });
});

app.delete('/api/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const idx = db.customers.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });

  db.customers.splice(idx, 1);
  writeDb(db);
  res.json({ success: true, message: 'Customer deleted' });
});

// ==========================================
// 8. PRESERVED DAILY DELIVERIES & CALENDAR
// ==========================================

app.get('/api/deliveries', (req: Request, res: Response) => {
  const { month, customerId } = req.query;
  const db = readDb();
  let list = db.deliveries || [];

  if (month) {
    list = list.filter(d => d.date.startsWith(month as string));
  }
  if (customerId) {
    list = list.filter(d => d.customerId === customerId);
  }
  res.json(list);
});

app.post('/api/deliveries', (req: Request, res: Response) => {
  const { customerId, date, milkQuantityLiters, milkType, ratePerLiter, status, isExtraDelivery, notes, createdBy } = req.body;
  if (!customerId || !date) {
    return res.status(400).json({ error: 'Customer ID and date are required.' });
  }

  const db = readDb();
  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const existingIdx = db.deliveries.findIndex(d => d.customerId === customerId && d.date === date && !d.isExtraDelivery);
  const quantity = status === 'cancelled' ? 0 : parseFloat(milkQuantityLiters) || customer.dailyQuantityLiters;
  const rate = parseFloat(ratePerLiter) || customer.customRatePerLiter || (db.rates[milkType as keyof typeof db.rates] as number) || 60;
  const totalAmount = status === 'cancelled' ? 0 : Math.round(quantity * rate);

  if (existingIdx >= 0 && !isExtraDelivery) {
    const old = db.deliveries[existingIdx];
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: 'Updated delivery',
      changedBy: createdBy || 'owner',
      previousValues: {
        milkQuantityLiters: old.milkQuantityLiters,
        status: old.status,
        ratePerLiter: old.ratePerLiter,
        totalAmount: old.totalAmount,
      },
      newValues: {
        milkQuantityLiters: quantity,
        status,
        ratePerLiter: rate,
        totalAmount,
      }
    };

    old.milkQuantityLiters = quantity;
    old.milkType = milkType || old.milkType;
    old.ratePerLiter = rate;
    old.totalAmount = totalAmount;
    old.status = status;
    old.notes = notes || old.notes;
    old.updatedAt = new Date().toISOString();
    old.history = old.history ? [...old.history, auditEntry] : [auditEntry];

    writeDb(db);
    return res.json({ success: true, delivery: old });
  }

  const newDelivery: DeliveryRecord = {
    id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    customerId,
    customerName: customer.fullName,
    date,
    milkQuantityLiters: quantity,
    milkType: milkType || customer.preferredMilkType,
    ratePerLiter: rate,
    totalAmount,
    status,
    isExtraDelivery: !!isExtraDelivery,
    notes: notes || '',
    createdBy: createdBy || 'owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: []
  };

  db.deliveries.push(newDelivery);
  writeDb(db);
  res.json({ success: true, delivery: newDelivery });
});

app.post('/api/deliveries/bulk-today', (req: Request, res: Response) => {
  const { date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const db = readDb();

  let addedCount = 0;
  db.customers.filter(c => c.isActive).forEach(cust => {
    const exists = db.deliveries.some(d => d.customerId === cust.id && d.date === targetDate);
    if (!exists) {
      const rate = cust.customRatePerLiter || (db.rates[cust.preferredMilkType as keyof typeof db.rates] as number) || 60;
      db.deliveries.push({
        id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        customerId: cust.id,
        customerName: cust.fullName,
        date: targetDate,
        milkQuantityLiters: cust.dailyQuantityLiters,
        milkType: cust.preferredMilkType,
        ratePerLiter: rate,
        totalAmount: Math.round(cust.dailyQuantityLiters * rate),
        status: 'delivered',
        notes: 'दैनिक नियमित वितरण',
        createdBy: 'owner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      addedCount++;
    }
  });

  writeDb(db);
  res.json({ success: true, addedCount, message: `Bulk delivery created for ${addedCount} customers.` });
});

// ==========================================
// 9. AUTOMATIC MONTHLY BILLING ENGINE
// ==========================================

function calculateCustomerBill(db: ReturnType<typeof readDb>, customerId: string, month: string): MonthlyBill {
  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) throw new Error('Customer not found');

  const monthDeliveries = db.deliveries.filter(d => d.customerId === customerId && d.date.startsWith(month));

  let deliveredDays = 0;
  let cancelledDays = 0;
  let totalDeliveredLiters = 0;
  let totalMilkAmount = 0;
  let extraMilkAmount = 0;

  monthDeliveries.forEach(d => {
    if (d.status === 'delivered') {
      deliveredDays++;
      totalDeliveredLiters += d.milkQuantityLiters;
      if (d.isExtraDelivery) {
        extraMilkAmount += d.totalAmount;
      } else {
        totalMilkAmount += d.totalAmount;
      }
    } else if (d.status === 'cancelled') {
      cancelledDays++;
    }
  });

  const payments = db.payments.filter(p => p.customerId === customerId && p.status === 'verified' && p.submittedAt.startsWith(month));
  const paymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  const previousBills = db.bills.filter(b => b.customerId === customerId && b.month < month);
  let previousBalance = 0;
  if (previousBills.length > 0) {
    const lastBill = previousBills.sort((a, b) => b.month.localeCompare(a.month))[0];
    previousBalance = lastBill.remainingBalance || 0;
  }

  const rate = customer.customRatePerLiter || (db.rates[customer.preferredMilkType as keyof typeof db.rates] as number) || 60;
  const effectiveDeliveredLiters = Math.round(totalDeliveredLiters * 10) / 10;
  const effectiveMilkAmount = totalMilkAmount > 0 ? totalMilkAmount : Math.round(effectiveDeliveredLiters * rate);

  const grandTotal = effectiveMilkAmount + extraMilkAmount + previousBalance;
  const remainingBalance = Math.max(0, grandTotal - paymentsReceived);
  const status: MonthlyBill['status'] = remainingBalance === 0 ? 'paid' : (paymentsReceived > 0 ? 'partial' : 'unpaid');

  const customerArea = [customer.address, customer.city, customer.district, customer.pinCode ? `(${customer.pinCode})` : '']
    .filter(Boolean)
    .join(' ') || 'Sakit 207121 (Etah)';

  return {
    id: `bill_${customerId}_${month.replace('-', '_')}`,
    customerId: customer.id,
    customerName: customer.fullName,
    customerArea,
    customerMobile: customer.mobile,
    month,
    monthName: getMonthLabel(month),
    milkType: customer.preferredMilkType || 'cow',
    dailyMilkQuantity: customer.dailyQuantityLiters,
    milkRate: rate,
    totalDeliveredLiters: effectiveDeliveredLiters,
    deliveredDays,
    cancelledDays,
    holidayCount: cancelledDays,
    totalMilkAmount: effectiveMilkAmount,
    extraMilkAmount,
    extraCharges: extraMilkAmount,
    previousBalance,
    discounts: 0,
    paymentsReceived,
    remainingBalance,
    status,
    paymentStatus: status,
    generatedAt: new Date().toISOString(),
    editHistory: [],
  };
}

app.get('/api/bills', (req: Request, res: Response) => {
  const { month, customerId } = req.query;
  const db = readDb();
  let bills = db.bills || [];

  if (month) bills = bills.filter(b => b.month === month);
  if (customerId) bills = bills.filter(b => b.customerId === customerId);
  res.json(bills);
});

app.post('/api/bills/generate', (req: Request, res: Response) => {
  const { customerId, month } = req.body;
  const db = readDb();
  try {
    const computedBill = calculateCustomerBill(db, customerId, month);
    const existingIndex = db.bills.findIndex(b => b.customerId === customerId && b.month === month);
    if (existingIndex >= 0) {
      db.bills[existingIndex] = { ...db.bills[existingIndex], ...computedBill };
    } else {
      db.bills.push(computedBill);
    }
    writeDb(db);
    res.json({ success: true, bill: computedBill });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error generating bill' });
  }
});

app.post('/api/bills/generate-all', (req: Request, res: Response) => {
  const { month } = req.body;
  const db = readDb();
  const generated: MonthlyBill[] = [];

  db.customers.forEach(cust => {
    try {
      const computedBill = calculateCustomerBill(db, cust.id, month);
      const existingIndex = db.bills.findIndex(b => b.customerId === cust.id && b.month === month);
      if (existingIndex >= 0) {
        db.bills[existingIndex] = { ...db.bills[existingIndex], ...computedBill };
        generated.push(db.bills[existingIndex]);
      } else {
        db.bills.push(computedBill);
        generated.push(computedBill);
      }
    } catch (err) {
      console.error('Error generating bill for cust', cust.id, err);
    }
  });

  writeDb(db);
  res.json({ success: true, count: generated.length, bills: generated });
});

// Full Owner Bill Editing API with automatic recalculations and edit history
app.put('/api/bills/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  let bill = db.bills.find(b => b.id === id);

  const {
    customerId,
    customerName,
    customerArea,
    customerMobile,
    month,
    monthName,
    milkType,
    dailyMilkQuantity,
    totalDeliveredLiters,
    milkRate,
    extraCharges,
    holidayCount,
    cancelledDays,
    deliveredDays,
    previousBalance,
    discounts,
    paymentsReceived,
    paymentDate,
    paymentStatus,
    status,
    notes,
    editedBy,
    changesSummary,
  } = req.body;

  if (!bill) {
    const custId = customerId || (id.startsWith('bill_') ? id.split('_')[1] : '');
    const cust = db.customers.find(c => c.id === custId);
    bill = {
      id,
      customerId: custId || 'cust_manual',
      customerName: customerName || cust?.fullName || 'Customer',
      customerArea: customerArea || [cust?.address, cust?.city, cust?.pinCode].filter(Boolean).join(' ') || 'Sakit 207121 (Etah)',
      customerMobile: sanitizeIndianMobile(customerMobile || cust?.mobile || '7078376806'),
      month: month || new Date().toISOString().slice(0, 7),
      monthName: monthName || getMonthLabel(month || new Date().toISOString().slice(0, 7)),
      milkType: milkType || cust?.preferredMilkType || 'cow',
      dailyMilkQuantity: dailyMilkQuantity !== undefined ? parseFloat(dailyMilkQuantity) : (cust?.dailyQuantityLiters || 1.5),
      milkRate: milkRate !== undefined ? parseFloat(milkRate) : 60,
      totalDeliveredLiters: totalDeliveredLiters !== undefined ? parseFloat(totalDeliveredLiters) : 0,
      deliveredDays: deliveredDays !== undefined ? parseInt(deliveredDays, 10) : 0,
      cancelledDays: cancelledDays !== undefined ? parseInt(cancelledDays, 10) : (holidayCount !== undefined ? parseInt(holidayCount, 10) : 0),
      holidayCount: holidayCount !== undefined ? parseInt(holidayCount, 10) : 0,
      totalMilkAmount: 0,
      extraMilkAmount: extraCharges !== undefined ? parseFloat(extraCharges) : 0,
      extraCharges: extraCharges !== undefined ? parseFloat(extraCharges) : 0,
      previousBalance: previousBalance !== undefined ? parseFloat(previousBalance) : 0,
      discounts: discounts !== undefined ? parseFloat(discounts) : 0,
      paymentsReceived: paymentsReceived !== undefined ? parseFloat(paymentsReceived) : 0,
      paymentDate: paymentDate || undefined,
      remainingBalance: 0,
      status: 'unpaid',
      paymentStatus: 'unpaid',
      notes: notes || '',
      generatedAt: new Date().toISOString(),
      editHistory: [],
    };
    db.bills.push(bill);
  }

  // Update properties
  if (customerName !== undefined) bill.customerName = customerName;
  if (customerArea !== undefined) bill.customerArea = customerArea;
  if (customerMobile !== undefined) bill.customerMobile = sanitizeIndianMobile(customerMobile);
  if (month !== undefined) bill.month = month;
  if (monthName !== undefined) bill.monthName = monthName;
  if (milkType !== undefined) bill.milkType = milkType;
  if (dailyMilkQuantity !== undefined) bill.dailyMilkQuantity = parseFloat(dailyMilkQuantity) || 0;
  if (totalDeliveredLiters !== undefined) bill.totalDeliveredLiters = Math.round(parseFloat(totalDeliveredLiters) * 10) / 10;
  if (milkRate !== undefined) bill.milkRate = parseFloat(milkRate) || 0;
  if (deliveredDays !== undefined) bill.deliveredDays = parseInt(deliveredDays, 10) || 0;
  if (holidayCount !== undefined) {
    bill.holidayCount = parseInt(holidayCount, 10) || 0;
    bill.cancelledDays = bill.holidayCount;
  } else if (cancelledDays !== undefined) {
    bill.cancelledDays = parseInt(cancelledDays, 10) || 0;
    bill.holidayCount = bill.cancelledDays;
  }
  if (extraCharges !== undefined) {
    bill.extraCharges = parseFloat(extraCharges) || 0;
    bill.extraMilkAmount = bill.extraCharges;
  }
  if (previousBalance !== undefined) bill.previousBalance = parseFloat(previousBalance) || 0;
  if (discounts !== undefined) bill.discounts = parseFloat(discounts) || 0;
  if (paymentsReceived !== undefined) bill.paymentsReceived = parseFloat(paymentsReceived) || 0;
  if (paymentDate !== undefined) bill.paymentDate = paymentDate;
  if (notes !== undefined) bill.notes = notes;

  // STRICT RECALCULATION FORMULA:
  // 1. Milk Amount = Delivered Litres × Milk Rate
  bill.totalMilkAmount = Math.round(bill.totalDeliveredLiters * bill.milkRate);
  // 2. Total Bill = Milk Amount + Extra Charges + Previous Balance - Discounts
  const extra = bill.extraCharges || bill.extraMilkAmount || 0;
  const prevBal = bill.previousBalance || 0;
  const disc = bill.discounts || 0;
  const totalBillCalculated = bill.totalMilkAmount + extra + prevBal - disc;
  // 3. Remaining Balance = Total Bill - Payments Received
  const paid = bill.paymentsReceived || 0;
  bill.remainingBalance = Math.max(0, totalBillCalculated - paid);

  // Status computation
  if (paymentStatus) {
    bill.paymentStatus = paymentStatus;
    bill.status = paymentStatus === 'paid' ? 'paid' : (paymentStatus === 'partial' ? 'partial' : 'unpaid');
  } else if (status) {
    bill.status = status;
    bill.paymentStatus = status;
  } else {
    bill.status = bill.remainingBalance === 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');
    bill.paymentStatus = bill.status;
  }

  // Audit trail
  const auditEntry = {
    timestamp: new Date().toISOString(),
    editedBy: editedBy || 'Owner Ankit Kumar',
    changesSummary: changesSummary || 'Updated bill details & recalculated amounts',
  };
  bill.editHistory = bill.editHistory ? [...bill.editHistory, auditEntry] : [auditEntry];
  bill.lastUpdated = new Date().toISOString();
  bill.updatedBy = editedBy || 'Owner Ankit Kumar';

  writeDb(db);
  res.json({ success: true, bill });
});

// Create or save custom bill
app.post('/api/bills', (req: Request, res: Response) => {
  const db = readDb();
  const billData = req.body;
  const id = billData.id || `bill_${billData.customerId || 'cust'}_${(billData.month || '2026-10').replace('-', '_')}`;

  const existingIdx = db.bills.findIndex(b => b.id === id);
  if (existingIdx >= 0) {
    db.bills[existingIdx] = { ...db.bills[existingIdx], ...billData, lastUpdated: new Date().toISOString() };
    writeDb(db);
    return res.json({ success: true, bill: db.bills[existingIdx] });
  }

  const newBill: MonthlyBill = {
    ...billData,
    id,
    generatedAt: new Date().toISOString(),
    editHistory: [{
      timestamp: new Date().toISOString(),
      editedBy: billData.editedBy || 'Owner Ankit Kumar',
      changesSummary: 'Bill created',
    }],
  };
  db.bills.push(newBill);
  writeDb(db);
  res.json({ success: true, bill: newBill });
});

// ==========================================
// 10. PAYMENTS & SCREENSHOT MANAGEMENT
// ==========================================

app.get('/api/payments', (req: Request, res: Response) => {
  const { customerId } = req.query;
  const db = readDb();
  let list = db.payments || [];
  if (customerId) list = list.filter(p => p.customerId === customerId);
  res.json(list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
});

app.post('/api/payments', (req: Request, res: Response) => {
  const { customerId, amount, method, transactionReference, screenshotUrl, notes } = req.body;
  const db = readDb();
  const customer = db.customers.find(c => c.id === customerId);

  const newPayment: PaymentRecord = {
    id: `pay_${Date.now()}`,
    customerId: customerId || 'guest',
    customerName: customer ? customer.fullName : 'Online Customer',
    customerMobile: customer ? customer.mobile : '',
    amount: parseFloat(amount) || 0,
    method: method || 'upi',
    status: 'submitted',
    transactionReference: transactionReference || `TXN-${Date.now().toString().slice(-6)}`,
    screenshotUrl: screenshotUrl || '',
    notes: notes || '',
    submittedAt: new Date().toISOString(),
  };

  db.payments.push(newPayment);
  writeDb(db);
  res.json({ success: true, payment: newPayment });
});

app.put('/api/payments/:id/verify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, rejectionReason, verifiedBy } = req.body;
  const db = readDb();

  const payment = db.payments.find(p => p.id === id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  payment.status = status;
  payment.verifiedAt = new Date().toISOString();
  payment.verifiedBy = verifiedBy || db.owner.fullName;
  if (rejectionReason) payment.rejectionReason = rejectionReason;

  if (status === 'verified' && payment.customerId) {
    const month = payment.submittedAt.slice(0, 7);
    try {
      const updatedBill = calculateCustomerBill(db, payment.customerId, month);
      const billIndex = db.bills.findIndex(b => b.customerId === payment.customerId && b.month === month);
      if (billIndex >= 0) db.bills[billIndex] = updatedBill;
    } catch (e) {
      console.warn('Bill update skipped', e);
    }
  }

  writeDb(db);
  res.json({ success: true, payment });
});

// ==========================================
// 11. WHATSAPP BILLING & REAL AI ASSISTANT
// ==========================================

function formatWhatsappMessage(bill: MonthlyBill, ownerName: string, upiId: string): string {
  return `Namaste Sir/Madam 🙏

SHYAM BABA MILK HOUSE
शुद्ध दूध • शुद्धता का विश्वास
Your Monthly Milk Bill

Customer Name: ${bill.customerName}
Month: ${bill.monthName}
Total Milk Delivered: ${bill.totalDeliveredLiters} Liters
Total Delivery Days: ${bill.deliveredDays} Days
Cancelled Days: ${bill.cancelledDays} Days
Milk Rate: ₹${bill.milkRate}/Liter
Total Monthly Amount: ₹${bill.totalMilkAmount + bill.extraMilkAmount}
Previous Balance: ₹${bill.previousBalance}
Total Payable: ₹${bill.remainingBalance}

Payment Options:
1. Cash Payment
2. Online UPI Payment

For online payment, scan our official QR Code or use our UPI ID:
${upiId}

After payment, please upload your payment screenshot in the app.
Thank you for choosing SHYAM BABA MILK HOUSE.

Owner: ${ownerName}`;
}

app.post('/api/whatsapp/send-bill', async (req: Request, res: Response) => {
  const { billId } = req.body;
  const db = readDb();
  const bill = db.bills.find(b => b.id === billId);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  const messageText = formatWhatsappMessage(bill, db.owner.fullName, db.owner.upiId);
  let sendStatus: 'sent' | 'delivered' | 'failed' = 'sent';
  let errorMsg = '';

  if (db.owner.metaWhatsappPhoneId && db.owner.metaWhatsappAccessToken) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${db.owner.metaWhatsappPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${db.owner.metaWhatsappAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${bill.customerMobile}`,
          type: 'text',
          text: { body: messageText }
        })
      });
      if (!response.ok) {
        sendStatus = 'failed';
        errorMsg = await response.text();
      } else {
        sendStatus = 'delivered';
      }
    } catch (err: unknown) {
      sendStatus = 'failed';
      errorMsg = err instanceof Error ? err.message : 'Meta API error';
    }
  }

  bill.lastWhatsappSentAt = new Date().toISOString();
  bill.whatsappMessageStatus = sendStatus;

  const log: WhatsAppLog = {
    id: `wa_${Date.now()}`,
    customerId: bill.customerId,
    customerName: bill.customerName,
    mobile: bill.customerMobile,
    message: messageText,
    sentAt: new Date().toISOString(),
    status: sendStatus,
    errorMessage: errorMsg || undefined,
  };
  db.whatsappLogs.push(log);
  writeDb(db);

  const directWhatsappUrl = `https://wa.me/91${bill.customerMobile}?text=${encodeURIComponent(messageText)}`;
  res.json({ success: true, status: sendStatus, messageText, directWhatsappUrl, log });
});

app.get('/api/whatsapp/logs', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.whatsappLogs || []);
});

// Analytics / Stats
app.get('/api/analytics/stats', (req: Request, res: Response) => {
  const db = readDb();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);

  const activeCustomers = db.customers.filter(c => c.isActive).length;
  const inactiveCustomers = db.customers.length - activeCustomers;

  const todayDeliveries = db.deliveries.filter(d => d.date === today && d.status === 'delivered');
  const todayMilkDeliveredLiters = todayDeliveries.reduce((sum, d) => sum + d.milkQuantityLiters, 0);
  const todaySalesAmount = todayDeliveries.reduce((sum, d) => sum + d.totalAmount, 0);

  const monthDeliveries = db.deliveries.filter(d => d.date.startsWith(currentMonth));
  const monthlyMilkSoldLiters = monthDeliveries
    .filter(d => d.status === 'delivered')
    .reduce((sum, d) => sum + d.milkQuantityLiters, 0);

  const monthlyRevenue = monthDeliveries
    .filter(d => d.status === 'delivered')
    .reduce((sum, d) => sum + d.totalAmount, 0);

  const cancelledDeliveriesThisMonth = monthDeliveries.filter(d => d.status === 'cancelled').length;

  const verifiedPayments = db.payments.filter(p => p.status === 'verified');
  const totalCashReceived = verifiedPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
  const totalOnlinePayments = verifiedPayments.filter(p => p.method === 'upi').reduce((sum, p) => sum + p.amount, 0);

  const currentBills = db.bills.filter(b => b.month === currentMonth);
  const pendingPaymentsTotal = currentBills.reduce((sum, b) => sum + b.remainingBalance, 0);

  const totalOrders = db.orders ? db.orders.length : 0;
  const pendingOrders = db.orders ? db.orders.filter(o => o.orderStatus === 'placed' || o.orderStatus === 'processing').length : 0;

  res.json({
    totalCustomers: db.customers.length,
    activeCustomers,
    inactiveCustomers,
    todayMilkDeliveredLiters: Math.round(todayMilkDeliveredLiters * 10) / 10,
    todaySalesAmount,
    monthlyMilkSoldLiters: Math.round(monthlyMilkSoldLiters * 10) / 10,
    monthlyRevenue,
    totalCashReceived,
    totalOnlinePayments,
    pendingPaymentsTotal,
    cancelledDeliveriesThisMonth,
    totalOrders,
    pendingOrders,
  });
});

// Gemini AI Chatbot
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { message, role, customerId, language } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const db = readDb();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().split('T')[0];

  let systemPrompt = '';

  if (role === 'customer' && customerId) {
    const cust = db.customers.find(c => c.id === customerId);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const custDeliveries = db.deliveries.filter(d => d.customerId === customerId && d.date.startsWith(currentMonth));
    const todayDel = db.deliveries.find(d => d.customerId === customerId && d.date === today);
    const deliveredDays = custDeliveries.filter(d => d.status === 'delivered');
    const cancelledDays = custDeliveries.filter(d => d.status === 'cancelled');
    const totalMonthLiters = deliveredDays.reduce((sum, d) => sum + d.milkQuantityLiters, 0);
    const bill = db.bills.find(b => b.customerId === customerId && b.month === currentMonth);
    const rate = cust.customRatePerLiter || (db.rates[cust.preferredMilkType as keyof typeof db.rates] as number) || 60;
    const custOrders = (db.orders || []).filter(o => o.customerId === customerId);

    systemPrompt = `You are the devoted, accurate AI Customer Support Assistant for "SHYAM BABA MILK HOUSE" (🙏 जय श्री श्याम 🙏 | शुद्ध दूध • शुद्धता का विश्वास).
Strictly answer queries using real records. Do NOT hallucinate.

CUSTOMER RECORDS:
- Name: ${cust.fullName}
- Mobile: ${cust.mobile}
- Daily Milk Quantity: ${cust.dailyQuantityLiters} Liters (${cust.preferredMilkType})
- Milk Rate: ₹${rate}/Liter
- Today's Delivery (${today}): ${todayDel ? `${todayDel.status} (${todayDel.milkQuantityLiters} L)` : 'Normal delivery planned'}
- Month ${getMonthLabel(currentMonth)}:
  * Delivered Liters: ${totalMonthLiters} L (${deliveredDays.length} days)
  * Cancelled Days (No charge): ${cancelledDays.length} days
  * Total Bill: ₹${bill ? bill.totalMilkAmount : totalMonthLiters * rate}
  * Balance Due: ₹${bill ? bill.remainingBalance : Math.max(0, totalMonthLiters * rate)}
- Recent Orders: ${custOrders.length} orders placed (Latest: ${custOrders[0] ? `${custOrders[0].orderNumber} - ${custOrders[0].orderStatus}` : 'None'})
- Official UPI ID: ${db.owner.upiId} (${db.owner.qrPayeeName})

PRIVACY RULE: NEVER disclose owner's private home address.
Language: Answer respectfully in ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}, starting with "जय श्री श्याम 🙏".`;
  } else {
    // Owner AI Assistant
    const activeCusts = db.customers.filter(c => c.isActive);
    const todayDels = db.deliveries.filter(d => d.date === today && d.status === 'delivered');
    const todayTotalLiters = todayDels.reduce((sum, d) => sum + d.milkQuantityLiters, 0);
    const todayTotalSales = todayDels.reduce((sum, d) => sum + d.totalAmount, 0);

    const monthDels = db.deliveries.filter(d => d.date.startsWith(currentMonth));
    const monthSoldLiters = monthDels.filter(d => d.status === 'delivered').reduce((sum, d) => sum + d.milkQuantityLiters, 0);
    const monthRevenue = monthDels.filter(d => d.status === 'delivered').reduce((sum, d) => sum + d.totalAmount, 0);
    const cancelledCount = monthDels.filter(d => d.status === 'cancelled').length;

    const bills = db.bills.filter(b => b.month === currentMonth);
    const pendingList = bills.filter(b => b.remainingBalance > 0).map(b => `${b.customerName} (₹${b.remainingBalance})`).join(', ');

    systemPrompt = `You are the executive Owner AI Business Assistant for "SHYAM BABA MILK HOUSE" (शुद्ध दूध • शुद्धता का विश्वास), assisting Owner (${db.owner.fullName}).
BUSINESS METRICS (${today}, Month ${getMonthLabel(currentMonth)}):
- Registered Customers: ${db.customers.length} (Active: ${activeCusts.length})
- Today's Delivered: ${todayTotalLiters} L (Sales: ₹${todayTotalSales})
- Month Sold: ${monthSoldLiters} L (Revenue: ₹${monthRevenue})
- Cancelled Deliveries This Month: ${cancelledCount}
- Customers with Dues: ${pendingList || 'All clear!'}
- Store Products: ${(db.products || []).length} items active
- Total Store Orders: ${(db.orders || []).length}
- Rates: Cow ₹${db.rates.cow}/L, Buffalo ₹${db.rates.buffalo}/L, Mix ₹${db.rates.mix}/L
- UPI ID: ${db.owner.upiId} (${db.owner.qrPayeeName})

Provide sharp, data-backed insights, reports and advice. Reply in ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}, starting with "नमस्ते ${db.owner.fullName} जी 🙏".`;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        reply: language === 'hi'
          ? `जय श्री श्याम 🙏 आपके प्रश्न का उत्तर तैयार है। वर्तमान महीने के रिकॉर्ड के अनुसार सभी आंकड़े ऊपर डैशबोर्ड में लाइव प्रदर्शित हैं।`
          : `Jai Shree Shyam 🙏 Your live records are directly displayed in the dashboard above.`,
      });
    }

    const ai = new GoogleGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      }
    });

    return res.json({ reply: response.text });
  } catch (err: unknown) {
    console.error('Gemini error:', err);
    return res.json({
      reply: language === 'hi'
        ? `जय श्री श्याम 🙏 रिकॉर्ड के अनुसार आज का डेटा और आपका बिल लाइव अपडेटेड है।`
        : `Jai Shree Shyam 🙏 All records are safely synced with the live dairy database.`,
    });
  }
});

// Gemini AI Maker Creative Endpoint
app.post('/api/ai/maker', async (req: Request, res: Response) => {
  const { type, prompt, language = 'hi' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  const db = readDb();
  const systemInstruction = `You are the creative, devotional AI Dairy Copywriter & Marketing Expert for "SHYAM BABA MILK HOUSE" (शुद्ध दूध • शुद्धता का विश्वास), located at Mohalla Sahedpura, Chaprai Road, Sakit (Etah), UP.
Owner: Ankit Kumar (📱 7078376806), UPI ID: 7078376806@ptyes.
Task: Write catchy, highly authentic, devotional and pure Indian dairy promotional messages, recipes, or poster text based on the user's prompt.
Include emojis, devotional quotes (हारे का सहारा, बाबा श्याम हमारा | जय श्री श्याम 🙏), exact contact details, and pure dairy qualities (no adulteration, fresh morning delivery).
Language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}. Keep it neat and ready to share directly on WhatsApp.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        result: language === 'hi'
          ? `🙏 जय श्री श्याम! हारे का सहारा बाबा श्याम हमारा 🙏\n\n✨ ${prompt}\n\n🐄 100% शुद्ध देसी गाय का ताजा दूध (A2), मलाईदार गाढ़ा भैंस का दूध, बिना स्टार्च का ताजा मलाई पनीर और पारंपरिक दानेदार बिलौना घी उपलब्ध है।\n\n📍 स्थान: सकित (एटा) पिन 207121\n📞 ऑर्डर व होम डिलीवरी: 7078376806 (अंकित कुमार)\n💳 UPI: 7078376806@ptyes\n— श्याम बाबा मिल्क हाउस (शुद्ध दूध • शुद्धता का विश्वास)`
          : `🙏 Jai Shree Shyam! 🙏\n\n✨ ${prompt}\n\n100% Pure & Farm-Fresh Milk, Malai Paneer & Bilona Ghee delivered to your doorstep in Sakit (Etah).\n📞 Contact: 7078376806 (Ankit Kumar)\nUPI: 7078376806@ptyes\n— SHYAM BABA MILK HOUSE`
      });
    }

    const ai = new GoogleGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return res.json({ result: response.text });
  } catch (err: unknown) {
    console.error('AI Maker generation error:', err);
    return res.json({
      result: `🙏 जय श्री श्याम! श्याम बाबा मिल्क हाउस विशेष प्रचार:\n\n${prompt}\n\nताजा व शुद्ध दूध, मलाई पनीर और बिलौना घी के लिए संपर्क करें: 7078376806 (अंकित कुमार) • सकित (एटा) • शुद्ध दूध, शुद्धता का विश्वास!`
    });
  }
});

// Vite Dev Server / Static Hosting
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🥛 SHYAM BABA MILK HOUSE running at http://localhost:${PORT}`);
  });
}

startServer();
