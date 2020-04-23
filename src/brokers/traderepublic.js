import format from "date-fns/format";
import parse from "date-fns/parse";
import every from "lodash/every";
import values from "lodash/values";

const parseGermanNum = (n) => {
  return parseFloat(n.replace(/\./g, "").replace(",", "."));
};

const findISIN = (text, span) => {
  const isinLine = text[text.findIndex((t) => t.includes("ISIN:"))];
  console.log("isinLine", isinLine)
  const isin = isinLine.substr(isinLine.length - 12);
  return isin;
};

const findCompany = (text, span) => {
  const companyLine = text[text.findIndex((t) => t.includes("BETRAG")) + 1];
  console.log("companyline", companyLine)
  return companyLine;
};

const findDateBuy = (textArr) => {
  // Extract the date from a string like this: "Market-Order Kauf am 04.02.2020, um 14:02 Uhr an der Lang & Schwarz Exchange."
  const searchTerm = "Kauf am "
  const dateLine = textArr[textArr.findIndex((t) => t.includes(searchTerm))];
  const date = dateLine.split(searchTerm)[1].trim().substr(0, 10)
  return date;
};

const findDateSell = (textArr) => {
  // Extract the date from a string like this: "Market-Order Verkauf am 04.02.2020, um 14:02 Uhr an der Lang & Schwarz Exchange."
  const searchTerm = "Verkauf am "
  const dateLine = textArr[textArr.findIndex((t) => t.includes(searchTerm))];
  const date = dateLine.split(searchTerm)[1].trim().substr(0, 10)
  console.log("dateLine", dateLine)
  return date;
};

const findDateDividend = (textArr) => {
  // Extract the date from a string like this: "Dividende mit dem Ex-Tag 13.02.2020."
  const searchTerm = "mit dem Ex-Tag "
  const dateLine = textArr[textArr.findIndex((t) => t.includes(searchTerm))];
  const datePart = dateLine.split(searchTerm)[1].trim().substring(0, 10)
  const date = datePart;
  return date;
};

const findShares = (textArr) => {
  const searchTerm = " Stk."
  const sharesLine = textArr[textArr.findIndex((t) => t.includes(searchTerm))];
  const shares = sharesLine.split(searchTerm)[0];
  return parseGermanNum(shares);
};

const findAmountBuy = (textArr) => {
  const searchTerm = "GESAMT"
  const totalAmountLine = textArr[textArr.indexOf(searchTerm) + 1];
  console.log("totalAmountLine", totalAmountLine)
  const totalAmount = totalAmountLine.split(" ")[0].trim();
  console.log("totalAmount", totalAmount)
  return parseGermanNum(totalAmount);
};

const findAmountSell = (textArr) => {
  const searchTerm = "GESAMT"
  const totalAmountLine = textArr[textArr.lastIndexOf(searchTerm) + 1];
  console.log("totalAmountLine", totalAmountLine)
  const totalAmount = totalAmountLine.split(" ")[0].trim();
  console.log("totalAmount", totalAmount)
  return parseGermanNum(totalAmount);
};

const findPayout = (textArr) => {
  const searchTerm = "GESAMT"
  const totalAmountLine = textArr[textArr.lastIndexOf(searchTerm) + 1];
  console.log("totalAmountLine", totalAmountLine)
  const totalAmount = totalAmountLine.split(" ")[0].trim();
  console.log("totalAmount", totalAmount)
  return parseGermanNum(totalAmount);
};

const findFee = (textArr) => {
  const searchTerm = "Fremdkostenzuschlag"
  const feeLine = textArr[textArr.indexOf(searchTerm) + 1];
  const feeNumberString = feeLine.split(" EUR")[0]
  return Math.abs(parseGermanNum(feeNumberString))
};

const findTax = (textArr) => {
  const searchTerm = "Zwischensumme"
  var totalTax = 0.0

  if (textArr.lastIndexOf("Kapitalertragssteuer") != -1) {
    const taxPositionLine = textArr[textArr.lastIndexOf("Kapitalertragssteuer") + 1];
    const taxPositionString = taxPositionLine.split(" EUR")[0]
    const taxPositionAmount = Math.abs(parseGermanNum(taxPositionString))
    totalTax += taxPositionAmount
  }


  if (textArr.lastIndexOf("Solidaritätszuschlag") != -1) {
    const taxPositionLine = textArr[textArr.lastIndexOf("Solidaritätszuschlag") + 1];
    const taxPositionString = taxPositionLine.split(" EUR")[0]
    const taxPositionAmount = Math.abs(parseGermanNum(taxPositionString))
    totalTax += taxPositionAmount
  }


  if (textArr.lastIndexOf("Kirchensteuer") != -1) {
    const taxPositionLine = textArr[textArr.lastIndexOf("Kirchensteuer") + 1];
    const taxPositionString = taxPositionLine.split(" EUR")[0]
    const taxPositionAmount = Math.abs(parseGermanNum(taxPositionString))
    totalTax += taxPositionAmount
  }
  return totalTax
}

export const parseTradeRepublicActivity = (textArr) => {
  const isBuy = textArr.some((t) => t.includes("Kauf am"));
  const isSell = textArr.some((t) => t.includes("Verkauf am"));
  const isDividend = textArr.some((t) => t.includes("mit dem Ex-Tag"));

  let type, date, isin, company, shares, price, amount, fee, tax;

  if (isBuy) {
    type = "Buy";
    isin = findISIN(textArr, 0);
    company = findCompany(textArr, 1);
    date = findDateBuy(textArr);
    shares = findShares(textArr);
    amount = findAmountBuy(textArr);
    price = amount / shares;
    fee = findFee(textArr);
    tax = 0;
  } else if (isSell) {
    type = "Sell";
    isin = findISIN(textArr, 2);
    company = findCompany(textArr, 1);
    date = findDateSell(textArr);
    shares = findShares(textArr);
    amount = findAmountSell(textArr);
    price = amount / shares;
    fee = findFee(textArr);
    tax = findTax(textArr);
  } else if (isDividend) {
    type = "Dividend";
    isin = findISIN(textArr, 3);
    company = findCompany(textArr, 2);
    date = findDateDividend(textArr);
    shares = findShares(textArr);
    amount = findPayout(textArr);
    price = amount / shares;
    fee = 0;
    tax = findTax(textArr);
  }

  const activity = {
    broker: "traderepublic",
    type,
    date: format(parse(date, "dd.MM.yyyy", new Date()), "yyyy-MM-dd"),
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax
  };

  console.log("activity", activity);
  const valid = every(values(activity), (a) => !!a || a === 0);

  if (!valid) {
    console.error("Error while parsing PDF", activity);
    return undefined;
  } else {
    return activity;
  }
};
