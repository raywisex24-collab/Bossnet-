import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector) 
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, 
    },
    resources: {
      en: {
        translation: {
          messages: "MESSAGES",
          settings: "Chat Settings",
          theme: "Theme & Visuals",
          type_here: "Type a message...",
          online: "Online",
          save: "Save Changes"
        }
      },
      fr: {
        translation: {
          messages: "MESSAGES",
          settings: "Paramètres",
          theme: "Thème et Visuels",
          type_here: "Tapez un message...",
          online: "En ligne",
          save: "Enregistrer"
        }
      },
      // Adding Nigerian Pidgin for the Yenagoa vibe
      pcm: {
        translation: {
          messages: "CHATS",
          settings: "Settings",
          theme: "Change Style",
          type_here: "Write something...",
          online: "Dey online",
          save: "Keep am like dis"
        }
      }
    }
  });

export default i18n;
