import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import '../css/main.scss'
import { init } from './poster'
import { setEntityExtras } from './poster/api'
import { getSettingsFromDB, saveSettingsToDB } from './poster/db'
import { closePopup, showNotification } from './poster/interface'
import SettingsView from './ui/SettingsView'

const saveSettings = (ip, taxType, skipNotification) => {
  saveSettingsToDB({ ip, taxType })

  if (skipNotification) return

  setEntityExtras({
    ip,
    taxType,
  })

  showNotification('Настройки сохранены успешно!')
  closePopup()
}

const App = () => {
  const [deviceIp, setDeviceIp] = useState('')
  const [deviceTaxType, setDeviceTaxType] = useState('')
  const [deviceId, setDeviceId] = useState('')

  useEffect(async () => {
    const { id } = await init()
    const { ip, taxType } = getSettingsFromDB()
    const {
      ip: ipFromExtras = ip,
      taxType: taxTypeFromExtras = taxType || 'SIMPLIFIED1',
    } = window.Poster.settings.spotTabletExtras

    saveSettings(ipFromExtras, taxTypeFromExtras, true)

    setDeviceIp(ipFromExtras)
    setDeviceTaxType(taxTypeFromExtras)
    setDeviceId(id)
  }, [])

  if (!deviceId) return <div>Loading...</div>

  return (
    <SettingsView
      savedIp={deviceIp}
      savedTaxType={deviceTaxType}
      saveSettings={saveSettings}
    />
  )
}

ReactDOM.render(<App />, document.getElementById('app-container'))
