import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonRo from './ro/common.json';

void i18n.use(initReactI18next).init({
  lng: 'ro',
  fallbackLng: 'ro',
  interpolation: { escapeValue: false },
  resources: {
    en: {
      translation: commonRo,
    },
  },
});

export default i18n;
