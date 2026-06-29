import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import commonEn from "./en/common.json";
import commonRo from "./ro/common.json";

void i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  initImmediate: false,
  resources: {
    en: {
      translation: commonEn,
    },
    ro: {
      translation: commonRo,
    },
  },
});

export default i18n;
