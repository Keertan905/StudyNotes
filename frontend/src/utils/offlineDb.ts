// StudyApp Native IndexedDB Wrapper for Offline Study Mode

export interface OfflineNote {
  id: number;
  subjectId?: number;
  subjectName?: string;
  unitId?: number;
  topicId?: number;
  title: string;
  content: string;
  academicLevel?: string;
  explanationStyle?: string;
  detailLevel?: string;
  createdAt: string;
  updatedAt: string;
  downloadedAt: string;
}

export interface OfflineFlashcard {
  id: number;
  subjectId?: number;
  subjectName?: string;
  unitId?: number;
  topicId?: number;
  front: string;
  back: string;
  hint?: string;
  difficulty?: string;
  intervalDays?: number;
  easeFactor?: number;
  repetitions?: number;
  nextReviewDate?: string;
  lastReviewedAt?: string;
  downloadedAt: string;
}

export interface OfflineDocument {
  id: number;
  subjectId?: number;
  subjectName?: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  pageCount?: number;
  summary?: string;
  chunks?: Array<{
    id: number;
    chunkIndex: number;
    pageNumber: number;
    sectionHeading?: string;
    chunkContent: string;
  }>;
  downloadedAt: string;
}

export interface PendingSyncItem {
  id?: number;
  syncId: string; // Client UUID
  actionType: "LOG_STUDY_SESSION" | "REVIEW_FLASHCARD";
  payload: any;
  createdAt: string;
  status: "PENDING" | "FAILED" | "AUTH_REQUIRED";
}

const DB_NAME = "StudyApp_OfflineDB";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getOfflineDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this browser"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Notes store
      if (!db.objectStoreNames.contains("notes")) {
        const notesStore = db.createObjectStore("notes", { keyPath: "id" });
        notesStore.createIndex("subjectId", "subjectId", { unique: false });
        notesStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }

      // Flashcards store
      if (!db.objectStoreNames.contains("flashcards")) {
        const flashcardsStore = db.createObjectStore("flashcards", { keyPath: "id" });
        flashcardsStore.createIndex("subjectId", "subjectId", { unique: false });
        flashcardsStore.createIndex("nextReviewDate", "nextReviewDate", { unique: false });
      }

      // Documents store
      if (!db.objectStoreNames.contains("documents")) {
        const docsStore = db.createObjectStore("documents", { keyPath: "id" });
        docsStore.createIndex("subjectId", "subjectId", { unique: false });
      }

      // Sync queue store
      if (!db.objectStoreNames.contains("syncQueue")) {
        const syncStore = db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
        syncStore.createIndex("syncId", "syncId", { unique: true });
        syncStore.createIndex("status", "status", { unique: false });
      }

      // Metadata store
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Generic transaction helper
async function performTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  const db = await getOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let req: IDBRequest<T> | void;

    try {
      req = action(store);
    } catch (err) {
      reject(err);
      return;
    }

    if (req) {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      tx.oncomplete = () => resolve(undefined as unknown as T);
    }
    tx.onerror = () => reject(tx.error);
  });
}

// ==================== NOTES CRUD ====================

