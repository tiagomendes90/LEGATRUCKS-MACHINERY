
import 'react-i18next';
import { ReactNode } from 'react';

declare module 'react-i18next' {
  interface ReactI18NextChildren extends ReactNode {}
  
  // Extend the default namespace to include our translation keys
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: {
        nav: {
          home: string;
          trucks: string;
          machinery: string;
          agriculture: string;
          about: string;
          contact: string;
        };
        common: {
          loading: string;
          error: string;
          submit: string;
          cancel: string;
          save: string;
          edit: string;
          delete: string;
          search: string;
          filter: string;
          legarWebsite: string;
        };
        admin: {
          title: string;
          addVehicle: string;
          manageVehicles: string;
          analytics: string;
          orders: string;
          basicInfo: string;
          specifications: string;
          photosVideos: string;
          continueToSpecs: string;
        };
      };
    };
  }
}

// Ensure ReactI18NextChildren is compatible with ReactNode
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
