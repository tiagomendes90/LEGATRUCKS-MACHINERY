import type { VehicleFormData } from '@/hooks/useVehicleForm';

export const VEHICLE_DRAFT_EVENT = 'lega:vehicle-draft-updated';
export const VEHICLE_DRAFT_METADATA_KEY = 'lega:add-vehicle-draft:v2';

const LEGACY_DRAFT_METADATA_KEY = 'lega:add-vehicle-draft:v1';
const DB_NAME = 'lega-vehicle-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'draft-images';
const DRAFT_ID = 'add-product';

export type VehicleDraftMetadata = {
  formData: VehicleFormData;
  selectedCategoryId: string;
  currentTab: string;
  updatedAt: number;
  hasMainImage: boolean;
  secondaryImageCount: number;
};

type StoredDraftImage = {
  id: string;
  role: 'main' | 'secondary';
  order: number;
  name: string;
  type: string;
  lastModified: number;
  blob: Blob;
};

const hasBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const hasIndexedDb = () => typeof window !== 'undefined' && 'indexedDB' in window;

const emitDraftEvent = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(VEHICLE_DRAFT_EVENT, { detail: { hasDraft: hasVehicleDraft() } }));
};

const openDraftDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir rascunho'));
  });
};

const waitForTransaction = (transaction: IDBTransaction): Promise<void> => {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha na transação do rascunho'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Transação do rascunho cancelada'));
  });
};

export const isVehicleDraftMeaningful = (draft: VehicleDraftMetadata | null): draft is VehicleDraftMetadata => {
  if (!draft?.formData) return false;

  const data = draft.formData;
  return Boolean(
    draft.selectedCategoryId ||
    draft.currentTab !== 'basic' ||
    draft.hasMainImage ||
    draft.secondaryImageCount > 0 ||
    data.title.trim() ||
    data.description.trim() ||
    data.price.trim() ||
    data.year.trim() ||
    data.brand_id ||
    data.subcategory_id ||
    data.model.trim() ||
    data.location_country.trim() ||
    data.location_city.trim() ||
    data.stock_status !== 'disponivel' ||
    data.currency !== 'EUR' ||
    data.condition !== 'used' ||
    data.is_active !== true
  );
};

export const loadVehicleDraftMetadata = (): VehicleDraftMetadata | null => {
  if (!hasBrowserStorage()) return null;

  try {
    const raw = window.localStorage.getItem(VEHICLE_DRAFT_METADATA_KEY) ?? window.localStorage.getItem(LEGACY_DRAFT_METADATA_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<VehicleDraftMetadata>;
    if (!parsed?.formData) return null;

    const draft: VehicleDraftMetadata = {
      formData: parsed.formData as VehicleFormData,
      selectedCategoryId: parsed.selectedCategoryId ?? '',
      currentTab: parsed.currentTab ?? 'basic',
      updatedAt: parsed.updatedAt ?? Date.now(),
      hasMainImage: parsed.hasMainImage ?? false,
      secondaryImageCount: parsed.secondaryImageCount ?? 0,
    };

    return isVehicleDraftMeaningful(draft) ? draft : null;
  } catch {
    return null;
  }
};

export const hasVehicleDraft = () => isVehicleDraftMeaningful(loadVehicleDraftMetadata());

export const saveVehicleDraft = async ({
  formData,
  selectedCategoryId,
  currentTab,
  mainImage,
  secondaryImages,
}: {
  formData: VehicleFormData;
  selectedCategoryId: string;
  currentTab: string;
  mainImage: File | null;
  secondaryImages: File[];
}) => {
  if (!hasBrowserStorage()) return;

  const metadata: VehicleDraftMetadata = {
    formData,
    selectedCategoryId,
    currentTab,
    updatedAt: Date.now(),
    hasMainImage: !!mainImage,
    secondaryImageCount: secondaryImages.length,
  };

  if (!isVehicleDraftMeaningful(metadata)) {
    await clearVehicleDraft();
    return;
  }

  window.localStorage.setItem(VEHICLE_DRAFT_METADATA_KEY, JSON.stringify(metadata));
  window.localStorage.removeItem(LEGACY_DRAFT_METADATA_KEY);

  if (hasIndexedDb()) {
    const db = await openDraftDb();
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      if (mainImage) {
        store.put({
          id: `${DRAFT_ID}:main`,
          role: 'main',
          order: 0,
          name: mainImage.name,
          type: mainImage.type,
          lastModified: mainImage.lastModified,
          blob: mainImage,
        } satisfies StoredDraftImage);
      }

      secondaryImages.forEach((image, index) => {
        store.put({
          id: `${DRAFT_ID}:secondary:${index}`,
          role: 'secondary',
          order: index,
          name: image.name,
          type: image.type,
          lastModified: image.lastModified,
          blob: image,
        } satisfies StoredDraftImage);
      });

      await waitForTransaction(transaction);
    } finally {
      db.close();
    }
  }

  emitDraftEvent();
};

export const loadVehicleDraftImages = async (): Promise<{ mainImage: File | null; secondaryImages: File[] }> => {
  if (!hasIndexedDb()) return { mainImage: null, secondaryImages: [] };

  const db = await openDraftDb();
  try {
    const images = await new Promise<StoredDraftImage[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as StoredDraftImage[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error('Falha ao carregar imagens do rascunho'));
    });

    const toFile = (image: StoredDraftImage) => new File([image.blob], image.name, {
      type: image.type,
      lastModified: image.lastModified,
    });

    const main = images.find((image) => image.role === 'main');
    const secondaryImages = images
      .filter((image) => image.role === 'secondary')
      .sort((a, b) => a.order - b.order)
      .map(toFile);

    return { mainImage: main ? toFile(main) : null, secondaryImages };
  } finally {
    db.close();
  }
};

export const clearVehicleDraft = async () => {
  if (hasBrowserStorage()) {
    window.localStorage.removeItem(VEHICLE_DRAFT_METADATA_KEY);
    window.localStorage.removeItem(LEGACY_DRAFT_METADATA_KEY);
  }

  if (hasIndexedDb()) {
    const db = await openDraftDb();
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).clear();
      await waitForTransaction(transaction);
    } finally {
      db.close();
    }
  }

  emitDraftEvent();
};