export async function saveOfflineNotes(notes: OfflineNote[]): Promise<void> {
  const db = await getOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("notes", "readwrite");
    const store = tx.objectStore("notes");
    for (const note of notes) {
      store.put({ ...note, downloadedAt: new Date().toISOString() });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveOfflineNote(note: OfflineNote): Promise<void> {
  return performTx("notes", "readwrite", (store) => {
    store.put({ ...note, downloadedAt: new Date().toISOString() });
  });
}

export async function getOfflineNotes(): Promise<OfflineNote[]> {
  const db = await getOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("notes", "readonly");
    const store = tx.objectStore("notes");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineNote(id: number): Promise<OfflineNote | undefined> {
  return performTx("notes", "readonly", (store) => store.get(id));
}

export async function deleteOfflineNote(id: number): Promise<void> {
  return performTx("notes", "readwrite", (store) => {
    store.delete(id);
  });
}

// ==================== FLASHCARDS CRUD ====================

export async function saveOfflineFlashcards(cards: OfflineFlashcard[]): Promise<void> {
  const db = await getOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("flashcards", "readwrite");
    const store = tx.objectStore("flashcards");
    for (const card of cards) {
      store.put({ ...card, downloadedAt: new Date().toISOString() });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineFlashcards(): Promise<OfflineFlashcard[]> {
  const db = await getOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("flashcards", "readonly");
    const store = tx.objectStore("flashcards");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function updateOfflineFlashcardReview(cardId: number, rating: string): Promise<OfflineFlashcard | undefined> {
  const card = await performTx<OfflineFlashcard>("flashcards", "readonly", (store) => store.get(cardId));
  if (!card) return undefined;

  let prevInterval = card.intervalDays || 1;
  let prevEase = card.easeFactor || 2.5;
  let reps = card.repetitions || 0;
  let newInterval = 1;
  let newEase = prevEase;

  switch (rating) {
    case "AGAIN":
      reps = 0;
      newInterval = 1;
      newEase = Math.max(1.3, prevEase - 0.2);
      break;
    case "HARD":
      newInterval = Math.max(1, Math.round(prevInterval * 1.2));
      newEase = Math.max(1.3, prevEase - 0.15);
      break;
    case "GOOD":
      if (reps === 0) newInterval = 1;
      else if (reps === 1) newInterval = 6;
      else newInterval = Math.round(prevInterval * prevEase);
      reps++;
      break;
    case "EASY":
      if (reps === 0) newInterval = 3;
      else if (reps === 1) newInterval = 8;
      else newInterval = Math.round(prevInterval * prevEase * 1.3);
      reps++;
      newEase = prevEase + 0.15;
      break;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  const updated: OfflineFlashcard = {
    ...card,
    intervalDays: newInterval,
    easeFactor: Math.round(newEase * 100) / 100,
    repetitions: reps,
    nextReviewDate: nextDate.toISOString().split("T")[0],
    lastReviewedAt: new Date().toISOString(),
  };

  await performTx("flashcards", "readwrite", (store) => {
    store.put(updated);
  });

  return updated;
}

export async function deleteOfflineFlashcard(id: number): Promise<void> {
  return performTx("flashcards", "readwrite", (store) => {
    store.delete(id);
  });
}

// ==================== DOCUMENTS CRUD ====================

export async function saveOfflineDocument(doc: OfflineDocument): Promise<void> {
  return performTx("documents", "readwrite", (store) => {
    store.put({ ...doc, downloadedAt: new Date().toISOString() });
  });
}

export async function getOfflineDocuments(): Promise<OfflineDocument[]> {
  const db = await getOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("documents", "readonly");
    const store = tx.objectStore("documents");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineDocument(id: number): Promise<OfflineDocument | undefined> {
  return performTx("documents", "readonly", (store) => store.get(id));
}

export async function deleteOfflineDocument(id: number): Promise<void> {
  return performTx("documents", "readwrite", (store) => {
    store.delete(id);
  });
}

// ==================== SYNC QUEUE ====================

export async function queueOfflineAction(
  actionType: "LOG_STUDY_SESSION" | "REVIEW_FLASHCARD",
  payload: any
): Promise<PendingSyncItem> {
  const syncId = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const item: PendingSyncItem = {
    syncId,
    actionType,
    payload: { ...payload, syncId },
    createdAt: new Date().toISOString(),
    status: "PENDING",
  };

  const db = await getOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const req = store.add(item);
    req.onsuccess = () => resolve({ ...item, id: req.result as number });
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingSyncQueue(): Promise<PendingSyncItem[]> {
  const db = await getOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readonly");
    const store = tx.objectStore("syncQueue");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeSyncQueueItems(ids: number[]): Promise<void> {
  const db = await getOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    for (const id of ids) {
      store.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ==================== STORAGE & PURGE ====================

export async function clearAllOfflineData(): Promise<void> {
  const db = await getOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["notes", "flashcards", "documents", "syncQueue"], "readwrite");
    tx.objectStore("notes").clear();
    tx.objectStore("flashcards").clear();
    tx.objectStore("documents").clear();
    tx.objectStore("syncQueue").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineStorageDetails() {
  const notes = await getOfflineNotes();
  const flashcards = await getOfflineFlashcards();
  const documents = await getOfflineDocuments();
  const pendingSync = await getPendingSyncQueue();

  // Estimate JSON size in bytes
  const bytes = new Blob([
    JSON.stringify(notes),
    JSON.stringify(flashcards),
    JSON.stringify(documents),
    JSON.stringify(pendingSync),
  ]).size;

  let quotaBytes = 50 * 1024 * 1024; // 50MB default
  let usageBytes = bytes;

  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota) quotaBytes = estimate.quota;
      if (estimate.usage) usageBytes = Math.max(bytes, estimate.usage);
    } catch {
      // Use estimated blob size
    }
  }

  return {
    notesCount: notes.length,
    flashcardsCount: flashcards.length,
    documentsCount: documents.length,
    pendingSyncCount: pendingSync.length,
    bytesUsed: bytes,
    storageUsageBytes: usageBytes,
    storageQuotaBytes: quotaBytes,
    usedPercentage: Math.min(100, (usageBytes / quotaBytes) * 100),
  };
}
