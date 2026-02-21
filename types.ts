
export interface Denomination {
  id: string;
  label: string;
  value: number;
  type: 'bill' | 'coin';
  image?: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  denominations: Denomination[];
}

export interface CashRecord {
  id: string;
  timestamp: number;
  currency: string;
  counts: Record<string, number>;
  total: number;
  note?: string;
}

export interface ConversionRecord {
  id: string;
  timestamp: number;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  rate: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isThinking?: boolean;
  sources?: { title: string; uri: string }[];
}

export enum AIServiceMode {
  CHAT = 'CHAT',
  LIVE = 'LIVE',
  SEARCH = 'SEARCH'
}
