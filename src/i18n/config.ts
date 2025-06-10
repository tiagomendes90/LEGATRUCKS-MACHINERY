
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        trucks: 'Trucks',
        machinery: 'Machinery',
        agriculture: 'Agriculture',
        about: 'About',
        contact: 'Contact'
      },
      notFound: {
        title: '404 - Page Not Found',
        message: 'The page you are looking for does not exist.',
        returnHome: 'Return Home'
      },
      vehicleDetails: {
        year: 'Year',
        mileage: 'Mileage',
        engine: 'Engine',
        horsepower: 'Horsepower',
        transmission: 'Transmission',
        category: 'Category',
        subcategory: 'Subcategory',
        description: 'Description',
        requestQuote: 'Request Quote',
        callNow: 'Call Now'
      },
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        contact: 'Contact Us',
        viewDetails: 'View Details',
        filter: 'Filter',
        resetFilters: 'Reset Filters',
        search: 'Search',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        submit: 'Submit',
        close: 'Close'
      },
      home: {
        heroTitle: 'Trucks & Machinery',
        heroSubtitle: 'Find the perfect vehicle for your business needs',
        trucksTitle: 'Trucks',
        trucksDescription: 'Heavy-duty trucks for all your transportation needs',
        machineryTitle: 'Machinery',
        machineryDescription: 'Construction and industrial machinery',
        tractorsTitle: 'Agriculture',
        tractorsDescription: 'Tractors and agricultural equipment',
        wantToSellTitle: 'Want to Sell?',
        wantToSellDescription: 'List your vehicle with us',
        featuredVehicles: 'Featured Vehicles',
        noFeaturedVehicles: 'No Featured Vehicles',
        noFeaturedDescription: 'Check back later for featured vehicles from our inventory.'
      },
      category: {
        trucks: {
          title: 'Trucks',
          description: 'Discover our extensive collection of trucks for all your commercial needs'
        },
        machinery: {
          title: 'Machinery',
          description: 'Professional construction and industrial machinery for your projects'
        },
        agriculture: {
          title: 'Agriculture',
          description: 'Tractors and agricultural equipment for modern farming'
        },
        categoryNotFound: 'Category not found',
        noVehicles: 'No vehicles found',
        adjustFilters: 'Try adjusting your filters to see more results'
      },
      admin: {
        title: 'Admin Dashboard',
        addNewVehicle: 'Add New Vehicle',
        inventory: 'Inventory',
        analytics: 'Analytics',
        orders: 'Orders',
        featuredTrucks: 'Featured Vehicles',
        totalVehicles: 'Total Vehicles',
        activeListings: 'Active Listings',
        totalValue: 'Total Value',
        monthlyViews: 'Monthly Views',
        recentlyAdded: 'Recently Added',
        category: 'Category',
        selectCategory: 'Select Category',
        subcategory: 'Subcategory',
        selectSubcategory: 'Select Subcategory',
        brand: 'Brand',
        selectBrand: 'Select Brand',
        model: 'Model',
        year: 'Year',
        minYear: 'Min Year',
        maxYear: 'Max Year',
        condition: 'Condition',
        selectCondition: 'Select Condition',
        new: 'New',
        used: 'Used',
        certified: 'Certified',
        refurbished: 'Refurbished',
        price: 'Price',
        minPrice: 'Min Price',
        maxPrice: 'Max Price',
        mileage: 'Mileage',
        engine: 'Engine',
        transmission: 'Transmission',
        description: 'Description',
        features: 'Features',
        location: 'Location',
        contactInfo: 'Contact Information',
        images: 'Images',
        uploadImages: 'Upload Images',
        dragDropImages: 'Drag and drop images here, or click to select',
        maxImages: 'Maximum 10 images allowed',
        videos: 'Videos',
        uploadVideos: 'Upload Videos',
        dragDropVideos: 'Drag and drop videos here, or click to select',
        maxVideos: 'Maximum 3 videos allowed',
        horsepower: 'Horsepower',
        fuelType: 'Fuel Type',
        addVehicle: 'Add Vehicle',
        updateVehicle: 'Update Vehicle',
        vehicleAdded: 'Vehicle added successfully!',
        vehicleUpdated: 'Vehicle updated successfully!',
        errorAddingVehicle: 'Error adding vehicle',
        errorUpdatingVehicle: 'Error updating vehicle',
        noVehiclesInventory: 'No vehicles in inventory',
        addFirstVehicle: 'Add your first vehicle to get started'
      },
      vehicle: {
        backToCatalog: 'Back to Catalog',
        specifications: 'Specifications',
        features: 'Features',
        contactSeller: 'Contact Seller',
        requestInfo: 'Request Information',
        vehicleNotFound: 'Vehicle not found',
        vehicleNotFoundDescription: 'The vehicle you are looking for does not exist or has been removed.'
      }
    }
  },
  pt: {
    translation: {
      nav: {
        home: 'Início',
        trucks: 'Camiões',
        machinery: 'Maquinaria',
        agriculture: 'Agricultura',
        about: 'Sobre',
        contact: 'Contacto'
      },
      notFound: {
        title: '404 - Página Não Encontrada',
        message: 'A página que procura não existe.',
        returnHome: 'Voltar ao Início'
      },
      vehicleDetails: {
        year: 'Ano',
        mileage: 'Quilometragem',
        engine: 'Motor',
        horsepower: 'Potência',
        transmission: 'Transmissão',
        category: 'Categoria',
        subcategory: 'Subcategoria',
        description: 'Descrição',
        requestQuote: 'Solicitar Orçamento',
        callNow: 'Ligar Agora'
      },
      common: {
        loading: 'Carregando...',
        error: 'Ocorreu um erro',
        contact: 'Contacte-nos',
        viewDetails: 'Ver Detalhes',
        filter: 'Filtrar',
        resetFilters: 'Limpar Filtros',
        search: 'Pesquisar',
        save: 'Guardar',
        cancel: 'Cancelar',
        edit: 'Editar',
        delete: 'Eliminar',
        back: 'Voltar',
        next: 'Próximo',
        previous: 'Anterior',
        submit: 'Submeter',
        close: 'Fechar'
      },
      home: {
        heroTitle: 'Camiões e Maquinaria',
        heroSubtitle: 'Encontre o veículo perfeito para as suas necessidades empresariais',
        trucksTitle: 'Camiões',
        trucksDescription: 'Camiões pesados para todas as suas necessidades de transporte',
        machineryTitle: 'Maquinaria',
        machineryDescription: 'Maquinaria de construção e industrial',
        tractorsTitle: 'Agricultura',
        tractorsDescription: 'Tratores e equipamento agrícola',
        wantToSellTitle: 'Quer Vender?',
        wantToSellDescription: 'Liste o seu veículo connosco',
        featuredVehicles: 'Veículos em Destaque',
        noFeaturedVehicles: 'Sem Veículos em Destaque',
        noFeaturedDescription: 'Volte mais tarde para ver veículos em destaque do nosso inventário.'
      },
      category: {
        trucks: {
          title: 'Camiões',
          description: 'Descubra a nossa extensa coleção de camiões para todas as suas necessidades comerciais'
        },
        machinery: {
          title: 'Maquinaria',
          description: 'Maquinaria profissional de construção e industrial para os seus projetos'
        },
        agriculture: {
          title: 'Agricultura',
          description: 'Tratores e equipamento agrícola para agricultura moderna'
        },
        categoryNotFound: 'Categoria não encontrada',
        noVehicles: 'Nenhum veículo encontrado',
        adjustFilters: 'Tente ajustar os seus filtros para ver mais resultados'
      },
      admin: {
        title: 'Painel de Administração',
        addNewVehicle: 'Adicionar Novo Veículo',
        inventory: 'Inventário',
        analytics: 'Análises',
        orders: 'Encomendas',
        featuredTrucks: 'Veículos em Destaque',
        totalVehicles: 'Total de Veículos',
        activeListings: 'Anúncios Ativos',
        totalValue: 'Valor Total',
        monthlyViews: 'Visualizações Mensais',
        recentlyAdded: 'Adicionados Recentemente',
        category: 'Categoria',
        selectCategory: 'Selecionar Categoria',
        subcategory: 'Subcategoria',
        selectSubcategory: 'Selecionar Subcategoria',
        brand: 'Marca',
        selectBrand: 'Selecionar Marca',
        model: 'Modelo',
        year: 'Ano',
        minYear: 'Ano Mínimo',
        maxYear: 'Ano Máximo',
        condition: 'Condição',
        selectCondition: 'Selecionar Condição',
        new: 'Novo',
        used: 'Usado',
        certified: 'Certificado',
        refurbished: 'Recondicionado',
        price: 'Preço',
        minPrice: 'Preço Mínimo',
        maxPrice: 'Preço Máximo',
        mileage: 'Quilometragem',
        engine: 'Motor',
        transmission: 'Transmissão',
        description: 'Descrição',
        features: 'Características',
        location: 'Localização',
        contactInfo: 'Informações de Contacto',
        images: 'Imagens',
        uploadImages: 'Carregar Imagens',
        dragDropImages: 'Arraste e solte imagens aqui, ou clique para selecionar',
        maxImages: 'Máximo 10 imagens permitidas',
        videos: 'Vídeos',
        uploadVideos: 'Carregar Vídeos',
        dragDropVideos: 'Arraste e solte vídeos aqui, ou clique para selecionar',
        maxVideos: 'Máximo 3 vídeos permitidos',
        horsepower: 'Potência',
        fuelType: 'Tipo de Combustível',
        addVehicle: 'Adicionar Veículo',
        updateVehicle: 'Atualizar Veículo',
        vehicleAdded: 'Veículo adicionado com sucesso!',
        vehicleUpdated: 'Veículo atualizado com sucesso!',
        errorAddingVehicle: 'Erro ao adicionar veículo',
        errorUpdatingVehicle: 'Erro ao atualizar veículo',
        noVehiclesInventory: 'Nenhum veículo no inventário',
        addFirstVehicle: 'Adicione o seu primeiro veículo para começar'
      },
      vehicle: {
        backToCatalog: 'Voltar ao Catálogo',
        specifications: 'Especificações',
        features: 'Características',
        contactSeller: 'Contactar Vendedor',
        requestInfo: 'Solicitar Informações',
        vehicleNotFound: 'Veículo não encontrado',
        vehicleNotFoundDescription: 'O veículo que procura não existe ou foi removido.'
      }
    }
  },
  es: {
    translation: {
      nav: {
        home: 'Inicio',
        trucks: 'Camiones',
        machinery: 'Maquinaria',
        agriculture: 'Agricultura',
        about: 'Acerca de',
        contact: 'Contacto'
      },
      notFound: {
        title: '404 - Página No Encontrada',
        message: 'La página que buscas no existe.',
        returnHome: 'Volver al Inicio'
      },
      vehicleDetails: {
        year: 'Año',
        mileage: 'Kilometraje',
        engine: 'Motor',
        horsepower: 'Potencia',
        transmission: 'Transmisión',
        category: 'Categoría',
        subcategory: 'Subcategoría',
        description: 'Descripción',
        requestQuote: 'Solicitar Cotización',
        callNow: 'Llamar Ahora'
      },
      common: {
        loading: 'Cargando...',
        error: 'Ha ocurrido un error',
        contact: 'Contáctanos',
        viewDetails: 'Ver Detalles',
        filter: 'Filtrar',
        resetFilters: 'Limpiar Filtros',
        search: 'Buscar',
        save: 'Guardar',
        cancel: 'Cancelar',
        edit: 'Editar',
        delete: 'Eliminar',
        back: 'Volver',
        next: 'Siguiente',
        previous: 'Anterior',
        submit: 'Enviar',
        close: 'Cerrar'
      },
      home: {
        heroTitle: 'Camiones y Maquinaria',
        heroSubtitle: 'Encuentra el vehículo perfecto para las necesidades de tu negocio',
        trucksTitle: 'Camiones',
        trucksDescription: 'Camiones pesados para todas tus necesidades de transporte',
        machineryTitle: 'Maquinaria',
        machineryDescription: 'Maquinaria de construcción e industrial',
        tractorsTitle: 'Agricultura',
        tractorsDescription: 'Tractores y equipos agrícolas',
        wantToSellTitle: '¿Quieres Vender?',
        wantToSellDescription: 'Anuncia tu vehículo con nosotros',
        featuredVehicles: 'Vehículos Destacados',
        noFeaturedVehicles: 'Sin Vehículos Destacados',
        noFeaturedDescription: 'Vuelve más tarde para ver vehículos destacados de nuestro inventario.'
      },
      category: {
        trucks: {
          title: 'Camiones',
          description: 'Descubre nuestra extensa colección de camiones para todas tus necesidades comerciales'
        },
        machinery: {
          title: 'Maquinaria',
          description: 'Maquinaria profesional de construcción e industrial para tus proyectos'
        },
        agriculture: {
          title: 'Agricultura',
          description: 'Tractores y equipos agrícolas para la agricultura moderna'
        },
        categoryNotFound: 'Categoría no encontrada',
        noVehicles: 'No se encontraron vehículos',
        adjustFilters: 'Intenta ajustar tus filtros para ver más resultados'
      },
      admin: {
        title: 'Panel de Administración',
        addNewVehicle: 'Agregar Nuevo Vehículo',
        inventory: 'Inventario',
        analytics: 'Análisis',
        orders: 'Pedidos',
        featuredTrucks: 'Vehículos Destacados',
        totalVehicles: 'Total de Vehículos',
        activeListings: 'Anuncios Activos',
        totalValue: 'Valor Total',
        monthlyViews: 'Vistas Mensuales',
        recentlyAdded: 'Agregados Recientemente',
        category: 'Categoría',
        selectCategory: 'Seleccionar Categoría',
        subcategory: 'Subcategoría',
        selectSubcategory: 'Seleccionar Subcategoría',
        brand: 'Marca',
        selectBrand: 'Seleccionar Marca',
        model: 'Modelo',
        year: 'Año',
        minYear: 'Año Mínimo',
        maxYear: 'Año Máximo',
        condition: 'Condición',
        selectCondition: 'Seleccionar Condición',
        new: 'Nuevo',
        used: 'Usado',
        certified: 'Certificado',
        refurbished: 'Reacondicionado',
        price: 'Precio',
        minPrice: 'Precio Mínimo',
        maxPrice: 'Precio Máximo',
        mileage: 'Kilometraje',
        engine: 'Motor',
        transmission: 'Transmisión',
        description: 'Descripción',
        features: 'Características',
        location: 'Ubicación',
        contactInfo: 'Información de Contacto',
        images: 'Imágenes',
        uploadImages: 'Subir Imágenes',
        dragDropImages: 'Arrastra y suelta imágenes aquí, o haz clic para seleccionar',
        maxImages: 'Máximo 10 imágenes permitidas',
        videos: 'Videos',
        uploadVideos: 'Subir Videos',
        dragDropVideos: 'Arrastra y suelta videos aquí, o haz clic para seleccionar',
        maxVideos: 'Máximo 3 videos permitidos',
        horsepower: 'Potencia',
        fuelType: 'Tipo de Combustible',
        addVehicle: 'Agregar Vehículo',
        updateVehicle: 'Actualizar Vehículo',
        vehicleAdded: '¡Vehículo agregado exitosamente!',
        vehicleUpdated: '¡Vehículo actualizado exitosamente!',
        errorAddingVehicle: 'Error al agregar vehículo',
        errorUpdatingVehicle: 'Error al actualizar vehículo',
        noVehiclesInventory: 'No hay vehículos en el inventario',
        addFirstVehicle: 'Agrega tu primer vehículo para comenzar'
      },
      vehicle: {
        backToCatalog: 'Volver al Catálogo',
        specifications: 'Especificaciones',
        features: 'Características',
        contactSeller: 'Contactar Vendedor',
        requestInfo: 'Solicitar Información',
        vehicleNotFound: 'Vehículo no encontrado',
        vehicleNotFoundDescription: 'El vehículo que buscas no existe o ha sido eliminado.'
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
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
