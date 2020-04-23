import { parseData, canParseData } from '../../src/brokers/dkb';

const buySample = require('./__mocks__/dkb/buy.json');
const sellSample = require('./__mocks__/dkb/sell.json');
const divSample = require('./__mocks__/dkb/div.json');

describe('DKB broker', () => {
  let consoleErrorSpy;

  test('should accept Buy, Sell, Div DKB PDFs only', () => {
    expect(canParseData(['BIC BYLADEM1001', 'Dividendengutschrift'])).toEqual(
      true
    );
  });

  test('should not accept any PDFs', () => {
    expect(canParseData(['42'])).toEqual(false);
  });

  test('should validate the result', () => {
    const invalidSample = buySample.filter(item => item !== 'Stück 36');
    const activity = parseData(invalidSample);

    expect(activity).toEqual(undefined);
    expect(console.error).toHaveBeenLastCalledWith('Error while parsing PDF', {
      amount: 4428,
      broker: 'dkb',
      company: 'Kurswert',
      date: '2019-01-25',
      fee: 10,
      isin: null,
      price: 123,
      shares: NaN,
      type: 'Buy',
    });
  });

  describe('Buy', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(buySample);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2019-01-25',
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 36,
        price: 123,
        amount: 4428,
        fee: 10,
      });
    });
  });

  describe('Sell', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(sellSample);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Sell',
        date: '2020-01-27',
        isin: 'LU1861132840',
        company: 'AIS - AMUNDI STOXX GL.ART.INT.',
        shares: 36,
        price: 123,
        amount: 4428,
        fee: 10,
      });
    });
  });

  describe('Dividend', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(divSample);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2020-02-13',
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 36,
        price: 0.6019444444444445,
        amount: 21.67,
        fee: 0,
      });
    });
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
