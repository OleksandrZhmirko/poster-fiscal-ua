const setExtrasForOrder = async (orderId, key, value) => {
  Poster.orders.setExtras(orderId, key, value.toString());
};

const getExtrasForOrder = async (order, key) => order.extras[key];

const setDeviceExtras = async (deviceId, key, value) => {
  const device = await Poster.devices.get(deviceId);
  const result = await device.setExtras(key, value);
  console.log('set extras result', result);
};

const getDeviceExtras = async (deviceId, key) => {
  const device = await Poster.devices.get(deviceId);
  if (!device || typeof device.getExtras !== 'function') return null;
  return device.getExtras(key);
};

const saveSettingsToDB = ({ ip, taxType }) => {
  // TODO: save ip and taxType to extras?
  localStorage.setItem('ip', ip);
  localStorage.setItem('taxType', taxType);
};

const getSettingsFromDB = () => {
  const ip = localStorage.getItem('ip');
  const taxType = localStorage.getItem('taxType');

  return { ip, taxType };
};

export {
  setExtrasForOrder, getExtrasForOrder, saveSettingsToDB, getSettingsFromDB,
  setDeviceExtras, getDeviceExtras,
};
