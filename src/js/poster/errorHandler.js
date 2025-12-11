import { showNotification } from './interface'

const errorMapping = {
  CORE_IS_NOT_ACTIVATED: 'Фискальный модуль не активирован',
  CORE_IS_BLOCKED: 'Фискальный модуль заблокирован',
  INVALID_DOC: 'Некорректный документ',
  DATETIME_ERROR: 'Ошибка при работе с датой и временем: проверьте настройки',
  KEYS_ERROR: 'Ошибка ключей',
  FISCAL_MODULE_ERROR: 'Ошибка в работе фискального модуля',
  SHIFT_MUST_BE_OPENED: 'Смена должна быть открыта',
  SHIFT_TOO_LONG: 'Смена открыта более 24 часов',
  INVALID_CONSUMER_CONTACT: 'Ошибка в поле с контактами',
  INVALID_COSTOM_MESSAGE: 'Ошибка в произвольном сообщении для печати',
  INVALID_BANK_RRN: 'Отсутствует или некорректный РРН',
  INVALID_PRODUCT_CODE: 'Ошибка при декодировании поля .code',
  FISCAL_MODULE_EXPIRED: 'Срок действия фискального модуля вышел',
  VALUE_IS_NEGATIVE: 'Недопустимое значение меньше ноля',
  BALANCE_IS_NEGATIVE: 'Отрицательный разменный баланс',
  UNKNOWN_ERROR: 'Неизвестная ошибка',
}

export const handleResponse = (response) =>
  response?.rc === 'SUCCESS'
    ? { data: { errorCode: 0, success: true } }
    : {
        data: {
          errorCode: 1,
          success: false,
          errorText: errorMapping[response?.rc] || response?.rc,
        },
      }

export const handleResponsePrintByFD = (response) =>
  response?.fdNumber
    ? showNotification('Документ напечатан')
    : showNotification(errorMapping[response?.rc] || response?.rc, false)

export const openShiftFailed = ({ rc, data }) => {
  if (rc === 'SUCCESS' && !data?.alreadyOpened) {
    showNotification('Смена успешно открыта на ФР', true)
  }

  return rc !== 'SUCCESS'
}

export const handleNoFDNumber = () =>
  showNotification('Не удалось получить номер ФД', false)
