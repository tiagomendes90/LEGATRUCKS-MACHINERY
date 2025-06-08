
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: "Home",
        trucks: "Trucks",
        machinery: "Machinery",
        agriculture: "Agriculture",
        about: "About",
        contact: "Contact"
      },
      // Common
      common: {
        loading: "Loading...",
        error: "Error",
        submit: "Submit",
        cancel: "Cancel",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        search: "Search",
        filter: "Filter",
        legarWebsite: "Lega Website"
      },
      // Admin
      admin: {
        title: "Admin Dashboard",
        addVehicle: "Add Vehicle",
        manageVehicles: "Manage Vehicles",
        analytics: "Analytics",
        orders: "Orders",
        basicInfo: "Basic Information",
        specifications: "Technical Specifications",
        photosVideos: "Photos & Videos",
        continueToSpecs: "Continue to Specifications"
      }
    }
  },
  fr: {
    translation: {
      // Navigation
      nav: {
        home: "Accueil",
        trucks: "Camions",
        machinery: "Machines",
        agriculture: "Agriculture",
        about: "À propos",
        contact: "Contact"
      },
      // Common
      common: {
        loading: "Chargement...",
        error: "Erreur",
        submit: "Soumettre",
        cancel: "Annuler",
        save: "Sauvegarder",
        edit: "Modifier",
        delete: "Supprimer",
        search: "Rechercher",
        filter: "Filtrer",
        legarWebsite: "Site Web Lega"
      },
      // Admin
      admin: {
        title: "Tableau de Bord Admin",
        addVehicle: "Ajouter un Véhicule",
        manageVehicles: "Gérer les Véhicules",
        analytics: "Analyses",
        orders: "Commandes",
        basicInfo: "Informations de Base",
        specifications: "Spécifications Techniques",
        photosVideos: "Photos et Vidéos",
        continueToSpecs: "Continuer vers les Spécifications"
      }
    }
  },
  pt: {
    translation: {
      // Navigation
      nav: {
        home: "Início",
        trucks: "Camiões",
        machinery: "Maquinaria",
        agriculture: "Agricultura",
        about: "Sobre",
        contact: "Contacto"
      },
      // Common
      common: {
        loading: "Carregando...",
        error: "Erro",
        submit: "Submeter",
        cancel: "Cancelar",
        save: "Guardar",
        edit: "Editar",
        delete: "Eliminar",
        search: "Pesquisar",
        filter: "Filtrar",
        legarWebsite: "Website Lega"
      },
      // Admin
      admin: {
        title: "Painel de Administração",
        addVehicle: "Adicionar Veículo",
        manageVehicles: "Gerir Veículos",
        analytics: "Análises",
        orders: "Encomendas",
        basicInfo: "Informação Básica",
        specifications: "Especificações Técnicas",
        photosVideos: "Fotos e Vídeos",
        continueToSpecs: "Continuar para Especificações"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
