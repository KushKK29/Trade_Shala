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
