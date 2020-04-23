import format from 'date-fns/format';
import parse from 'date-fns/parse';
import every from 'lodash/every';
import values from 'lodash/values';

const parseGermanNum = n => {
  return parseFloat(n.replace(/\./g, '').replace(',', '.'));
};

const findISIN = (text, span) => {
  const isinLine = text[text.findIndex(t => t.includes('/ISIN')) + span];
  const isin = isinLine.substr(isinLine.length - 12);
  return isin;
};

const findCompany = (text, span) => {
  const companyLine = text[text.findIndex(t => t.includes('/ISIN')) + span];
  const company = companyLine.substr(0, companyLine.length - 6).trim();
  return company;
};

const findDateBuySell = textArr => {
  const dateLine = textArr[textArr.findIndex(t => t.includes('Geschäftstag'))];
  const date = dateLine.split(':')[1].trim().substr(0, 10);
  return date;
};

const findDateDividend = textArr => {
  const dateLine = textArr[textArr.findIndex(t => t.includes('zahlbar ab'))];
  const datePart = dateLine.split('zahlbar ab')[1].trim().substr(0, 10);
  const date = datePart;
  // console.log('date', date)

  return date;
};

const findShares = textArr => {
  const sharesLine =
    textArr[textArr.findIndex(t => t.includes('Nennwert')) + 1];
  const shares = sharesLine.split('  ')[1];
  return parseGermanNum(shares);
};

const findDividendShares = textArr => {
  const sharesLine = textArr[textArr.findIndex(t => t.includes('STK'))];
  const shares = sharesLine.split('  ').filter(i => i.length > 0)[1];
  // console.log(shares)
  return parseGermanNum(shares);
};

const findAmount = textArr => {
  const priceArea = textArr.slice(
    textArr.findIndex(t => t.includes('Kurswert'))
  );
  const priceLine = priceArea[priceArea.findIndex(t => t.includes('EUR'))];
  const amount = priceLine.split('EUR')[1].trim();
  return parseGermanNum(amount);
};

const findPayout = textArr => {
  const amountLine = textArr[textArr.findIndex(t => t.includes('Gunsten')) + 1];
  const amountPart = amountLine.split('EUR');
  const amount = amountPart[amountPart.length - 1].trim();
  // console.log('payout', amount)
  return parseGermanNum(amount);
};

const findFee = textArr => {
  const amount = findAmount(textArr);
  const totalCostLine =
    textArr[textArr.findIndex(t => t.includes('Zu Ihren')) + 1];
  const totalCost = totalCostLine.split('EUR').pop().trim();

  return Math.abs(parseGermanNum(totalCost) - amount);
};

const isBuy = textArr => textArr.some(t => t.includes('Wertpapierkauf'));

const isSell = textArr => textArr.some(t => t.includes('Wertpapierverkauf'));

const isDividend = textArr =>
  textArr.some(t => t.includes('Ertragsgutschrift')) ||
  textArr.some(t => t.includes('Dividendengutschrift'));

export const canParseData = textArr =>
  textArr.some(t => t.includes('comdirect bank')) &&
  (isBuy(textArr) || isSell(textArr) || isDividend(textArr));

export const parseData = textArr => {
  let type, date, isin, company, shares, price, amount, fee;

  if (isBuy(textArr)) {
    type = 'Buy';
    isin = findISIN(textArr, 2);
    company = findCompany(textArr, 1);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = amount / shares;
    fee = findFee(textArr);
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr, 2);
    company = findCompany(textArr, 1);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = amount / shares;
    fee = findFee(textArr);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    isin = findISIN(textArr, 3);
    company = findCompany(textArr, 2);
    date = findDateDividend(textArr);
    shares = findDividendShares(textArr);
    amount = findPayout(textArr);
    price = amount / shares;
    fee = 0;
  }

  const activity = {
    broker: 'comdirect',
    type,
    date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    isin,
    company,
    shares,
    price,
    amount,
    fee,
  };

  const valid = every(values(activity), a => !!a || a === 0);

  if (!valid) {
    console.error('Error while parsing PDF', activity);
    return undefined;
  } else {
    return activity;
  }
};
