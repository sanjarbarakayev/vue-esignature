/**
 * Internationalization (i18n) Module for Vue E-Signature
 *
 * Provides localized error messages for the E-IMZO integration.
 * Supports English (en), Russian (ru), and Uzbek (uz) languages.
 *
 * @example
 * ```typescript
 * import { setLocale, getErrorMessage } from '@eimzo/vue'
 *
 * // Set locale globally
 * setLocale('uz')
 *
 * // Get localized error message
 * const message = getErrorMessage('WRONG_PASSWORD')
 * ```
 */

/**
 * Supported locales
 */
export type SupportedLocale = "en" | "ru" | "uz";

/**
 * Error message keys
 */
export type ErrorMessageKey =
  | "ERIIMZO_NOT_INSTALLED"
  | "ERIIMZO_CRYPTO_API_ERROR"
  | "ERIIMZO_CERT_NOT_FOUND"
  | "ERIIMZO_WRONG_PASSWORD"
  | "ERIIMZO_NO_READER"
  | "ERIIMZO_CARD_NOT_FOUND"
  | "CAPIWS_CONNECTION"
  | "BROWSER_WS"
  | "UPDATE_APP"
  | "WRONG_PASSWORD"
  | "VERSION_UNDEFINED"
  | "INSTALL_NEW_VERSION"
  | "SIGNING_ERROR"
  | "KEY_LOAD_ERROR"
  | "CERTIFICATE_EXPIRED"
  | "CERTIFICATE_NOT_YET_VALID"
  | "OPERATION_TIMEOUT"
  | "RETRY_EXHAUSTED"
  | "CONNECTION_LOST"
  | "RECONNECTING";

/**
 * Message dictionary type
 */
type MessageDictionary = Record<ErrorMessageKey, string>;

/**
 * Localized messages for all supported languages
 */
