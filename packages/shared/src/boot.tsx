import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { loadConfig } from './config';
import { t } from './i18n';
import './messages';

/**
 * Loads /api/config, then renders the app. `load` imports the App lazily so that
 * modules reading the config at import time see the loaded values.
 */
export async function boot(load: () => Promise<{ default: ComponentType }>, before?: () => Promise<void>): Promise<void> {
  const root = createRoot(document.getElementById('root')!);
  try {
    await loadConfig();
    if (before) await before();
    const { default: App } = await load();
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err) {
    console.error(err);
    root.render(
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1>{t('boot.error')}</h1>
        <p>{t('boot.hint')}</p>
        <pre style={{ opacity: 0.6 }}>{String(err)}</pre>
      </div>,
    );
  }
}
