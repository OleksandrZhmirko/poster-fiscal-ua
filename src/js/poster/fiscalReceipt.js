import { convertSumToKopecks, roundWithPrecision } from '../helpers/money';

const taxesMap = {
  1: 'STANDARD',
  2: 'REDUCED1',
  3: 'ZERO_TAX',
};

const stringTaxesMap = {
  'nds-15': 1,
  'nds-14': 1,
  'nds-7': 2,
  'nds-0': 3,
};

const serviceName = 'Обслуживание';

const getTaxPercentage = tax => Object
  .values(Poster.settings.taxes)
  .find(({ fiscal_program: program }) => program === Number(tax)).tax_value;

const getCommodityByName = name => (name === serviceName ? 'SERVICE' : 'GOODS');

const convertTaxToNumber = tax => stringTaxesMap[tax] || tax;

const mapProductsPosterToFiscat = product => ({
  name: product.name,
  price: convertSumToKopecks(product.price),
  quantity: product.count,
  sum: convertSumToKopecks(roundWithPrecision(product.count * product.price)),
  commodity: getCommodityByName(product.name),
  vatCode: taxesMap[convertTaxToNumber(product.tax)],
});

const calculateTaxesSum = (acc, product) => {
  const { tax } = product;
  const taxProgram = convertTaxToNumber(tax);

  if (!acc[taxProgram]) {
    acc[taxProgram] = 0;
  }
  acc[taxProgram] += product.price * product.count;
  return acc;
};

const calculateTaxesValues = ([program, sum]) => {
  const taxPercentage = getTaxPercentage(program);
  const vatMultiplier = taxPercentage / (taxPercentage + 100);
  return {
    program,
    value: convertSumToKopecks(roundWithPrecision(sum * vatMultiplier)),
  };
};

const mapTaxesToFiscat = tax => ({
  vatCode: taxesMap[tax.program],
  vatSum: tax.value,
});

const mapPaymentsToFiscat = (payments) => {
  const cashPayment = payments.find(({ type }) => type === 'cash');
  const cardPayment = payments.find(({ type }) => type === 'card');

  return {
    receiptCash: cashPayment ? convertSumToKopecks(cashPayment.sum) : 0,
    receiptNonCash: cardPayment ? convertSumToKopecks(cardPayment.sum) : 0,
  };
};

const makeFiscalReceipt = async (data, taxType = 'SIMPLIFIED1') => {
  const {
    products: posterProducts, order: { total }, type, payments,
  } = data;
  const operationType = type === 'sell' ? 'INCOME' : 'REVERT_INCOME';
  const products = posterProducts.map(mapProductsPosterToFiscat);
  const taxesSumMapping = posterProducts.reduce(calculateTaxesSum, {});
  const vats = Object
    .entries(taxesSumMapping)
    .map(calculateTaxesValues)
    .map(mapTaxesToFiscat);
  const taxes = { vats };
  const receiptSum = convertSumToKopecks(total);
  const { receiptCash, receiptNonCash } = mapPaymentsToFiscat(payments);
  const bankRRN = receiptNonCash > 0 ? '000000000000' : undefined;

  return {
    receiptSum,
    taxes,
    products,
    operationType,
    taxType,
    receiptCash,
    receiptNonCash,
    bankRRN,
  };
};

export default makeFiscalReceipt;
