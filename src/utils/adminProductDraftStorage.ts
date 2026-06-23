export const ADMIN_PRODUCT_DRAFT_EVENT = 'lega:admin-product-draft-updated';
export const ADMIN_PRODUCT_DRAFT_KEY = 'lega:admin-product-draft:v1';

const DB_NAME = 'lega-admin-product-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'pending-images';
const DRAFT_ID = 'new-product';

export type AdminProductDraftForm = {
  title: string;
  category_id: string;
  subcategory_id: string;
  brand_id: string;
  price: string;
  year: string;
  description: string;
  condition: string;
  model: string;
  location_city: string;
  location_country: string;
  currency: string;
};

export type AdminProductDraft = {
  form: AdminProductDraftForm;
  specValues: Record<string, unknown>;
  isFeatured: boolean;
  displayOrder: number;
  primaryIndex: number;
  pendingFileCount: number;
  updatedAt: number;
};

type StoredPendingImage = {
  id: string;
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
  window.dispatchEvent(new CustomEvent(ADMIN_PRODUCT_DRAFT_EVENT, { detail: { hasDraft: hasAdminProductDraft() } }));
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
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha ao guardar rascunho'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Rascunho cancelado'));
  });
};

export const isAdminProductDraftMeaningful = (draft: AdminProductDraft | null): draft is AdminProductDraft => {
  if (!draft?.form) return false;
  const form = draft.form;

  return Boolean(
    form.title.trim() ||
    form.category_id ||
    form.subcategory_id ||
    form.brand_id ||
    form.price.trim() ||
    form.year.trim() ||
    form.description.trim() ||
    form.model.trim() ||
    form.location_city.trim() ||
    form.location_country !== 'Portugal' ||
    form.currency !== 'EUR' ||
    form.condition !== 'used' ||
    Object.values(draft.specValues ?? {}).some((value) => value !== '' && value !== null && value !== undefined) ||
    draft.isFeatured ||
    draft.displayOrder !== 0 ||
    draft.pendingFileCount > 0
  );
};

export const loadAdminProductDraft = (): AdminProductDraft | null => {
  if (!hasBrowserStorage()) return null;

  try {
    const raw = window.localStorage.getItem(ADMIN_PRODUCT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminProductDraft;
    return isAdminProductDraftMeaningful(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const hasAdminProductDraft = () => isAdminProductDraftMeaningful(loadAdminProductDraft());

export const saveAdminProductDraftMetadata = (draft: Omit<AdminProductDraft, 'updatedAt'>) => {
  if (!hasBrowserStorage()) return;

  const nextDraft: AdminProductDraft = { ...draft, updatedAt: Date.now() };
  if (!isAdminProductDraftMeaningful(nextDraft)) return;

  window.localStorage.setItem(ADMIN_PRODUCT_DRAFT_KEY, JSON.stringify(nextDraft));
  emitDraftEvent();
};

export const saveAdminProductDraftImages = async (pendingFiles: File[]) => {
  if (!hasIndexedDb()) return;

  const db = await openDraftDb();
  try {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    pendingFiles.forEach((file, index) => {
      store.put({
        id: `${DRAFT_ID}:pending:${index}`,
        order: index,
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        blob: file,
      } satisfies StoredPendingImage);
    });

    await waitForTransaction(transaction);
  } finally {
    db.close();
  }
};

export const loadAdminProductDraftImages = async (): Promise<File[]> => {
  if (!hasIndexedDb()) return [];

  const db = await openDraftDb();
  try {
    const images = await new Promise<StoredPendingImage[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as StoredPendingImage[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error('Falha ao carregar imagens'));
    });

    return images
      .sort((a, b) => a.order - b.order)
      .map((image) => new File([image.blob], image.name, {
        type: image.type,
        lastModified: image.lastModified,
      }));
  } finally {
    db.close();
  }
};

export const clearAdminProductDraft = async () => {
  if (hasBrowserStorage()) {
    window.localStorage.removeItem(ADMIN_PRODUCT_DRAFT_KEY);
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