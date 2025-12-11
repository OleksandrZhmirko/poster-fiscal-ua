import {
  addCash,
  deviceStatus,
  formReceipt,
  openDrawer,
  openShift,
  printFDByNumber,
  removeCash,
  xReport,
  zReport,
} from '../fiscat/fiscatApi'
import { convertSumToKopecks } from '../helpers/money'
import { getSettingsFromDB, setExtrasForOrder } from './db'
import {
  handleNoFDNumber,
  handleResponse,
  handleResponsePrintByFD,
  openShiftFailed,
} from './errorHandler'
import makeFiscalReceipt from './fiscalReceipt'

export const initDevice = async () => {
  const devices = await window.Poster.devices.getAll({ type: 'fiscalPrinter' })
  const defaultFiscalPrinter = devices.find((device) => !device.hidden)
  if (defaultFiscalPrinter) {
    defaultFiscalPrinter.setDefault()
    defaultFiscalPrinter.setOnline()
    return defaultFiscalPrinter
  }

  const fiscalPrinter = await Poster.devices.create({
    deviceClass: 'platformOnlineFiscal',
    name: 'Fiscat',
  })
  fiscalPrinter.setDefault()
  fiscalPrinter.setOnline()

  return fiscalPrinter
}

const checkShiftStatus = async (ip) => {
  const { data } = await deviceStatus(ip)
  return data?.shiftStatus
}

const getActiveCashier = async () => {
  const { name } = (await Poster.users.getActiveUser()) || { name: 'Кассир' }
  return name
}

const openShiftIfNeeded = async (ip, cashier) => {
  const opened = await checkShiftStatus(ip)
  const cashierName = cashier || (await getActiveCashier())
  return opened
    ? { rc: 'SUCCESS', data: { alreadyOpened: true } }
    : openShift(ip, cashierName)
}

const onPrintXReport = async (info, callback) => {
  console.log('onPrintXReport', info)

  const { ip } = getSettingsFromDB()
  const response = await xReport(ip)
  const parsedResponse = handleResponse(response)

  callback(parsedResponse)
}

const onPrintZReport = async (info, callback) => {
  console.log('onPrintZReport', info)
  const {
    data: { cashier },
  } = info
  const { ip } = getSettingsFromDB()

  const response = await zReport(ip, cashier)
  const parsedResponse = handleResponse(response)

  callback(parsedResponse)
}

const onPrintCashFlow = async (info, callback) => {
  console.log('onPrintCashFlow', info)

  const { ip } = getSettingsFromDB()
  const {
    data: { sum, cashier },
  } = info
  const openShiftResponse = await openShiftIfNeeded(ip, cashier)
  if (openShiftFailed(openShiftResponse)) {
    callback(openShiftResponse)
    return
  }

  const sumInKopecks = convertSumToKopecks(Math.abs(sum))
  const response =
    sum < 0
      ? await removeCash(ip, sumInKopecks)
      : await addCash(ip, sumInKopecks)
  const parsedResponse = handleResponse(response)

  callback(parsedResponse)
}

const onPrintFiscalReceipt = async (info, callback) => {
  console.log('onPrintFiscalReceipt', info)

  const { cashier } = info
  const { ip, taxType } = getSettingsFromDB()
  const openShiftResponse = await openShiftIfNeeded(ip, cashier)
  if (openShiftFailed(openShiftResponse)) {
    callback(openShiftResponse)
    return
  }

  const receipt = await makeFiscalReceipt(info, taxType)
  console.log('receipt', receipt)

  const response = await formReceipt(ip, receipt)
  const parsedResponse = handleResponse(response)

  callback(parsedResponse)

  if (response?.data?.fdNumber) {
    await setExtrasForOrder(info.order.id, 'fdNumber', response.data.fdNumber)
  }
}

const onOpenCashDrawer = async (info, callback) => {
  console.log('onOpenCashDrawer', info)

  const { ip } = getSettingsFromDB()
  const response = await openDrawer(ip)
  const parsedResponse = handleResponse(response)

  callback(parsedResponse)
}

export const printFDByNumberReceiptsArchive = async (order) => {
  console.log('printFDByNumberReceiptsArchive', order)
  const { extras } = order

  if (!extras?.fdNumber) {
    handleNoFDNumber()
    return
  }

  const { ip } = getSettingsFromDB()
  const response = await printFDByNumber(ip, Number(extras.fdNumber))
  handleResponsePrintByFD(response)
}

export const subscribeToEvents = async (fiscalPrinter) => {
  fiscalPrinter.onPrintFiscalReceipt(onPrintFiscalReceipt)
  fiscalPrinter.onPrintCashFlow(onPrintCashFlow)
  fiscalPrinter.onPrintZReport(onPrintZReport)
  fiscalPrinter.onPrintXReport(onPrintXReport)
  fiscalPrinter.onPrintXReport(onPrintXReport)
  fiscalPrinter.onOpenCashDrawer(onOpenCashDrawer)
}