const messages: Record<SupportedLocale, MessageDictionary> = {
  en: {
    ERIIMZO_NOT_INSTALLED:
      "E-IMZO application is not installed. Please install E-IMZO or E-IMZO Browser.",
    ERIIMZO_CRYPTO_API_ERROR:
      "Crypto API error. Please check your E-IMZO installation.",
    ERIIMZO_CERT_NOT_FOUND:
      "Certificate not found. Please ensure your certificate is properly installed.",
    ERIIMZO_WRONG_PASSWORD: "Incorrect password. Please try again.",
    ERIIMZO_NO_READER:
      "No card reader found. Please connect your smart card reader.",
    ERIIMZO_CARD_NOT_FOUND:
      "Smart card not found. Please insert your ID card or token.",
    CAPIWS_CONNECTION:
      "Connection error with E-IMZO. Please ensure E-IMZO application or E-IMZO Browser is installed and running.",
    BROWSER_WS:
      "Your browser does not support WebSocket technology. Please update to the latest version of your browser.",
    UPDATE_APP:
      'WARNING! Please install the new version of E-IMZO application or E-IMZO Browser. <a href="https://e-imzo.soliq.uz/download/" role="button">Download E-IMZO</a>',
    WRONG_PASSWORD: "Incorrect password.",
    VERSION_UNDEFINED: "E-IMZO version is undefined.",
    INSTALL_NEW_VERSION: "Please install the new version of E-IMZO.",
    SIGNING_ERROR: "Error during document signing. Please try again.",
    KEY_LOAD_ERROR: "Error loading the signing key. Please check your password.",
    CERTIFICATE_EXPIRED:
      "Your certificate has expired. Please renew your certificate.",
    CERTIFICATE_NOT_YET_VALID:
      "Your certificate is not yet valid. Please check the certificate validity period.",
    OPERATION_TIMEOUT:
      "The operation timed out. Please check your connection and try again.",
    RETRY_EXHAUSTED:
      "The operation failed after multiple attempts. Please try again later.",
    CONNECTION_LOST:
      "Connection to E-IMZO was lost. Please ensure E-IMZO is running.",
    RECONNECTING: "Reconnecting to E-IMZO...",
  },
  ru: {
    ERIIMZO_NOT_INSTALLED:
      "Приложение E-IMZO не установлено. Пожалуйста, установите E-IMZO или Браузер E-IMZO.",
    ERIIMZO_CRYPTO_API_ERROR:
      "Ошибка Crypto API. Пожалуйста, проверьте установку E-IMZO.",
    ERIIMZO_CERT_NOT_FOUND:
      "Сертификат не найден. Пожалуйста, убедитесь, что ваш сертификат правильно установлен.",
    ERIIMZO_WRONG_PASSWORD: "Неверный пароль. Пожалуйста, попробуйте снова.",
    ERIIMZO_NO_READER:
      "Считыватель карт не найден. Пожалуйста, подключите считыватель смарт-карт.",
    ERIIMZO_CARD_NOT_FOUND:
      "Смарт-карта не найдена. Пожалуйста, вставьте ID-карту или токен.",
    CAPIWS_CONNECTION:
      "Ошибка соединения с E-IMZO. Возможно у вас не установлен модуль E-IMZO или Браузер E-IMZO.",
    BROWSER_WS:
      "Браузер не поддерживает технологию WebSocket. Установите последнюю версию браузера.",
    UPDATE_APP:
      'ВНИМАНИЕ! Установите новую версию приложения E-IMZO или Браузера E-IMZO. <a href="https://e-imzo.soliq.uz/download/" role="button">Скачать ПО E-IMZO</a>',
    WRONG_PASSWORD: "Пароль неверный.",
    VERSION_UNDEFINED: "Версия E-IMZO не определена.",
    INSTALL_NEW_VERSION: "Пожалуйста, установите новую версию E-IMZO.",
    SIGNING_ERROR:
      "Ошибка при подписании документа. Пожалуйста, попробуйте снова.",
    KEY_LOAD_ERROR: "Ошибка загрузки ключа подписи. Проверьте правильность пароля.",
    CERTIFICATE_EXPIRED:
      "Срок действия вашего сертификата истек. Пожалуйста, обновите сертификат.",
    CERTIFICATE_NOT_YET_VALID:
      "Ваш сертификат еще не действителен. Пожалуйста, проверьте срок действия сертификата.",
    OPERATION_TIMEOUT:
      "Время ожидания операции истекло. Проверьте соединение и попробуйте снова.",
    RETRY_EXHAUSTED:
      "Операция не удалась после нескольких попыток. Пожалуйста, попробуйте позже.",
    CONNECTION_LOST:
      "Соединение с E-IMZO потеряно. Убедитесь, что E-IMZO запущен.",
    RECONNECTING: "Переподключение к E-IMZO...",
  },
  uz: {
    ERIIMZO_NOT_INSTALLED:
      "E-IMZO ilovasi o'rnatilmagan. Iltimos, E-IMZO yoki E-IMZO Brauzerini o'rnating.",
    ERIIMZO_CRYPTO_API_ERROR:
      "Crypto API xatosi. Iltimos, E-IMZO o'rnatilishini tekshiring.",
    ERIIMZO_CERT_NOT_FOUND:
      "Sertifikat topilmadi. Iltimos, sertifikatingiz to'g'ri o'rnatilganligiga ishonch hosil qiling.",
    ERIIMZO_WRONG_PASSWORD:
      "Parol noto'g'ri. Iltimos, qaytadan urinib ko'ring.",
    ERIIMZO_NO_READER:
      "Karta o'quvchi topilmadi. Iltimos, smart-karta o'quvchingizni ulang.",
    ERIIMZO_CARD_NOT_FOUND:
      "Smart-karta topilmadi. Iltimos, ID-kartangiz yoki tokeningizni joylashtiring.",
    CAPIWS_CONNECTION:
      "E-IMZO bilan bog'lanishda xatolik. E-IMZO ilovasi yoki E-IMZO Brauzeri o'rnatilgan va ishga tushirilganligiga ishonch hosil qiling.",
    BROWSER_WS:
      "Brauzeringiz WebSocket texnologiyasini qo'llab-quvvatlamaydi. Iltimos, brauzeringizni so'nggi versiyasiga yangilang.",
    UPDATE_APP:
      'DIQQAT! E-IMZO ilovasi yoki E-IMZO Brauzerining yangi versiyasini o\'rnating. <a href="https://e-imzo.soliq.uz/download/" role="button">E-IMZO dasturini yuklab olish</a>',
    WRONG_PASSWORD: "Parol noto'g'ri.",
    VERSION_UNDEFINED: "E-IMZO versiyasi aniqlanmagan.",
    INSTALL_NEW_VERSION: "Iltimos, E-IMZOning yangi versiyasini o'rnating.",
    SIGNING_ERROR:
      "Hujjatni imzolashda xatolik. Iltimos, qaytadan urinib ko'ring.",
    KEY_LOAD_ERROR:
      "Imzo kalitini yuklashda xatolik. Parolni tekshiring.",
    CERTIFICATE_EXPIRED:
      "Sertifikatingiz muddati tugagan. Iltimos, sertifikatingizni yangilang.",
    CERTIFICATE_NOT_YET_VALID:
      "Sertifikatingiz hali amal qilmayapti. Iltimos, sertifikat amal qilish muddatini tekshiring.",
    OPERATION_TIMEOUT:
      "Amaliyot vaqti tugadi. Iltimos, ulanishingizni tekshiring va qayta urinib ko'ring.",
    RETRY_EXHAUSTED:
      "Amaliyot bir necha urinishdan keyin muvaffaqiyatsiz tugadi. Iltimos, keyinroq urinib ko'ring.",
    CONNECTION_LOST:
      "E-IMZO bilan aloqa uzildi. E-IMZO ishga tushirilganligiga ishonch hosil qiling.",
    RECONNECTING: "E-IMZO ga qayta ulanish...",
  },
};

