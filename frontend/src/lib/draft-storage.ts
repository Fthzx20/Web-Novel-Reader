type StorageResult<T> = {
  value: T | null;
};

const DB_NAME = "malaztranslation";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open draft store."));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDraftDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error("Draft storage failed."));
  });
}

export async function loadDraft<T>(key: string): Promise<StorageResult<T>> {
  if (!key) {
    return { value: null };
  }
  if (canUseIndexedDb()) {
    try {
      const result = await withStore<T | undefined>("readonly", (store) => store.get(key));
      return { value: result ?? null };
    } catch {
      // fall back to localStorage
    }
  }
  if (typeof window === "undefined") {
    return { value: null };
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return { value: null };
  }
  try {
    return { value: JSON.parse(raw) as T };
  } catch {
    window.localStorage.removeItem(key);
    return { value: null };
  }
}

export async function saveDraft<T>(key: string, value: T): Promise<void> {
  if (!key) {
    return;
  }
  if (canUseIndexedDb()) {
    try {
      await withStore("readwrite", (store) => store.put(value, key));
      return;
    } catch {
      // fall back to localStorage
    }
  }
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function removeDraft(key: string): Promise<void> {
  if (!key) {
    return;
  }
  if (canUseIndexedDb()) {
    try {
      await withStore("readwrite", (store) => store.delete(key));
    } catch {
      // fall back to localStorage
    }
  }
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(key);
}
