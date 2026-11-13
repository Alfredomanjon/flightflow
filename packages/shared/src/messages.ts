import { registerMessages } from './i18n';

// Strings shared by several apps.
registerMessages({
  en: {
    'common.ground': 'On ground',
    'common.online': 'Online',
    'common.offline': 'Offline',
    'common.toggleDark': 'Toggle light/dark mode',
    'common.lightMode': 'Light mode',
    'common.darkMode': 'Dark mode',
    'common.unknownType': 'Unknown type',
    'common.noData': 'No data',
    'boot.error': 'FlightFlow could not start',
    'boot.hint': 'Is the collector running? This page needs /api/config.',
  },
  es: {
    'common.ground': 'En tierra',
    'common.online': 'En línea',
    'common.offline': 'Sin conexión',
    'common.toggleDark': 'Cambiar modo claro/oscuro',
    'common.lightMode': 'Modo claro',
    'common.darkMode': 'Modo oscuro',
    'common.unknownType': 'Tipo desconocido',
    'common.noData': 'Sin datos',
    'boot.error': 'FlightFlow no ha podido arrancar',
    'boot.hint': '¿Está funcionando el collector? Esta página necesita /api/config.',
  },
});
