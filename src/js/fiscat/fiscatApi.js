const ffdVersion = 'VER_1';
const kktVersion = '1';
const otherErrorAnswer = {
  rc: 'UNKNOWN_ERROR',
};

const formRequestUrl = (ip = 'localhost', command) => `http://${ip}:8002/api/${command}`;
const formRequestInit = data => ({
  method: 'POST',
  headers: [
    'Content-Type: application/json',
  ],
  data,
  timeout: 10000,
  localRequest: true,
});

// TODO: move Poster request to separate file
const makeRequest = async (ip, command, data) => {
  const url = formRequestUrl(ip, command);

  console.log('makeRequest data', data);

  return new Promise(
    resolve => window.Poster.makeRequest(url, formRequestInit(data), (response) => {
      console.log('response make', response);
      resolve(response?.result || otherErrorAnswer);
    }),
  );
};

const deviceStatus = async (ip) => {
  const command = 'deviceStatus';
  const data = {
    formCode: 'DEVICE_STATUS',
    shouldPrintSlip: false,
  };

  return makeRequest(ip, command, data);
};

const xReport = async (ip) => {
  const command = 'getXReport';
  const data = {
    formCode: 'GET_X_REPORT',
    ffdVersion,
    shouldPrintSlip: true,
  };

  return makeRequest(ip, command, data);
};

const zReport = async (ip, cashier) => {
  const command = 'closeShift';
  const data = {
    formCode: 'CLOSE_SHIFT',
    ffdVersion,
    cashier,
    kktVersion,
    shouldPrintSlip: true,
  };

  return makeRequest(ip, command, data);
};

const openShift = async (ip, cashier) => {
  const command = 'openShift';
  const data = {
    formCode: 'OPEN_SHIFT',
    ffdVersion,
    cashier,
    kktVersion,
    shouldPrintSlip: true,
  };

  return makeRequest(ip, command, data);
};

const addCash = async (ip, addAmount) => {
  const command = 'addCash';
  const data = {
    formCode: 'ADD_CASH',
    addAmount,
    shouldPrintSlip: true,
  };

  return makeRequest(ip, command, data);
};

const removeCash = async (ip, removeAmount) => {
  const command = 'removeCash';
  const data = {
    formCode: 'REMOVE_CASH',
    removeAmount,
    shouldPrintSlip: true,
  };

  return makeRequest(ip, command, data);
};

const openDrawer = async (ip) => {
  const command = 'openDrawer';
  const data = {
    formCode: 'OPEN_DRAWER',
    onTimeout: 500,
    offTimeout: 500,
    onQuantity: 1,
  };

  return makeRequest(ip, command, data);
};

const formReceipt = (ip, receipt) => {
  const command = 'formReceipt';
  const data = {
    formCode: 'RECEIPT',
    ffdVersion,
    shouldPrintSlip: true,
    ...receipt,
  };

  return makeRequest(ip, command, data);
};

const printFDByNumber = (ip, fdNumber) => {
  const command = 'getFDByNumber';
  const data = {
    formCode: 'PRINT_FD_BY_NUMBER',
    ffdVersion,
    shouldPrintSlip: true,
    fdNumber,
  };

  return makeRequest(ip, command, data);
};

export {
  xReport, zReport, removeCash, addCash,
  deviceStatus, openShift, openDrawer, formReceipt,
  printFDByNumber,
};
