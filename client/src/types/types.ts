export interface CardProps {
  icon: React.ReactNode; // Type for the icon
  symbol: string; // Type for the symbol
  value: string; // Type for the value
  change: number; // Type for the change percentage
}

export interface MarketTickerProps {
  icon: React.ReactNode; // Type for the icon
  symbol: string; // Type for the symbol
  value: string; // Type for the value (assuming it's a string)
  change: number; // Type for the change percentage
}

export interface StockName {
  shortName: string;
  fullName: string;
}

export interface GenerateOTPData {
  phoneNumber: string;
}

export interface GenerateEmailOTPData {
  email: string;
}

export interface LoginByEmailForm {
  email: string;
  password: string;
}

export interface LoginByPhoneForm {
  phoneNumber: string;
  otp: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  otp: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
}

export interface GoogleLoginPayload {
  name: string;
  email: string;
}

export interface WalletTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: "deposit" | "withdraw";
  createdAt: string;
}

export interface Order {
  id: string;
  symbol: string;
  type: "market" | "limit";
  action: "buy" | "sell";
  quantity: number;
  price: number;
  limitPrice?: number;
  status: "pending" | "completed" | "cancelled";
  timestamp: Date;
  total: number;
  pnl: number;
}

export interface TradeContextType {
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
  orders: Order[];
  addOrder: (
    order: Omit<Order, "id" | "timestamp" | "status" | "total" | "pnl">
  ) => void;
  cancelOrder: (orderId: string) => void;
  getOrdersBySymbol: (symbol: string) => Order[];
  balance: number;
  updateBalance: (amount: number) => void;
  positions: Map<string, { quantity: number; averagePrice: number }>;
  updatePosition: (symbol: string, quantity: number, price: number) => void;
  depositOrWithdrawFunds: (amount: number, type: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
}