/**
 * Current locale setting
 */
let currentLocale: SupportedLocale = "en";

/**
 * Set the current locale
 *
 * @param locale - Locale code ('en', 'ru', or 'uz')
 *
 * @example
 * ```typescript
 * setLocale('uz') // Set Uzbek language
 * ```
 */
export function setLocale(locale: SupportedLocale): void {
  if (messages[locale]) {
    currentLocale = locale;
  } else {
    throw new Error(`Unsupported locale: ${locale}. Supported locales are: en, ru, uz`);
  }
}

/**
 * Get the current locale
 *
 * @returns Current locale code
 */
export function getLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * Get a localized error message
 *
 * @param key - Error message key
 * @param locale - Optional locale override (uses current locale if not specified)
 * @returns Localized error message
 *
 * @example
 * ```typescript
 * const msg = getErrorMessage('WRONG_PASSWORD') // Uses current locale
 * const msgRu = getErrorMessage('WRONG_PASSWORD', 'ru') // Forces Russian
 * ```
 */
export function getErrorMessage(
  key: ErrorMessageKey,
  locale?: SupportedLocale
): string {
  const effectiveLocale = locale ?? currentLocale;
  const localeMessages = messages[effectiveLocale];

  if (localeMessages && localeMessages[key]) {
    return localeMessages[key];
  }

  // Fallback to English if key not found in requested locale
  if (messages.en[key]) {
    return messages.en[key];
  }

  // Return the key itself as last resort
  return key;
}

/**
 * Get all supported locales
 *
 * @returns Array of supported locale codes
 */
export function getSupportedLocales(): SupportedLocale[] {
  return ["en", "ru", "uz"];
}

/**
 * Check if a locale is supported
 *
 * @param locale - Locale code to check
 * @returns True if the locale is supported
 */
export function isLocaleSupported(locale: string): locale is SupportedLocale {
  return locale === "en" || locale === "ru" || locale === "uz";
}

/**
 * Detect browser locale and set if supported
 *
 * @returns The detected and set locale, or 'en' if not supported
 */
export function detectAndSetBrowserLocale(): SupportedLocale {
  if (typeof navigator === "undefined") {
    return currentLocale;
  }

  const browserLang = navigator.language.split("-")[0];

  if (isLocaleSupported(browserLang)) {
    setLocale(browserLang);
    return browserLang;
  }

  return currentLocale;
}

/**
 * I18n utility object for convenient access
 */
export const i18n = {
  setLocale,
  getLocale,
  getErrorMessage,
  getSupportedLocales,
  isLocaleSupported,
  detectAndSetBrowserLocale,
};

export default i18n;
