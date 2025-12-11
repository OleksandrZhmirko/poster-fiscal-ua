Для выполнения основного флоу, например, печати фискального чека, вам необходимо:

* [Развернуть проект](#развертывание-проекта).
* [Подписаться на метод интерфейса Poster](#подписка-на-события-интерфейса-poster).
* [Создать или получить фискальный принтер](#создание-фискального-устройства).
* [Подписаться на события фискального принтера](#подписка-на-фискальные-события).
* [В методе onPrintFiscalReceipt сформировать данные для API ФР](#работа-с-api-фискализации-фр).
* [Вызвать методы API ФР](#работа-с-api-фискализации-фр).
* [Обработать ошибки и вернуть результат в Poster](#обработка-ошибок).

Все эти шаги детально описаны ниже, а также дополнительные, которые помогут вам разработать полноценное приложение фискализации.

## Развертывание проекта

1. Склонировать [POS Platform boilerplate](https://github.com/joinposter/pos-platform-boilerplate).
2. Точка входа в проекте находится в `src/js/app.jsx`.
   Удаляем оттуда все examples и импорты компонентов.
3. React-компонент, который будет привязан здесь, будет отображаться при событии [Poster.interface.popup](https://dev.joinposter.com/docs/v3/pos/interfaces/interface-popup).

```
ReactDOM.render(<App />, document.getElementById('app-container'))
```

## Работа с POS Platform Poster

### Подписка на события интерфейса Poster

Для отображения кнопок интерфейса используется метод [Poster.interface.showApplicationIconAt](https://dev.joinposter.com/docs/v3/pos/interfaces/interface-showApplicationIconAt):

```
  window.Poster.interface.showApplicationIconAt({
    functions: 'Настройки',
    receiptsArchive: 'Печать копии ФД',
  })
```

После нажатия кнопки в соответствующих местах интерфейса срабатывает событие [applicationIconClicked](https://dev.joinposter.com/docs/v3/pos/events/applicationIconClicked):

```
 window.Poster.on('applicationIconClicked', (data) => {
    if (data.place === 'receiptsArchive' && data.order) {
      printFDByNumberReceiptsArchive(data.order)
    } else {
      Poster.interface.popup({
        width: 400,
        height: 252,
        title: 'Настройки',
      })
    }
  })
```

Вызывать эти методы можно сразу в точке входа или в компоненте `<App />`.

### Хранение данных

Для хранения данных приложения или ФР можно использовать свою базу, Poster extras или window.localStorage.
window.localStorage на разных ОС ведёт себя по-разному, поэтому его можно считать неконсистентным хранилищем.
Если собственной базы у приложения нет, то можно хранить данные в [window.Poster.settings.spotTabletExtras или window.Poster.settings.spotExtras](https://dev.joinposter.com/docs/v3/web/application/setEntityExtras?id=applicationsetentityextras-%d0%98%d0%b7%d0%bc%d0%b5%d0%bd%d0%b8%d1%82%d1%8c-%d0%b4%d0%be%d0%bf%d0%be%d0%bb%d0%bd%d0%b8%d1%82%d0%b5%d0%bb%d1%8c%d0%bd%d1%8b%d0%b5-%d0%b4%d0%b0%d0%bd%d0%bd%d1%8b%d0%b5-%d1%81%d1%83%d1%89%d0%bd%d0%be%d1%81%d1%82%d0%b8).
Такие данные привязаны к кассе или заведению соответственно.

Пример запроса из приложения для сохранения данных в `window.Poster.settings.spotTabletExtras`:

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

### Деплой приложения

Для публикации приложения в production:

1. Заполните данные из Poster Developers в файле manifest.json, который находится в корне проекта:

```
{
  "applicationId": ,
  "applicationSecret": ""
}
```

2. Выполните команду `node upload.mjs`
3. Если вы используете GitHub, то можете добавить скрипт автоматического деплоя в файл `.github/workflows/main.yml`:

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

## Работа с ФР

### Создание фискального устройства

При запуске приложения проверяем, создан ли уже ФР. Если нет — создаём и устанавливаем его как ФР по умолчанию.

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
    name: 'Фискальный принтер',
  })
  fiscalPrinter.setDefault()
  fiscalPrinter.setOnline()

  return fiscalPrinter
}
```

### Подписка на фискальные события

На созданном ФР подписываемся на необходимые события:

```
const subscribeToEvents = async (fiscalPrinter) => {
  fiscalPrinter.onPrintFiscalReceipt(onPrintFiscalReceipt)
  fiscalPrinter.onPrintCashFlow(onPrintCashFlow)
  fiscalPrinter.onPrintZReport(onPrintZReport)
  fiscalPrinter.onPrintXReport(onPrintXReport)
  fiscalPrinter.onOpenCashDrawer(onOpenCashDrawer)
}
```

Полный список фискальных событий и передаваемых данных можно посмотреть в [документации](https://dev.joinposter.com/docs/v3/device/fiscal/index?id=%d0%a4%d0%b8%d1%81%d0%ba%d0%b0%d0%bb%d1%8c%d0%bd%d1%8b%d0%b9-%d0%bf%d1%80%d0%b8%d0%bd%d1%82%d0%b5%d1%80).

### Работа с API фискализации (ФР)

Для работы с API фискального регистратора используется метод [window.Poster.makeRequest](https://dev.joinposter.com/docs/v3/pos/requests/makeRequest) с такими параметрами:

```
{
  method: 'POST',
  headers: ['Content-Type: application/json'],
  data,
  timeout: 10000,
  localRequest: true,
}
```

В нашем случае ФР находится в локальной сети, поэтому используется параметр `localRequest: true`.

Пример печати фискального чека:

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
    // здесь данные, необходимые для печати чека
  }

  return makeRequest(ip, data)
}
```

Где `printFiscalReceipt` вызывается в методе `onPrintFiscalReceipt` после срабатывания события `fiscalPrinter.onPrintFiscalReceipt(onPrintFiscalReceipt)`, как описано выше.

### Обработка ошибок

Проверка ответа от API ФР происходит в таком формате:

```
const handleResponse = (response) =>
  // здесь должна быть проверка на успех согласно данным API вашего ФР
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

Более подробно ожидаемый формат ответа можно посмотреть в документации к соответствующему методу, например, [печать фискального чека](https://dev.joinposter.com/docs/v3/device/fiscal/printFiscalReceipt).

Для некоторых действий, таких как открытие фискальной смены, визуального уведомления нет, поэтому можно использовать метод [window.Poster.interface.showNotification](https://dev.joinposter.com/docs/v3/pos/interfaces/interface-showNotification).

```
const showNotification = (message, success = true) => {
  window.Poster.interface.showNotification({
    title: 'Фискальный принтер',
    message,
    icon: success ? 'success' : 'error',
  })
}
```

