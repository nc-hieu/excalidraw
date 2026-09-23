import { createStore, get, set, del, entries } from "idb-keyval";

import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

import { importFromLocalStorage } from "./localStorage";

export interface ExcalidrawPage {
  id: string;
  name: string;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files?: BinaryFiles;
  createdAt: number;
  updatedAt: number;
}

export interface ExcalidrawDocument {
  id: string;
  name: string;
  pages: ExcalidrawPage[];
  activePageId: string;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  pageCount: number;
  createdAt: number;
  updatedAt: number;
}

// Single store avoids any IDB transaction collision or missing object store bugs
const docsStore = createStore("excalidraw-documents-v1", "documents");
const ACTIVE_DOC_KEY = "__active_document_id__";

export const generateId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36).substring(4)
  );
};

export const createDefaultDocument = (
  name = "Drawing 1",
): ExcalidrawDocument => {
  const pageId = generateId();
  const docId = generateId();
  const now = Date.now();
  return {
    id: docId,
    name,
    pages: [
      {
        id: pageId,
        name: "Page 1",
        elements: [],
        appState: {},
        files: {},
        createdAt: now,
        updatedAt: now,
      },
    ],
    activePageId: pageId,
    createdAt: now,
    updatedAt: now,
  };
};

export const createNewPage = (name: string): ExcalidrawPage => {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    elements: [],
    appState: {},
    files: {},
    createdAt: now,
    updatedAt: now,
  };
};

export const getActiveDocumentId = async (): Promise<string | null> => {
  try {
    return (await get<string>(ACTIVE_DOC_KEY, docsStore)) || null;
  } catch (error) {
    console.error("Error reading active document ID:", error);
    return null;
  }
};

export const setActiveDocumentId = async (id: string): Promise<void> => {
  try {
    await set(ACTIVE_DOC_KEY, id, docsStore);
  } catch (error) {
    console.error("Error setting active document ID:", error);
  }
};

export const getDocument = async (
  id: string,
): Promise<ExcalidrawDocument | null> => {
  try {
    const doc = await get<ExcalidrawDocument>(id, docsStore);
    return doc || null;
  } catch (error) {
    console.error(`Error loading document ${id}:`, error);
    return null;
  }
};

export const saveDocument = async (doc: ExcalidrawDocument): Promise<void> => {
  try {
    const updatedDoc: ExcalidrawDocument = {
      ...doc,
      updatedAt: Date.now(),
    };
    await set(doc.id, updatedDoc, docsStore);
  } catch (error) {
    console.error(`Error saving document ${doc.id}:`, error);
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  try {
    await del(id, docsStore);
  } catch (error) {
    console.error(`Error deleting document ${id}:`, error);
  }
};

export const getAllDocuments = async (): Promise<ExcalidrawDocument[]> => {
  try {
    const docEntries = await entries<string, ExcalidrawDocument>(docsStore);
    return docEntries
      .filter(([key]) => key !== ACTIVE_DOC_KEY && typeof key === "string")
      .map(([, doc]) => doc)
      .filter((doc): doc is ExcalidrawDocument =>
        Boolean(doc && doc.id && doc.pages),
      )
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (error) {
    console.error("Error getting all documents:", error);
    return [];
  }
};

export const getAllDocumentsMetadata = async (): Promise<
  DocumentMetadata[]
> => {
  try {
    const docList = await getAllDocuments();
    return docList.map((doc) => ({
      id: doc.id,
      name: doc.name,
      pageCount: doc.pages.length,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  } catch (error) {
    console.error("Error getting document metadata:", error);
    return [];
  }
};

export const initDocuments = async (): Promise<{
  activeDoc: ExcalidrawDocument;
  isInitialMigration: boolean;
}> => {
  try {
    const existingDocs = await getAllDocuments();
    if (existingDocs.length > 0) {
      const activeId = await getActiveDocumentId();
      let activeDoc = existingDocs.find((d) => d.id === activeId);
      if (!activeDoc) {
        activeDoc = existingDocs[0];
        await setActiveDocumentId(activeDoc.id);
      }
      return { activeDoc, isInitialMigration: false };
    }

    // No existing docs -> Check migration from localStorage
    const local = importFromLocalStorage();
    const now = Date.now();
    let initialDoc: ExcalidrawDocument;

    if (local.elements && local.elements.length > 0) {
      const pageId = generateId();
      const docId = generateId();
      initialDoc = {
        id: docId,
        name: "Drawing 1",
        pages: [
          {
            id: pageId,
            name: "Page 1",
            elements: local.elements,
            appState: local.appState || {},
            files: {},
            createdAt: now,
            updatedAt: now,
          },
        ],
        activePageId: pageId,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      initialDoc = createDefaultDocument("Drawing 1");
    }

    await saveDocument(initialDoc);
    await setActiveDocumentId(initialDoc.id);
    return { activeDoc: initialDoc, isInitialMigration: true };
  } catch (error) {
    console.error("Error during documents initialization:", error);
    const fallbackDoc = createDefaultDocument("Drawing 1");
    return { activeDoc: fallbackDoc, isInitialMigration: false };
  }
};
