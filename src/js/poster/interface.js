import { printFDByNumberReceiptsArchive } from './device'

export const initInterface = () => {
  window.Poster.interface.showApplicationIconAt({
    functions: 'Настройки Fiscat',
    receiptsArchive: 'Печать копии ФД',
  })

  window.Poster.on('applicationIconClicked', (data) => {
    if (data.place === 'receiptsArchive' && data.order) {
      printFDByNumberReceiptsArchive(data.order)
    } else {
      Poster.interface.popup({
        width: 400,
        height: 252,
        title: 'Настройки Fiscat',
      })
    }
  })
}

export const showNotification = (message, success = true) => {
  window.Poster.interface.showNotification({
    title: 'Fiscat',
    message,
    icon: success ? 'success' : 'error',
  })
}

export const closePopup = () => {
  window.Poster.interface.closePopup()
}
