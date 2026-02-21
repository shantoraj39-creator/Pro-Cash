
import { CurrencyConfig } from './types';

export const USD_CONFIG: CurrencyConfig = {
  code: 'USD',
  symbol: '$',
  denominations: [
    { id: '100b', label: '$100', value: 100, type: 'bill', image: 'https://placehold.co/120x60/10b981/ffffff?text=$100' },
    { id: '50b', label: '$50', value: 50, type: 'bill', image: 'https://placehold.co/120x60/10b981/ffffff?text=$50' },
    { id: '20b', label: '$20', value: 20, type: 'bill', image: 'https://placehold.co/120x60/10b981/ffffff?text=$20' },
    { id: '10b', label: '$10', value: 10, type: 'bill', image: 'https://placehold.co/120x60/10b981/ffffff?text=$10' },
    { id: '5b', label: '$5', value: 5, type: 'bill', image: 'https://placehold.co/120x60/10b981/ffffff?text=$5' },
    { id: '2b', label: '$2', value: 2, type: 'bill', image: 'https://placehold.co/120x60/10b981/ffffff?text=$2' },
    { id: '1b', label: '$1', value: 1, type: 'bill', image: 'https://placehold.co/120x60/10b981/ffffff?text=$1' },
    { id: '50c', label: '50¢', value: 0.50, type: 'coin', image: 'https://placehold.co/60x60/94a3b8/ffffff?text=50c' },
    { id: '25c', label: '25¢', value: 0.25, type: 'coin', image: 'https://placehold.co/60x60/94a3b8/ffffff?text=25c' },
    { id: '10c', label: '10¢', value: 0.10, type: 'coin', image: 'https://placehold.co/60x60/94a3b8/ffffff?text=10c' },
    { id: '5c', label: '5¢', value: 0.05, type: 'coin', image: 'https://placehold.co/60x60/94a3b8/ffffff?text=5c' },
    { id: '1c', label: '1¢', value: 0.01, type: 'coin', image: 'https://placehold.co/60x60/f59e0b/ffffff?text=1c' },
  ]
};

export const EUR_CONFIG: CurrencyConfig = {
  code: 'EUR',
  symbol: '€',
  denominations: [
    { id: '500b', label: '500€', value: 500, type: 'bill', image: 'https://placehold.co/120x60/6366f1/ffffff?text=500€' },
    { id: '200b', label: '200€', value: 200, type: 'bill', image: 'https://placehold.co/120x60/eab308/ffffff?text=200€' },
    { id: '100b', label: '100€', value: 100, type: 'bill', image: 'https://placehold.co/120x60/10b981/ffffff?text=100€' },
    { id: '50b', label: '50€', value: 50, type: 'bill', image: 'https://placehold.co/120x60/f97316/ffffff?text=50€' },
    { id: '20b', label: '20€', value: 20, type: 'bill', image: 'https://placehold.co/120x60/3b82f6/ffffff?text=20€' },
    { id: '10b', label: '10€', value: 10, type: 'bill', image: 'https://placehold.co/120x60/ef4444/ffffff?text=10€' },
    { id: '5b', label: '5€', value: 5, type: 'bill', image: 'https://placehold.co/120x60/64748b/ffffff?text=5€' },
    { id: '2e', label: '2€', value: 2, type: 'coin', image: 'https://placehold.co/60x60/eab308/ffffff?text=2€' },
    { id: '1e', label: '1€', value: 1, type: 'coin', image: 'https://placehold.co/60x60/94a3b8/ffffff?text=1€' },
    { id: '50c', label: '50c', value: 0.50, type: 'coin', image: 'https://placehold.co/60x60/eab308/ffffff?text=50c' },
    { id: '20c', label: '20c', value: 0.20, type: 'coin', image: 'https://placehold.co/60x60/eab308/ffffff?text=20c' },
    { id: '10c', label: '10c', value: 0.10, type: 'coin', image: 'https://placehold.co/60x60/eab308/ffffff?text=10c' },
  ]
};

export const BDT_CONFIG: CurrencyConfig = {
  code: 'BDT',
  symbol: '৳',
  denominations: [
    { id: '1000b', label: '৳1000', value: 1000, type: 'bill', image: 'https://placehold.co/120x60/8b5cf6/ffffff?text=৳1000' },
    { id: '500b', label: '৳500', value: 500, type: 'bill', image: 'https://placehold.co/120x60/10b981/ffffff?text=৳500' },
    { id: '200b', label: '৳200', value: 200, type: 'bill', image: 'https://placehold.co/120x60/f472b6/ffffff?text=৳200' },
    { id: '100b', label: '৳100', value: 100, type: 'bill', image: 'https://placehold.co/120x60/3b82f6/ffffff?text=৳100' },
    { id: '50b', label: '৳50', value: 50, type: 'bill', image: 'https://placehold.co/120x60/f97316/ffffff?text=৳50' },
    { id: '20b', label: '৳20', value: 20, type: 'bill', image: 'https://placehold.co/120x60/22c55e/ffffff?text=৳20' },
    { id: '10b', label: '৳10', value: 10, type: 'bill', image: 'https://placehold.co/120x60/ec4899/ffffff?text=৳10' },
    { id: '5b', label: '৳5', value: 5, type: 'bill', image: 'https://placehold.co/120x60/a8a29e/ffffff?text=৳5' },
    { id: '2b', label: '৳2', value: 2, type: 'bill', image: 'https://placehold.co/120x60/fb923c/ffffff?text=৳2' },
    { id: '5c', label: '৳5', value: 5, type: 'coin', image: 'https://placehold.co/60x60/cbd5e1/475569?text=৳5' },
    { id: '2c', label: '৳2', value: 2, type: 'coin', image: 'https://placehold.co/60x60/cbd5e1/475569?text=৳2' },
    { id: '1c', label: '৳1', value: 1, type: 'coin', image: 'https://placehold.co/60x60/cbd5e1/475569?text=৳1' },
  ]
};

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  USD_CONFIG,
  EUR_CONFIG,
  BDT_CONFIG,
];
