
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
          viewDetails: string;
          getQuote: string;
          contact: string;
          browseInventory: string;
          contactTeam: string;
          readyToWork: string;
          experienceDifference: string;
          back: string;
        };
        home: {
          heroTitle: string;
          heroSubtitle: string;
          featuredVehicles: string;
          noFeaturedVehicles: string;
          noFeaturedDescription: string;
          trucksTitle: string;
          trucksDescription: string;
          machineryTitle: string;
          machineryDescription: string;
          tractorsTitle: string;
          tractorsDescription: string;
          wantToSellTitle: string;
          wantToSellDescription: string;
        };
        category: {
          trucks: {
            title: string;
            description: string;
          };
          machinery: {
            title: string;
            description: string;
          };
          agriculture: {
            title: string;
            description: string;
          };
          showing: string;
          page: string;
          noVehicles: string;
          adjustFilters: string;
          categoryNotFound: string;
        };
        about: {
          title: string;
          subtitle: string;
          stats: {
            yearsExperience: string;
            trucksSold: string;
            expertTeam: string;
            supportAvailable: string;
          };
          ourStory: string;
          storyP1: string;
          storyP2: string;
          storyP3: string;
          ourValues: string;
          values: {
            quality: {
              title: string;
              description: string;
            };
            customer: {
              title: string;
              description: string;
            };
            expert: {
              title: string;
              description: string;
            };
            leadership: {
              title: string;
              description: string;
            };
          };
        };
        contact: {
          title: string;
          subtitle: string;
          sendMessage: string;
          fullName: string;
          emailAddress: string;
          phoneNumber: string;
          companyName: string;
          interestedIn: string;
          selectInterest: string;
          interests: {
            buying: string;
            selling: string;
            financing: string;
            leasing: string;
            parts: string;
            warranty: string;
            tradeIn: string;
            fleet: string;
            insurance: string;
            general: string;
          };
          message: string;
          messagePlaceholder: string;
          sendMessageBtn: string;
          messageSent: string;
          thankYou: string;
          getInTouch: string;
          phone: string;
          salesInquiries: string;
          email: string;
          respondWithin: string;
          location: string;
          businessHours: string;
          mondayFriday: string;
          saturday: string;
          sunday: string;
          immediateAssistance: string;
          urgentInquiries: string;
          callNow: string;
        };
        auth: {
          adminAccess: string;
          signInDescription: string;
          email: string;
          password: string;
          signIn: string;
          signingIn: string;
          signInFailed: string;
          welcomeBack: string;
          signedInSuccessfully: string;
        };
        notFound: {
          title: string;
          message: string;
          returnHome: string;
        };
        admin: {
          title: string;
          welcome: string;
          addVehicle: string;
          manageVehicles: string;
          analytics: string;
          orders: string;
          basicInfo: string;
          specifications: string;
          photosVideos: string;
          continueToSpecs: string;
          inventory: string;
          featured: string;
          totalInventory: string;
          totalValue: string;
          avgPrice: string;
          newVehicles: string;
          vehicleInventory: string;
          manageInventoryDesc: string;
          searchVehicles: string;
          allConditions: string;
          new: string;
          used: string;
          certified: string;
          refurbished: string;
          noVehiclesFound: string;
          signOut: string;
          signedOut: string;
          signOutSuccess: string;
          category: string;
          subcategory: string;
          brand: string;
          model: string;
          condition: string;
          year: string;
          mileage: string;
          price: string;
          engine: string;
          transmission: string;
          horsepower: string;
          description: string;
          selectCategory: string;
          selectSubcategory: string;
          selectBrand: string;
          selectCondition: string;
          selectEngine: string;
          selectTransmission: string;
          descriptionPlaceholder: string;
          addVehicleToInventory: string;
          addingVehicle: string;
          continueToSpecifications: string;
          backToBasicInfo: string;
          continueToMedia: string;
          addVehicleWithSpecs: string;
          vehiclePhotos: string;
          vehicleVideos: string;
          enterPhotoUrl: string;
          enterVideoUrl: string;
          addPhoto: string;
          addVideo: string;
          backToSpecs: string;
          addVehicleWithMedia: string;
          trucks: string;
          machinery: string;
          agriculture: string;
          manual: string;
          automatic: string;
          automatedManual: string;
          cvt: string;
          certifiedPreOwned: string;
        };
        footer: {
          subscribeNewsletter: string;
          enterEmail: string;
          info: string;
          termsOfService: string;
          privacyPolicy: string;
          admin: string;
          contact: string;
          location: string;
          viewOnGoogleMaps: string;
          allRightsReserved: string;
        };
        vehicleDetails: {
          specifications: string;
          features: string;
          description: string;
          contactForPrice: string;
          requestQuote: string;
          callNow: string;
          sendEmail: string;
          shareVehicle: string;
          printDetails: string;
          similarVehicles: string;
          vehicleLocation: string;
          financing: string;
          warranty: string;
          inspection: string;
          history: string;
          overview: string;
          engine: string;
          transmission: string;
          year: string;
          mileage: string;
          condition: string;
          horsepower: string;
          fuelType: string;
          drivetrain: string;
          category: string;
          subcategory: string;
          brand: string;
          model: string;
          price: string;
          hours: string;
          operatingHours: string;
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
