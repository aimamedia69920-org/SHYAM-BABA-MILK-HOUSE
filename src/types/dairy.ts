export type UserRole = 'owner' | 'customer';

export type Language = 'hi' | 'en';

export type DeliveryStatus = 'delivered' | 'cancelled' | 'pending' | 'future';

export type MilkType = 'cow' | 'buffalo' | 'mix' | 'other';

export type PaymentMethod = 'upi' | 'cash' | 'cod' | 'other';

export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'rejected' | 'paid';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface CustomerProfile {
  id: string;
  fullName: string;
  mobile: string;
  passwordHash?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  preferredLanguage: Language;
  dailyQuantityLiters: number;
  preferredMilkType: MilkType;
  customRatePerLiter?: number; // if set, overrides default rate
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerProfile {
  id: string;
  fullName: string;
  mobile: string;
  passwordHash?: string;
  twoFactorPin: string; // 2FA pin
  businessName: string;
  privateAddress: string; // Strictly confidential, NEVER shown to customers
  supportPhone: string;
  whatsappSupportUrl: string;
  upiId: string;
  qrPayeeName: string;
  officialQrImage: string;
  appLogo: string;
  isOwnerRegistered?: boolean;
  msg91AuthKey?: string;
  msg91SenderId?: string;
  msg91TemplateId?: string;
  dltEntityId?: string;
  metaWhatsappPhoneId?: string;
  metaWhatsappAccessToken?: string;
  freeDeliveryAbove?: number;
  defaultDeliveryCharge?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MilkRateConfig {
  cow: number;
  buffalo: number;
  mix: number;
  other: number;
  lastUpdated: string;
}

export interface DeliveryRecord {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  milkQuantityLiters: number;
  milkType: MilkType;
  ratePerLiter: number;
  totalAmount: number;
  status: DeliveryStatus;
  isExtraDelivery?: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  history?: DeliveryAuditEntry[];
}

export interface DeliveryAuditEntry {
  timestamp: string;
  action: string;
  changedBy: string;
  previousValues: Partial<DeliveryRecord>;
  newValues: Partial<DeliveryRecord>;
}

export interface BillEditAuditEntry {
  timestamp: string;
  editedBy: string;
  changesSummary: string;
}

export interface MonthlyBill {
  id: string;
  customerId: string;
  customerName: string;
  customerArea?: string;
  customerMobile: string;
  month: string; // YYYY-MM
  monthName: string;
  milkType?: MilkType | string;
  dailyMilkQuantity: number;
  milkRate: number;
  totalDeliveredLiters: number;
  deliveredDays: number;
  cancelledDays: number;
  holidayCount?: number; // Chhutti ke din
  totalMilkAmount: number;
  extraMilkAmount: number;
  extraCharges?: number; // Extra charges
  previousBalance: number;
  discounts?: number; // Discounts deducted
  paymentsReceived: number;
  paymentDate?: string;
  remainingBalance: number;
  status: 'unpaid' | 'partial' | 'paid' | 'pending';
  paymentStatus?: 'paid' | 'partial' | 'pending' | 'unpaid';
  notes?: string;
  generatedAt: string;
  lastUpdated?: string;
  updatedBy?: string;
  editHistory?: BillEditAuditEntry[];
  lastWhatsappSentAt?: string;
  whatsappMessageStatus?: 'sent' | 'delivered' | 'failed' | 'pending';
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string;
  screenshotUrl?: string; // base64 or stored asset url
  notes?: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface WhatsAppLog {
  id: string;
  customerId: string;
  customerName: string;
  mobile: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
}

export interface DairyStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  todayMilkDeliveredLiters: number;
  todaySalesAmount: number;
  monthlyMilkSoldLiters: number;
  monthlyRevenue: number;
  totalCashReceived: number;
  totalOnlinePayments: number;
  pendingPaymentsTotal: number;
  cancelledDeliveriesThisMonth: number;
  totalOrders?: number;
  pendingOrders?: number;
}

// ==========================================
// E-COMMERCE PRODUCTS & ONLINE STORE TYPES
// ==========================================

export type ProductCategory =
  | 'cow_milk'
  | 'buffalo_milk'
  | 'full_cream'
  | 'toned_milk'
  | 'packaged_milk'
  | 'curd'
  | 'paneer'
  | 'ghee'
  | 'butter'
  | 'other';

export interface DairyProduct {
  id: string;
  name: string;
  nameHi: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  unit: string; // '1 Liter', '500 ml', '1 Kg', '500 gm', '200 gm'
  description: string;
  descriptionHi: string;
  image: string;
  inStock: boolean;
  stockQuantity: number;
  isFeatured?: boolean;
  badge?: string;
  badgeHi?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceablePinCode {
  pinCode: string;
  city: string;
  district: string;
  state: string;
  codAvailable: boolean;
  deliveryCharge: number;
  estimatedDelivery: string;
  isActive: boolean;
}

export interface CartItem {
  product: DairyProduct;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  nameHi: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
  total: number;
}

export interface DairyOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    mobile: string;
    addressLine: string;
    city: string;
    district: string;
    state: string;
    pinCode: string;
  };
  paymentMethod: 'cod' | 'upi';
  paymentStatus: 'pending' | 'submitted' | 'verified' | 'paid' | 'rejected';
  orderStatus: OrderStatus;
  screenshotUrl?: string;
  txnRef?: string;
  deliveryDate?: string;
  deliveryPersonnel?: string;
  notes?: string;
  placedAt: string;
  updatedAt: string;
}

export interface OTPRecord {
  otp: string;
  expiresAt: number;
  verified: boolean;
  attempts: number;
  lastSentAt: number;
  providerStatus?: string;
  providerError?: string;
}
