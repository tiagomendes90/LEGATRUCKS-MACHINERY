
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
        legarWebsite: "Lega Website",
        viewDetails: "View Details",
        getQuote: "Get Quote",
        contact: "Contact",
        browseInventory: "Browse Our Inventory",
        contactTeam: "Contact Our Team",
        readyToWork: "Ready to Work With Us?",
        experienceDifference: "Experience the LEGA difference. Let our expert team help you find the perfect truck for your business needs."
      },
      // Home page
      home: {
        heroTitle: "TRUCKS & MACHINERY",
        heroSubtitle: "100+ NEW TRUCKS AND MACHINES IN STOCK",
        featuredVehicles: "Featured Vehicles",
        noFeaturedVehicles: "No Featured Vehicles",
        noFeaturedDescription: "No vehicles are currently featured. Add some vehicles to your inventory or set featured vehicles in the admin panel.",
        trucksTitle: "TRUCKS",
        trucksDescription: "Robust vehicles for road transports for urban delivery.",
        machineryTitle: "MACHINERY",
        machineryDescription: "Essential equipment for construction and infrastructure.",
        tractorsTitle: "TRACTORS",
        tractorsDescription: "Agricultural solutions designed to boost productivity.",
        wantToSellTitle: "WANT TO SELL?",
        wantToSellDescription: "We buy used trucks, machinery, and agricultural equipment."
      },
      // Category pages
      category: {
        trucks: {
          title: "Trucks",
          description: "Robust vehicles for road transport — from tractor units for heavy loads to rigid and light trucks for urban delivery."
        },
        machinery: {
          title: "Machinery",
          description: "Essential equipment for construction and infrastructure — excavators, loaders, cranes, compactors, and more for digging, lifting, grading, and paving."
        },
        agriculture: {
          title: "Agriculture",
          description: "Agricultural solutions designed to boost productivity — harvesters, plows, seeders, and mowers for every stage of fieldwork."
        },
        showing: "Showing {{start}}-{{end}} of {{total}} vehicles",
        page: "Page {{current}} of {{total}}",
        noVehicles: "No vehicles match your current filters.",
        adjustFilters: "Try adjusting your search criteria or clear the filters.",
        categoryNotFound: "Category not found"
      },
      // About page
      about: {
        title: "About LEGA",
        subtitle: "For over two decades, we've been the trusted partner for businesses seeking premium commercial trucks. Our commitment to quality, service, and innovation has made us a leader in the industry.",
        stats: {
          yearsExperience: "Years Experience",
          trucksSold: "Trucks Sold",
          expertTeam: "Expert Team",
          supportAvailable: "Support Available"
        },
        ourStory: "Our Story",
        storyP1: "Founded in 2003 by industry veterans Mike Johnson and Sarah Chen, TruckHub began as a small dealership with a simple mission: provide businesses with reliable, high-quality commercial trucks backed by exceptional service.",
        storyP2: "What started as a modest operation has grown into a nationwide network, but our core values remain unchanged. We believe that every business deserves access to premium trucks that can handle their toughest challenges while delivering outstanding performance and value.",
        storyP3: "Today, we're proud to serve thousands of customers across the country, from small local businesses to large fleet operators, helping them find the perfect trucks to power their success.",
        ourValues: "Our Values",
        values: {
          quality: {
            title: "Quality Excellence",
            description: "We source only the highest quality trucks from trusted manufacturers, ensuring every vehicle meets our rigorous standards."
          },
          customer: {
            title: "Customer First",
            description: "Our customers are at the heart of everything we do. We build lasting relationships through exceptional service and support."
          },
          expert: {
            title: "Expert Service",
            description: "Our certified technicians provide comprehensive maintenance and repair services to keep your fleet running smoothly."
          },
          leadership: {
            title: "Industry Leadership",
            description: "We stay ahead of industry trends and innovations to provide our customers with the most advanced trucking solutions."
          }
        }
      },
      // Contact page
      contact: {
        title: "Contact Us",
        subtitle: "Ready to find your perfect vehicle? Get in touch with our expert team for personalized service and competitive pricing.",
        sendMessage: "Send Us a Message",
        fullName: "Full Name",
        emailAddress: "Email Address",
        phoneNumber: "Phone Number",
        companyName: "Company Name",
        interestedIn: "What are you interested in?",
        selectInterest: "Select your interest",
        interests: {
          buying: "Buying a Truck",
          selling: "Want to Sell My Vehicle",
          financing: "Financing Options",
          leasing: "Leasing Options",
          parts: "Parts & Service",
          warranty: "Warranty Information",
          tradeIn: "Trade-In Evaluation",
          fleet: "Fleet Solutions",
          insurance: "Insurance Services",
          general: "General Inquiry"
        },
        message: "Message",
        messagePlaceholder: "Please tell us more about your inquiry, requirements, or questions. We're here to help!",
        sendMessageBtn: "Send Message",
        messageSent: "Message Sent!",
        thankYou: "Thank you for your inquiry. Our team will contact you within 24 hours.",
        getInTouch: "Get in Touch",
        phone: "Phone",
        salesInquiries: "Sales & General Inquiries",
        email: "Email",
        respondWithin: "We'll respond within 24 hours",
        location: "Location",
        businessHours: "Business Hours",
        mondayFriday: "Mon - Fri: 8:00 AM - 6:00 PM",
        saturday: "Sat: 9:00 AM - 4:00 PM",
        sunday: "Sun: Closed",
        immediateAssistance: "Need Immediate Assistance?",
        urgentInquiries: "For urgent inquiries or immediate assistance, call our direct line:",
        callNow: "Call (555) 123-4567"
      },
      // Auth page
      auth: {
        adminAccess: "Admin Access",
        signInDescription: "Sign in to access the admin panel",
        email: "Email",
        password: "Password",
        signIn: "Sign In",
        signingIn: "Signing In...",
        signInFailed: "Sign In Failed",
        welcomeBack: "Welcome back!",
        signedInSuccessfully: "You have been signed in successfully."
      },
      // 404 page
      notFound: {
        title: "404",
        message: "Oops! Page not found",
        returnHome: "Return to Home"
      },
      // Admin
      admin: {
        title: "Admin Dashboard",
        welcome: "Welcome back",
        addVehicle: "Add Vehicle",
        manageVehicles: "Manage Vehicles",
        analytics: "Analytics",
        orders: "Orders",
        basicInfo: "Basic Information",
        specifications: "Technical Specifications",
        photosVideos: "Photos & Videos",
        continueToSpecs: "Continue to Specifications",
        inventory: "Inventory",
        featured: "Featured",
        totalInventory: "Total Inventory",
        totalValue: "Total Value",
        avgPrice: "Avg. Price",
        newVehicles: "New Vehicles",
        vehicleInventory: "Vehicle Inventory",
        manageInventoryDesc: "Manage your vehicle inventory and update availability",
        searchVehicles: "Search vehicles...",
        allConditions: "All Conditions",
        new: "New",
        used: "Used",
        certified: "Certified",
        refurbished: "Refurbished",
        noVehiclesFound: "No vehicles found matching your criteria.",
        signOut: "Sign Out",
        signedOut: "Signed Out",
        signOutSuccess: "You have been signed out successfully.",
        category: "Category",
        subcategory: "Subcategory",
        brand: "Brand",
        model: "Model",
        condition: "Condition",
        year: "Year",
        mileage: "Mileage",
        price: "Price ($)",
        engine: "Engine",
        transmission: "Transmission",
        horsepower: "Horsepower",
        description: "Description",
        selectCategory: "Select category first",
        selectSubcategory: "Select subcategory",
        selectBrand: "Select brand",
        selectCondition: "Select condition",
        selectEngine: "Select engine",
        selectTransmission: "Select transmission",
        descriptionPlaceholder: "Detailed description of the vehicle, features, and selling points...",
        addVehicleToInventory: "Add Vehicle to Inventory",
        addingVehicle: "Adding Vehicle...",
        continueToSpecifications: "Continue to Specifications",
        backToBasicInfo: "Back to Basic Information",
        continueToMedia: "Continue to Photos & Videos",
        addVehicleWithSpecs: "Add Vehicle with Specifications",
        vehiclePhotos: "Vehicle Photos",
        vehicleVideos: "Vehicle Videos",
        enterPhotoUrl: "Enter photo URL",
        enterVideoUrl: "Enter video URL",
        addPhoto: "Add Photo",
        addVideo: "Add Video",
        backToSpecs: "Back to Specifications",
        addVehicleWithMedia: "Add Vehicle with Media",
        trucks: "Trucks",
        machinery: "Machinery",
        agriculture: "Agriculture",
        manual: "Manual",
        automatic: "Automatic",
        automatedManual: "Automated Manual",
        cvt: "CVT",
        certifiedPreOwned: "Certified Pre-Owned"
      },
      // Footer
      footer: {
        subscribeNewsletter: "Subscribe to get latest news updates and informations",
        enterEmail: "Enter your email",
        info: "Info",
        termsOfService: "Terms of Service",
        privacyPolicy: "Privacy Policy",
        admin: "Admin",
        contact: "Contact",
        location: "Location",
        viewOnGoogleMaps: "View on Google Maps",
        allRightsReserved: "All rights reserved"
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
        legarWebsite: "Site Web Lega",
        viewDetails: "Voir Détails",
        getQuote: "Obtenir Devis",
        contact: "Contact",
        browseInventory: "Parcourir Notre Inventaire",
        contactTeam: "Contacter Notre Équipe",
        readyToWork: "Prêt à Travailler Avec Nous?",
        experienceDifference: "Découvrez la différence LEGA. Laissez notre équipe d'experts vous aider à trouver le camion parfait pour vos besoins professionnels."
      },
      // Home page
      home: {
        heroTitle: "CAMIONS ET MACHINES",
        heroSubtitle: "100+ NOUVEAUX CAMIONS ET MACHINES EN STOCK",
        featuredVehicles: "Véhicules en Vedette",
        noFeaturedVehicles: "Aucun Véhicule en Vedette",
        noFeaturedDescription: "Aucun véhicule n'est actuellement en vedette. Ajoutez des véhicules à votre inventaire ou définissez des véhicules en vedette dans le panneau d'administration.",
        trucksTitle: "CAMIONS",
        trucksDescription: "Véhicules robustes pour le transport routier et la livraison urbaine.",
        machineryTitle: "MACHINES",
        machineryDescription: "Équipements essentiels pour la construction et l'infrastructure.",
        tractorsTitle: "TRACTEURS",
        tractorsDescription: "Solutions agricoles conçues pour améliorer la productivité.",
        wantToSellTitle: "VOUS VOULEZ VENDRE?",
        wantToSellDescription: "Nous achetons des camions, machines et équipements agricoles d'occasion."
      },
      // Category pages
      category: {
        trucks: {
          title: "Camions",
          description: "Véhicules robustes pour le transport routier — des tracteurs pour charges lourdes aux camions rigides et légers pour la livraison urbaine."
        },
        machinery: {
          title: "Machines",
          description: "Équipements essentiels pour la construction et l'infrastructure — excavateurs, chargeurs, grues, compacteurs, et plus pour creuser, soulever, niveler et paver."
        },
        agriculture: {
          title: "Agriculture",
          description: "Solutions agricoles conçues pour améliorer la productivité — moissonneuses, charrues, semoirs et faucheuses pour chaque étape du travail des champs."
        },
        showing: "Affichage {{start}}-{{end}} de {{total}} véhicules",
        page: "Page {{current}} de {{total}}",
        noVehicles: "Aucun véhicule ne correspond à vos filtres actuels.",
        adjustFilters: "Essayez d'ajuster vos critères de recherche ou d'effacer les filtres.",
        categoryNotFound: "Catégorie non trouvée"
      },
      // About page
      about: {
        title: "À Propos de LEGA",
        subtitle: "Depuis plus de deux décennies, nous sommes le partenaire de confiance des entreprises à la recherche de camions commerciaux premium. Notre engagement envers la qualité, le service et l'innovation a fait de nous un leader de l'industrie.",
        stats: {
          yearsExperience: "Années d'Expérience",
          trucksSold: "Camions Vendus",
          expertTeam: "Équipe d'Experts",
          supportAvailable: "Support Disponible"
        },
        ourStory: "Notre Histoire",
        storyP1: "Fondée en 2003 par les vétérans de l'industrie Mike Johnson et Sarah Chen, TruckHub a commencé comme un petit concessionnaire avec une mission simple : fournir aux entreprises des camions commerciaux fiables et de haute qualité soutenus par un service exceptionnel.",
        storyP2: "Ce qui a commencé comme une opération modeste s'est développé en un réseau national, mais nos valeurs fondamentales restent inchangées. Nous croyons que chaque entreprise mérite l'accès à des camions premium qui peuvent gérer leurs défis les plus difficiles tout en offrant des performances et une valeur exceptionnelles.",
        storyP3: "Aujourd'hui, nous sommes fiers de servir des milliers de clients à travers le pays, des petites entreprises locales aux grands exploitants de flottes, les aidant à trouver les camions parfaits pour alimenter leur succès.",
        ourValues: "Nos Valeurs",
        values: {
          quality: {
            title: "Excellence Qualité",
            description: "Nous nous approvisionnons uniquement en camions de la plus haute qualité auprès de fabricants de confiance, garantissant que chaque véhicule répond à nos normes rigoureuses."
          },
          customer: {
            title: "Client d'Abord",
            description: "Nos clients sont au cœur de tout ce que nous faisons. Nous construisons des relations durables grâce à un service et un support exceptionnels."
          },
          expert: {
            title: "Service Expert",
            description: "Nos techniciens certifiés fournissent des services complets de maintenance et de réparation pour maintenir votre flotte en bon état de fonctionnement."
          },
          leadership: {
            title: "Leadership Industriel",
            description: "Nous restons à l'avant-garde des tendances et innovations de l'industrie pour fournir à nos clients les solutions de transport les plus avancées."
          }
        }
      },
      // Contact page
      contact: {
        title: "Nous Contacter",
        subtitle: "Prêt à trouver votre véhicule parfait? Contactez notre équipe d'experts pour un service personnalisé et des prix compétitifs.",
        sendMessage: "Nous Envoyer un Message",
        fullName: "Nom Complet",
        emailAddress: "Adresse E-mail",
        phoneNumber: "Numéro de Téléphone",
        companyName: "Nom de l'Entreprise",
        interestedIn: "Qu'est-ce qui vous intéresse?",
        selectInterest: "Sélectionnez votre intérêt",
        interests: {
          buying: "Acheter un Camion",
          selling: "Vendre Mon Véhicule",
          financing: "Options de Financement",
          leasing: "Options de Crédit-bail",
          parts: "Pièces et Service",
          warranty: "Informations sur la Garantie",
          tradeIn: "Évaluation d'Échange",
          fleet: "Solutions de Flotte",
          insurance: "Services d'Assurance",
          general: "Demande Générale"
        },
        message: "Message",
        messagePlaceholder: "Veuillez nous en dire plus sur votre demande, vos exigences ou vos questions. Nous sommes là pour vous aider!",
        sendMessageBtn: "Envoyer le Message",
        messageSent: "Message Envoyé!",
        thankYou: "Merci pour votre demande. Notre équipe vous contactera dans les 24 heures.",
        getInTouch: "Prendre Contact",
        phone: "Téléphone",
        salesInquiries: "Ventes et Demandes Générales",
        email: "E-mail",
        respondWithin: "Nous répondrons dans les 24 heures",
        location: "Emplacement",
        businessHours: "Heures d'Ouverture",
        mondayFriday: "Lun - Ven: 8h00 - 18h00",
        saturday: "Sam: 9h00 - 16h00",
        sunday: "Dim: Fermé",
        immediateAssistance: "Besoin d'Aide Immédiate?",
        urgentInquiries: "Pour les demandes urgentes ou une assistance immédiate, appelez notre ligne directe:",
        callNow: "Appeler (555) 123-4567"
      },
      // Auth page
      auth: {
        adminAccess: "Accès Administrateur",
        signInDescription: "Connectez-vous pour accéder au panneau d'administration",
        email: "E-mail",
        password: "Mot de Passe",
        signIn: "Se Connecter",
        signingIn: "Connexion...",
        signInFailed: "Échec de la Connexion",
        welcomeBack: "Bon Retour!",
        signedInSuccessfully: "Vous vous êtes connecté avec succès."
      },
      // 404 page
      notFound: {
        title: "404",
        message: "Oups! Page non trouvée",
        returnHome: "Retour à l'Accueil"
      },
      // Admin
      admin: {
        title: "Tableau de Bord Admin",
        welcome: "Bon retour",
        addVehicle: "Ajouter un Véhicule",
        manageVehicles: "Gérer les Véhicules",
        analytics: "Analyses",
        orders: "Commandes",
        basicInfo: "Informations de Base",
        specifications: "Spécifications Techniques",
        photosVideos: "Photos et Vidéos",
        continueToSpecs: "Continuer vers les Spécifications",
        inventory: "Inventaire",
        featured: "En Vedette",
        totalInventory: "Inventaire Total",
        totalValue: "Valeur Totale",
        avgPrice: "Prix Moyen",
        newVehicles: "Nouveaux Véhicules",
        vehicleInventory: "Inventaire de Véhicules",
        manageInventoryDesc: "Gérez votre inventaire de véhicules et mettez à jour la disponibilité",
        searchVehicles: "Rechercher des véhicules...",
        allConditions: "Toutes Conditions",
        new: "Nouveau",
        used: "Utilisé",
        certified: "Certifié",
        refurbished: "Remis à Neuf",
        noVehiclesFound: "Aucun véhicule trouvé correspondant à vos critères.",
        signOut: "Se Déconnecter",
        signedOut: "Déconnecté",
        signOutSuccess: "Vous avez été déconnecté avec succès.",
        category: "Catégorie",
        subcategory: "Sous-catégorie",
        brand: "Marque",
        model: "Modèle",
        condition: "État",
        year: "Année",
        mileage: "Kilométrage",
        price: "Prix (€)",
        engine: "Moteur",
        transmission: "Transmission",
        horsepower: "Puissance",
        description: "Description",
        selectCategory: "Sélectionnez d'abord la catégorie",
        selectSubcategory: "Sélectionnez la sous-catégorie",
        selectBrand: "Sélectionnez la marque",
        selectCondition: "Sélectionnez l'état",
        selectEngine: "Sélectionnez le moteur",
        selectTransmission: "Sélectionnez la transmission",
        descriptionPlaceholder: "Description détaillée du véhicule, caractéristiques et points de vente...",
        addVehicleToInventory: "Ajouter un Véhicule à l'Inventaire",
        addingVehicle: "Ajout du Véhicule...",
        continueToSpecifications: "Continuer vers les Spécifications",
        backToBasicInfo: "Retour aux Informations de Base",
        continueToMedia: "Continuer vers Photos et Vidéos",
        addVehicleWithSpecs: "Ajouter un Véhicule avec Spécifications",
        vehiclePhotos: "Photos du Véhicule",
        vehicleVideos: "Vidéos du Véhicule",
        enterPhotoUrl: "Entrez l'URL de la photo",
        enterVideoUrl: "Entrez l'URL de la vidéo",
        addPhoto: "Ajouter une Photo",
        addVideo: "Ajouter une Vidéo",
        backToSpecs: "Retour aux Spécifications",
        addVehicleWithMedia: "Ajouter un Véhicule avec Média",
        trucks: "Camions",
        machinery: "Machines",
        agriculture: "Agriculture",
        manual: "Manuel",
        automatic: "Automatique",
        automatedManual: "Manuel Automatisé",
        cvt: "CVT",
        certifiedPreOwned: "Certifié d'Occasion"
      },
      // Footer
      footer: {
        subscribeNewsletter: "Abonnez-vous pour recevoir les dernières nouvelles et informations",
        enterEmail: "Entrez votre e-mail",
        info: "Informations",
        termsOfService: "Conditions de Service",
        privacyPolicy: "Politique de Confidentialité",
        admin: "Admin",
        contact: "Contact",
        location: "Emplacement",
        viewOnGoogleMaps: "Voir sur Google Maps",
        allRightsReserved: "Tous droits réservés"
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
        legarWebsite: "Website Lega",
        viewDetails: "Ver Detalhes",
        getQuote: "Obter Orçamento",
        contact: "Contacto",
        browseInventory: "Navegar no Nosso Inventário",
        contactTeam: "Contactar a Nossa Equipa",
        readyToWork: "Pronto para Trabalhar Connosco?",
        experienceDifference: "Experimente a diferença LEGA. Deixe a nossa equipa de especialistas ajudá-lo a encontrar o camião perfeito para as suas necessidades empresariais."
      },
      // Home page
      home: {
        heroTitle: "CAMIÕES E MAQUINARIA",
        heroSubtitle: "100+ NOVOS CAMIÕES E MÁQUINAS EM STOCK",
        featuredVehicles: "Veículos em Destaque",
        noFeaturedVehicles: "Nenhum Veículo em Destaque",
        noFeaturedDescription: "Nenhum veículo está atualmente em destaque. Adicione alguns veículos ao seu inventário ou defina veículos em destaque no painel de administração.",
        trucksTitle: "CAMIÕES",
        trucksDescription: "Veículos robustos para transporte rodoviário e entrega urbana.",
        machineryTitle: "MAQUINARIA",
        machineryDescription: "Equipamento essencial para construção e infraestrutura.",
        tractorsTitle: "TRATORES",
        tractorsDescription: "Soluções agrícolas concebidas para aumentar a produtividade.",
        wantToSellTitle: "QUER VENDER?",
        wantToSellDescription: "Compramos camiões, maquinaria e equipamento agrícola usados."
      },
      // Category pages
      category: {
        trucks: {
          title: "Camiões",
          description: "Veículos robustos para transporte rodoviário — desde unidades tractoras para cargas pesadas a camiões rígidos e ligeiros para entrega urbana."
        },
        machinery: {
          title: "Maquinaria",
          description: "Equipamento essencial para construção e infraestrutura — escavadoras, carregadoras, guindastes, compactadores e mais para escavar, levantar, nivelar e pavimentar."
        },
        agriculture: {
          title: "Agricultura",
          description: "Soluções agrícolas concebidas para aumentar a produtividade — ceifeiras, arados, semeadores e cortadores para cada fase do trabalho de campo."
        },
        showing: "Mostrando {{start}}-{{end}} de {{total}} veículos",
        page: "Página {{current}} de {{total}}",
        noVehicles: "Nenhum veículo corresponde aos seus filtros atuais.",
        adjustFilters: "Tente ajustar os seus critérios de pesquisa ou limpar os filtros.",
        categoryNotFound: "Categoria não encontrada"
      },
      // About page
      about: {
        title: "Sobre a LEGA",
        subtitle: "Durante mais de duas décadas, temos sido o parceiro de confiança para empresas que procuram camiões comerciais premium. O nosso compromisso com a qualidade, serviço e inovação fez de nós um líder na indústria.",
        stats: {
          yearsExperience: "Anos de Experiência",
          trucksSold: "Camiões Vendidos",
          expertTeam: "Equipa de Especialistas",
          supportAvailable: "Suporte Disponível"
        },
        ourStory: "A Nossa História",
        storyP1: "Fundada em 2003 pelos veteranos da indústria Mike Johnson e Sarah Chen, a TruckHub começou como um pequeno concessionário com uma missão simples: fornecer às empresas camiões comerciais fiáveis e de alta qualidade apoiados por um serviço excecional.",
        storyP2: "O que começou como uma operação modesta cresceu para uma rede nacional, mas os nossos valores fundamentais permanecem inalterados. Acreditamos que todas as empresas merecem acesso a camiões premium que podem lidar com os seus desafios mais difíceis enquanto entregam desempenho e valor excepcionais.",
        storyP3: "Hoje, temos orgulho em servir milhares de clientes em todo o país, desde pequenas empresas locais a grandes operadores de frotas, ajudando-os a encontrar os camiões perfeitos para alimentar o seu sucesso.",
        ourValues: "Os Nossos Valores",
        values: {
          quality: {
            title: "Excelência em Qualidade",
            description: "Fornecemos apenas camiões da mais alta qualidade de fabricantes de confiança, garantindo que cada veículo atende aos nossos padrões rigorosos."
          },
          customer: {
            title: "Cliente em Primeiro",
            description: "Os nossos clientes estão no coração de tudo o que fazemos. Construímos relacionamentos duradouros através de um serviço e suporte excecionais."
          },
          expert: {
            title: "Serviço Especializado",
            description: "Os nossos técnicos certificados fornecem serviços abrangentes de manutenção e reparação para manter a sua frota a funcionar suavemente."
          },
          leadership: {
            title: "Liderança na Indústria",
            description: "Mantemo-nos à frente das tendências e inovações da indústria para fornecer aos nossos clientes as soluções de transporte mais avançadas."
          }
        }
      },
      // Contact page
      contact: {
        title: "Contacte-nos",
        subtitle: "Pronto para encontrar o seu veículo perfeito? Entre em contacto com a nossa equipa de especialistas para um serviço personalizado e preços competitivos.",
        sendMessage: "Envie-nos uma Mensagem",
        fullName: "Nome Completo",
        emailAddress: "Endereço de E-mail",
        phoneNumber: "Número de Telefone",
        companyName: "Nome da Empresa",
        interestedIn: "No que está interessado?",
        selectInterest: "Selecione o seu interesse",
        interests: {
          buying: "Comprar um Camião",
          selling: "Vender o Meu Veículo",
          financing: "Opções de Financiamento",
          leasing: "Opções de Leasing",
          parts: "Peças e Serviço",
          warranty: "Informações de Garantia",
          tradeIn: "Avaliação de Troca",
          fleet: "Soluções de Frota",
          insurance: "Serviços de Seguro",
          general: "Consulta Geral"
        },
        message: "Mensagem",
        messagePlaceholder: "Por favor, conte-nos mais sobre a sua consulta, requisitos ou questões. Estamos aqui para ajudar!",
        sendMessageBtn: "Enviar Mensagem",
        messageSent: "Mensagem Enviada!",
        thankYou: "Obrigado pela sua consulta. A nossa equipa contactá-lo-á dentro de 24 horas.",
        getInTouch: "Entre em Contacto",
        phone: "Telefone",
        salesInquiries: "Vendas e Consultas Gerais",
        email: "E-mail",
        respondWithin: "Responderemos dentro de 24 horas",
        location: "Localização",
        businessHours: "Horário de Funcionamento",
        mondayFriday: "Seg - Sex: 8:00 - 18:00",
        saturday: "Sáb: 9:00 - 16:00",
        sunday: "Dom: Fechado",
        immediateAssistance: "Precisa de Assistência Imediata?",
        urgentInquiries: "Para consultas urgentes ou assistência imediata, ligue para a nossa linha direta:",
        callNow: "Ligar (555) 123-4567"
      },
      // Auth page
      auth: {
        adminAccess: "Acesso de Administrador",
        signInDescription: "Inicie sessão para aceder ao painel de administração",
        email: "E-mail",
        password: "Palavra-passe",
        signIn: "Iniciar Sessão",
        signingIn: "A Iniciar Sessão...",
        signInFailed: "Falha no Início de Sessão",
        welcomeBack: "Bem-vindo de Volta!",
        signedInSuccessfully: "Iniciou sessão com sucesso."
      },
      // 404 page
      notFound: {
        title: "404",
        message: "Ups! Página não encontrada",
        returnHome: "Voltar ao Início"
      },
      // Admin
      admin: {
        title: "Painel de Administração",
        welcome: "Bem-vindo de volta",
        addVehicle: "Adicionar Veículo",
        manageVehicles: "Gerir Veículos",
        analytics: "Análises",
        orders: "Encomendas",
        basicInfo: "Informação Básica",
        specifications: "Especificações Técnicas",
        photosVideos: "Fotos e Vídeos",
        continueToSpecs: "Continuar para Especificações",
        inventory: "Inventário",
        featured: "Em Destaque",
        totalInventory: "Inventário Total",
        totalValue: "Valor Total",
        avgPrice: "Preço Médio",
        newVehicles: "Veículos Novos",
        vehicleInventory: "Inventário de Veículos",
        manageInventoryDesc: "Gerir o seu inventário de veículos e atualizar a disponibilidade",
        searchVehicles: "Pesquisar veículos...",
        allConditions: "Todas as Condições",
        new: "Novo",
        used: "Usado",
        certified: "Certificado",
        refurbished: "Renovado",
        noVehiclesFound: "Nenhum veículo encontrado que corresponda aos seus critérios.",
        signOut: "Terminar Sessão",
        signedOut: "Sessão Terminada",
        signOutSuccess: "Terminou a sessão com sucesso.",
        category: "Categoria",
        subcategory: "Subcategoria",
        brand: "Marca",
        model: "Modelo",
        condition: "Condição",
        year: "Ano",
        mileage: "Quilometragem",
        price: "Preço (€)",
        engine: "Motor",
        transmission: "Transmissão",
        horsepower: "Potência",
        description: "Descrição",
        selectCategory: "Selecione primeiro a categoria",
        selectSubcategory: "Selecione a subcategoria",
        selectBrand: "Selecione a marca",
        selectCondition: "Selecione a condição",
        selectEngine: "Selecione o motor",
        selectTransmission: "Selecione a transmissão",
        descriptionPlaceholder: "Descrição detalhada do veículo, características e pontos de venda...",
        addVehicleToInventory: "Adicionar Veículo ao Inventário",
        addingVehicle: "A Adicionar Veículo...",
        continueToSpecifications: "Continuar para Especificações",
        backToBasicInfo: "Voltar à Informação Básica",
        continueToMedia: "Continuar para Fotos e Vídeos",
        addVehicleWithSpecs: "Adicionar Veículo com Especificações",
        vehiclePhotos: "Fotos do Veículo",
        vehicleVideos: "Vídeos do Veículo",
        enterPhotoUrl: "Introduza o URL da foto",
        enterVideoUrl: "Introduza o URL do vídeo",
        addPhoto: "Adicionar Foto",
        addVideo: "Adicionar Vídeo",
        backToSpecs: "Voltar às Especificações",
        addVehicleWithMedia: "Adicionar Veículo com Média",
        trucks: "Camiões",
        machinery: "Maquinaria",
        agriculture: "Agricultura",
        manual: "Manual",
        automatic: "Automático",
        automatedManual: "Manual Automatizado",
        cvt: "CVT",
        certifiedPreOwned: "Certificado Usado"
      },
      // Footer
      footer: {
        subscribeNewsletter: "Subscreva para receber as últimas notícias e informações",
        enterEmail: "Introduza o seu e-mail",
        info: "Informações",
        termsOfService: "Termos de Serviço",
        privacyPolicy: "Política de Privacidade",
        admin: "Admin",
        contact: "Contacto",
        location: "Localização",
        viewOnGoogleMaps: "Ver no Google Maps",
        allRightsReserved: "Todos os direitos reservados"
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
