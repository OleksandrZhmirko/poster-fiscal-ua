import { initInterface } from './interface';
import { initDevice, subscribeToEvents } from './device';

const init = async () => {
  initInterface();

  const fiscalPrinter = await initDevice();
  await subscribeToEvents(fiscalPrinter);
  return fiscalPrinter;
};

export { init };
