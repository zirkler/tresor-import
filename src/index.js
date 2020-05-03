import pdfjs from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import * as brokers from './brokers';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const getActivity = textArr => {
  const broker = getBroker(textArr);

  return broker.parseData(textArr);
};

export const getBroker = textArr => {
  const supportedBrokers = Object.values(brokers).filter(broker =>
    broker.canParseData(textArr)
  );

  if (supportedBrokers.length > 1) {
    throw 'Multiple supported brokers found!';
  }

  if (supportedBrokers.length === 0) {
    throw 'No supported broker found!';
  }

  return supportedBrokers[0];
};

export const extractActivity = async e => {
  let activity;
  let textArr;

  const result = new Uint8Array(e.currentTarget.result);
  const pdf = await pdfjs.getDocument(result).promise;
  const page = await pdf.getPage(1);
  const tc = await page.getTextContent();

  var out = [];
  for (let c of tc.items) {
    out.push(c.str.trim());
  }
  textArr = out.filter(i => i.length > 0);
  console.log(textArr);

  try {
    activity = getActivity(textArr);
  } catch (error) {
    console.error(error);
  }

  if (!activity) {
    activity = { parserError: true };
  }

  return activity;
};
