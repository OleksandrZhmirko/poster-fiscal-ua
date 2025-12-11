# Poster + Fiscat / Фіскалізація в Таджикістані

Для виконання основного флоу, наприклад, друку фіскального чеку вам необхідно.

- [Розгорнути проєкт](#розгортання-проєкту).
- [Підписатись на методі інтерфейсу Poster](#підписка-на-події-інтерфейсу-poster).
- [Створити чи отримати фіскальний принтер](#створення-фіскального-пристрою).
- [Підписатись на події фіскального принтеру](#підписка-на-фіскальні-події).
- [У методі onPrintFiscalReceipt сформувати дані для API ФП](#робота-з-api-фіскалазації-фп).
- [Викликати методи API ФП](#робота-з-api-фіскалазації-фп).
- [Обробити помилки та повернути результат в Poster](#обробка-помилок).

Всі ці кроки детально описані нижче, а також додаткові, які допоможуть вам розробити повноціннний застосунок фіскалізації.

## Розгортання проєкту

1. Склонувати [POS Platform boilerplate](https://github.com/joinposter/pos-platform-boilerplate).
2. Точка входу в проєкті знаходиться в `src/js/app.jsx`.
   Видаляємо звідти усі examples та імпорти компонент.
3. React-компонента, яка буде привʼязана тут буде відображатись на події [Poster.interface.popup](https://dev.joinposter.com/docs/v3/pos/interfaces/interface-popup).

```
ReactDOM.render(<App />, document.getElementById('app-container'))
```

## Робота з POS Platform Poster

### Підписка на події інтерфейсу Poster

Для відображення кнопок інтерфейсу використовується метод [Poster.interface.showApplicationIconAt](https://dev.joinposter.com/docs/v3/pos/interfaces/interface-showApplicationIconAt):

```
  window.Poster.interface.showApplicationIconAt({
    functions: 'Налаштування',
    receiptsArchive: 'Друк копії ФД',
  })
```

Після натискання кнопки у відповідних місцях інтерфейсу спрацьовує подія [applicationIconClicked](https://dev.joinposter.com/docs/v3/pos/events/applicationIconClicked)

```
 window.Poster.on('applicationIconClicked', (data) => {
    if (data.place === 'receiptsArchive' && data.order) {
      printFDByNumberReceiptsArchive(data.order)
    } else {
      Poster.interface.popup({
        width: 400,
        height: 252,
        title: 'Налаштування',
      })
    }
  })
```

Викликати ці методи можна одразу в точці входу чи компоненті `<App />`.

### Зберігання даних

Для зберігання даних застосунку або ФП можна використовувати свою базу, Poster extras або window.localStorage.
window.localStorage на різних OS веде себе по-різному, тому його можна вважати неконсистентим cховищем.
Якщо своєї бази у застосунка нема, то можна зберігати дані в [window.Poster.settings.spotTabletExtras або window.Poster.settings.spotExtras](https://dev.joinposter.com/docs/v3/web/application/setEntityExtras?id=applicationsetentityextras-%d0%98%d0%b7%d0%bc%d0%b5%d0%bd%d0%b8%d1%82%d1%8c-%d0%b4%d0%be%d0%bf%d0%be%d0%bb%d0%bd%d0%b8%d1%82%d0%b5%d0%bb%d1%8c%d0%bd%d1%8b%d0%b5-%d0%b4%d0%b0%d0%bd%d0%bd%d1%8b%d0%b5-%d1%81%d1%83%d1%89%d0%bd%d0%be%d1%81%d1%82%d0%b8).
Такі дані мають привʼязку до каси або закладу відповідно.

Приклад запиту з застосунку для збереження даних в `window.Poster.settings.spotTabletExtras`:

```
const makeApiRequest = async (path, method, data) =>
  new Promise((resolve, reject) => {
    Poster.makeApiRequest(
      path,
      {
        method,
        data,
      },
      (response) => {
        if (response.error) {
          reject(response.error)
        }
        resolve(response.result)
      }
    )
  })

const setEntityExtras = (extras) =>
  makeApiRequest('application.setEntityExtras', 'post', {
    entity_type: 'tablet',
    entity_id: window.Poster.settings.spotTabletId,
    extras,
  })
```

### Деплой застосунку

Для викладення застосунку в production:

1. Заповніть дані з Poster Developers в файлі manifest.json, що знаходиться в корні проєкту.

```
{
  "applicationId": ,
  "applicationSecret": ""
}
```

2. Виконайте команду `node upload.mjs`
3. Якщо ви використовуєте GitHub, то можете додати скрипт автоматичного деплою в файл `.github/workflows/main.yml`:

```
name: Your app name CI

on:
  push:
    branches:
      - main

jobs:
  deploy:

    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
    - name: Install dependencies
      run: npm ci
    - name: Deploy
      run: npm deploy
```

## Робота з ФР

### Створення фіскального пристрою

На запуску застосунку перевіряємо чи є вже створений ФП. Якщо ні, то створюємо та встановлюємого його ФП за замовчуванням.

```
const initDevice = async () => {
  const devices = await window.Poster.devices.getAll({ type: 'fiscalPrinter' })
  const defaultFiscalPrinter = devices.find((device) => !device.hidden)
  if (defaultFiscalPrinter) {
    defaultFiscalPrinter.setDefault()
    defaultFiscalPrinter.setOnline()
    return defaultFiscalPrinter
  }

  const fiscalPrinter = await Poster.devices.create({
    deviceClass: 'platformOnlineFiscal',
    name: 'Фіскальний принтер',
  })
  fiscalPrinter.setDefault()
  fiscalPrinter.setOnline()

  return fiscalPrinter
}
```

### Підписка на фіскальні події

На створеному ФП підписуємось на необхідні події.

```
const subscribeToEvents = async (fiscalPrinter) => {
  fiscalPrinter.onPrintFiscalReceipt(onPrintFiscalReceipt)
  fiscalPrinter.onPrintCashFlow(onPrintCashFlow)
  fiscalPrinter.onPrintZReport(onPrintZReport)
  fiscalPrinter.onPrintXReport(onPrintXReport)
  fiscalPrinter.onPrintXReport(onPrintXReport)
  fiscalPrinter.onOpenCashDrawer(onOpenCashDrawer)
}
```

Повний список фіскальних подій та дані, які передаються можна подивитись в [документації](https://dev.joinposter.com/docs/v3/device/fiscal/index?id=%d0%a4%d0%b8%d1%81%d0%ba%d0%b0%d0%bb%d1%8c%d0%bd%d1%8b%d0%b9-%d0%bf%d1%80%d0%b8%d0%bd%d1%82%d0%b5%d1%80).

### Робота з API фіскалазації (ФП)

Для роботи з API фіскального реєстратора використовується метод [window.Poster.makeRequest](https://dev.joinposter.com/docs/v3/pos/requests/makeRequest) з такими параметрами:

```
{
  method: 'POST',
  headers: ['Content-Type: application/json'],
  data,
  timeout: 10000,
  localRequest: true,
}
```

В нашому випадку ФП знаходиться в локальній мережі, тому використовується параметр `localRequest: true`.

Приклад друку фіскального чеку:

```
const formRequestInit = (data) => ({
  method: 'POST',
  headers: ['Content-Type: application/json'],
  data,
  timeout: 10000,
  localRequest: true,
})

const makeRequest = async (ip, command, data) =>
  new Promise((resolve) =>
    window.Poster.makeRequest(http://${ip}, formRequestInit(data), (response) => {
      resolve(response?.result)
    })
  )

const printFiscalReceipt = (ip) => {
  const data = {
    // тут дані необхідні для друку чеку
  }

  return makeRequest(ip, data)
}
```

Де printFiscalReceipt відповідно викликається в методі `onPrintFiscalReceipt` після спрацювання події `fiscalPrinter.onPrintFiscalReceipt(onPrintFiscalReceipt)`, що описано вище.

### Обробка помилок

Перевірка відповіді від API ФП відбувається в такому форматі:

```
const handleResponse = (response) =>
  // тут повинна бути перевірка на успіх згідно даних API вашого ФР
  response?.rc === 'SUCCESS'
    ? { data: { errorCode: 0, success: true } }
    : {
        data: {
          errorCode: 1,
          success: false,
          errorText: response?.rc,
        },
      }
```

Більш детально очікуваний формат відповіді можна подивитись в документації відповідних методів, наприклад, [друку фіскального чека](https://dev.joinposter.com/docs/v3/device/fiscal/printFiscalReceipt).

Для деяких дій, таких як відкриття фіскальної зміни, візуального сповіщення нема, тому можна використатати метод [window.Poster.interface.showNotification](https://dev.joinposter.com/docs/v3/pos/interfaces/interface-showNotification).

```
const showNotification = (message, success = true) => {
  window.Poster.interface.showNotification({
    title: 'Фіскальний принтер',
    message,
    icon: success ? 'success' : 'error',
  })
}
```
