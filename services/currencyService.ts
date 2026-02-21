
export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  date: string;
}

export const currencyService = {
  async getRates(base: string): Promise<ExchangeRates> {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      return await response.json();
    } catch (error) {
      console.error('Currency service error:', error);
      // Fallback to approximate static rates if API fails
      return {
        base,
        date: new Date().toISOString().split('T')[0],
        rates: {
          USD: base === 'USD' ? 1 : base === 'EUR' ? 1.08 : 0.0085,
          EUR: base === 'EUR' ? 1 : base === 'USD' ? 0.92 : 0.0078,
          BDT: base === 'BDT' ? 1 : base === 'USD' ? 117 : 128,
        }
      };
    }
  }
};
