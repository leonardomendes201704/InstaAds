import type { AdCategory, AdStyle, PublishTarget } from "@/lib/types";

const DB_NAME = "instaads-wizard";
const STORE = "draft";
const KEY = "current";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface WizardDraft {
  version: 1;
  adCategory: AdCategory;
  publishTarget: PublishTarget;
  adStyle: AdStyle;
  mainMessage: string;
  photoBase64: string;
  photoMimeType: string;
  photoName: string;
  savedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB indisponível."));
  });
}

export async function saveWizardDraft(draft: WizardDraft): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Falha ao salvar rascunho."));
    tx.objectStore(STORE).put(draft, KEY);
  });
  db.close();
}

export async function loadWizardDraft(): Promise<WizardDraft | null> {
  const db = await openDb();
  const draft = await new Promise<WizardDraft | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve((request.result as WizardDraft | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Falha ao ler rascunho."));
  });
  db.close();

  if (!draft || draft.version !== 1) return null;
  if (Date.now() - draft.savedAt > MAX_AGE_MS) {
    await clearWizardDraft();
    return null;
  }
  return draft;
}

export async function clearWizardDraft(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Falha ao limpar rascunho."));
    tx.objectStore(STORE).delete(KEY);
  });
  db.close();
}

export function draftToFile(draft: WizardDraft): File {
  const binary = atob(draft.photoBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], draft.photoName || "produto.jpg", {
    type: draft.photoMimeType || "image/jpeg",
  });
}
