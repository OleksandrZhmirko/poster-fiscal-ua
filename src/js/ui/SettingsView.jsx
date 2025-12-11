import { useState } from 'react'
import { deviceStatus } from '../fiscat/fiscatApi'

const taxes = {
  SIMPLIFIED1: 'УСН 6%',
  GENERAL: 'Общий режим',
  SIMPLIFIED2: 'УСН 13%',
  SIMPLIFIED3: 'УСН 18%',
  SPECIAL: 'Спец режим',
}

const SettingsView = ({ savedIp, savedTaxType, saveSettings }) => {
  const [taxType, setTaxType] = useState(savedTaxType)
  const [ip, setIp] = useState(savedIp)
  const onChangeTaxType = ({ target }) => setTaxType(target.value)
  const onSubmit = (e) => {
    e.preventDefault()
    saveSettings(ip, taxType)
  }
  const onDeviceStatusTest = async (e) => {
    e.preventDefault()
    const response = await deviceStatus(ip)
    alert(JSON.stringify(response))
  }

  return (
    <div>
      <form>
        <div className="mb-3">
          <label htmlFor="select" className="form-label">
            Выберите форму налогообложения
          </label>
          <select
            id="select"
            className="form-select"
            onChange={onChangeTaxType}
          >
            {Object.entries(taxes).map(([key, value]) => (
              <option key={key} value={key} selected={key === taxType}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="ip" className="form-label">
            Введите IP ФР
          </label>
          <input
            className="form-control"
            id="ip"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" onClick={onSubmit}>
          Сохранить
        </button>
        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={onDeviceStatusTest}
        >
          DEVICE STATUS TEST
        </button>
      </form>
    </div>
  )
}

export default SettingsView
