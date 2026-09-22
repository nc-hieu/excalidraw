import { useCallback, useEffect, useRef } from "react";
import { CaptureUpdateAction, deepCopyElement } from "@excalidraw/element";
import { debounce } from "@excalidraw/common";

import type {
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/element/types";

import { useAtom } from "../../app-jotai";
import {
  saveDocument,
  getDocument,
  deleteDocument,
  getAllDocumentsMetadata,
  generateId,
  createDefaultDocument,
  createNewPage,
  setActiveDocumentId,
  initDocuments,
  type ExcalidrawDocument,
  type ExcalidrawPage,
} from "../../data/documentsDB";

import {
  currentDocumentAtom,
  documentsListAtom,
  isDocModalOpenAtom,
} from "./documentsState";

export const useDocumentsManager = (
  excalidrawAPI: ExcalidrawImperativeAPI | null,
) => {
  const [currentDoc, setCurrentDoc] = useAtom(currentDocumentAtom);
  const [docsList, setDocsList] = useAtom(documentsListAtom);
  const [isDocModalOpen, setIsDocModalOpen] = useAtom(isDocModalOpenAtom);

  const currentDocRef = useRef<ExcalidrawDocument | null>(currentDoc);
  currentDocRef.current = currentDoc;

  const refreshDocsList = useCallback(async () => {
    const list = await getAllDocumentsMetadata();
    setDocsList(list);
  }, [setDocsList]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    initDocuments().then(async ({ activeDoc }) => {
      if (!isMounted) {
        return;
      }
      currentDocRef.current = activeDoc;
      setCurrentDoc(activeDoc);
      const list = await getAllDocumentsMetadata();
      if (isMounted) {
        setDocsList(list);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [setCurrentDoc, setDocsList]);

  // Debounced save to IndexedDB
  const debouncedSaveRef = useRef(
    debounce((doc: ExcalidrawDocument) => {
      if (doc) {
        saveDocument(doc);
      }
    }, 500),
  );

  const handleSceneChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
    ) => {
      const activeDoc = currentDocRef.current;
      if (!activeDoc) {
        return;
      }

      const activePage = activeDoc.pages.find(
        (p: ExcalidrawPage) => p.id === activeDoc.activePageId,
      );
      if (!activePage) {
        return;
      }

      const updatedPage: ExcalidrawPage = {
        ...activePage,
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
          zoom: appState.zoom,
          gridSize: appState.gridSize,
        },
        files,
        updatedAt: Date.now(),
      };

      const updatedDoc: ExcalidrawDocument = {
        ...activeDoc,
        pages: activeDoc.pages.map((p: ExcalidrawPage) =>
          p.id === activeDoc.activePageId ? updatedPage : p,
        ),
        updatedAt: Date.now(),
      };

      currentDocRef.current = updatedDoc;
      debouncedSaveRef.current(updatedDoc);
    },
    [],
  );

  const switchPage = useCallback(
    async (targetPageId: string) => {
      const doc = currentDocRef.current;
      if (!doc || !excalidrawAPI) {
        return;
      }
      if (doc.activePageId === targetPageId) {
        return;
      }

      // 1. Capture current scene state
      const currentElements = excalidrawAPI.getSceneElements();
      const currentAppState = excalidrawAPI.getAppState();
      const currentFiles = excalidrawAPI.getFiles();

      const updatedPages: ExcalidrawPage[] = doc.pages.map(
        (p: ExcalidrawPage) => {
          if (p.id === doc.activePageId) {
            return {
              ...p,
              elements: currentElements,
              appState: {
                viewBackgroundColor: currentAppState.viewBackgroundColor,
                scrollX: currentAppState.scrollX,
                scrollY: currentAppState.scrollY,
                zoom: currentAppState.zoom,
                gridSize: currentAppState.gridSize,
              },
              files: currentFiles,
              updatedAt: Date.now(),
            };
          }
          return p;
        },
      );

      const targetPage = updatedPages.find(
        (p: ExcalidrawPage) => p.id === targetPageId,
      );
      if (!targetPage) {
        return;
      }

      const newDoc: ExcalidrawDocument = {
        ...doc,
        pages: updatedPages,
        activePageId: targetPageId,
        updatedAt: Date.now(),
      };

      currentDocRef.current = newDoc;
      setCurrentDoc(newDoc);
      await saveDocument(newDoc);

      // 2. Load target page into Excalidraw
      if (targetPage.files && Object.keys(targetPage.files).length > 0) {
        excalidrawAPI.addFiles(Object.values(targetPage.files));
      }

      excalidrawAPI.updateScene({
        elements: targetPage.elements,
        appState: {
          ...targetPage.appState,
          isLoading: false,
        } as any,
        captureUpdate: CaptureUpdateAction.NEVER,
      });

      // Clear undo/redo stack
      excalidrawAPI.history.clear();
    },
    [excalidrawAPI, setCurrentDoc],
  );

  const addPage = useCallback(
    async (name?: string) => {
      const doc = currentDocRef.current;
      if (!doc || !excalidrawAPI) {
        return;
      }

      const currentElements = excalidrawAPI.getSceneElements();
      const currentAppState = excalidrawAPI.getAppState();
      const currentFiles = excalidrawAPI.getFiles();

      const updatedPages: ExcalidrawPage[] = doc.pages.map(
        (p: ExcalidrawPage) => {
          if (p.id === doc.activePageId) {
            return {
              ...p,
              elements: currentElements,
              appState: {
                viewBackgroundColor: currentAppState.viewBackgroundColor,
                scrollX: currentAppState.scrollX,
                scrollY: currentAppState.scrollY,
                zoom: currentAppState.zoom,
                gridSize: currentAppState.gridSize,
              },
              files: currentFiles,
              updatedAt: Date.now(),
            };
          }
          return p;
        },
      );

      const newPage = createNewPage(name || `Trang ${updatedPages.length + 1}`);
      const newDoc: ExcalidrawDocument = {
        ...doc,
        pages: [...updatedPages, newPage],
        activePageId: newPage.id,
        updatedAt: Date.now(),
      };

      currentDocRef.current = newDoc;
      setCurrentDoc(newDoc);
      await saveDocument(newDoc);
      await refreshDocsList();

      excalidrawAPI.updateScene({
        elements: [],
        appState: {
          isLoading: false,
          viewBackgroundColor: currentAppState.viewBackgroundColor,
          scrollX: 0,
          scrollY: 0,
          zoom: { value: 1 as any },
        } as any,
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      excalidrawAPI.history.clear();
    },
    [excalidrawAPI, refreshDocsList, setCurrentDoc],
  );

  const renamePage = useCallback(
    async (pageId: string, newName: string) => {
      const doc = currentDocRef.current;
      if (!doc || !newName.trim()) {
        return;
      }

      const updatedPages: ExcalidrawPage[] = doc.pages.map(
        (p: ExcalidrawPage) =>
          p.id === pageId
            ? { ...p, name: newName.trim(), updatedAt: Date.now() }
            : p,
      );

      const newDoc: ExcalidrawDocument = {
        ...doc,
        pages: updatedPages,
        updatedAt: Date.now(),
      };

      currentDocRef.current = newDoc;
      setCurrentDoc(newDoc);
      await saveDocument(newDoc);
    },
    [setCurrentDoc],
  );

  const duplicatePage = useCallback(
    async (pageId: string) => {
      const doc = currentDocRef.current;
      if (!doc || !excalidrawAPI) {
        return;
      }

      const currentElements = excalidrawAPI.getSceneElements();
      const currentAppState = excalidrawAPI.getAppState();
      const currentFiles = excalidrawAPI.getFiles();

      const targetPage = doc.pages.find((p: ExcalidrawPage) => p.id === pageId);
      if (!targetPage) {
        return;
      }

      const elementsToCopy =
        pageId === doc.activePageId ? currentElements : targetPage.elements;
      const filesToCopy =
        pageId === doc.activePageId ? currentFiles : targetPage.files;
      const appStateToCopy =
        pageId === doc.activePageId
          ? {
              viewBackgroundColor: currentAppState.viewBackgroundColor,
              scrollX: currentAppState.scrollX,
              scrollY: currentAppState.scrollY,
              zoom: currentAppState.zoom,
            }
          : targetPage.appState;

      const duplicatedElements = elementsToCopy.map((el: ExcalidrawElement) =>
        deepCopyElement(el),
      );

      const newPage: ExcalidrawPage = {
        id: generateId(),
        name: `${targetPage.name} (Bản sao)`,
        elements: duplicatedElements,
        appState: { ...appStateToCopy },
        files: filesToCopy ? { ...filesToCopy } : {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const targetIndex = doc.pages.findIndex(
        (p: ExcalidrawPage) => p.id === pageId,
      );
      const newPages = [...doc.pages];
      newPages.splice(targetIndex + 1, 0, newPage);

      const newDoc: ExcalidrawDocument = {
        ...doc,
        pages: newPages,
        activePageId: newPage.id,
        updatedAt: Date.now(),
      };

      currentDocRef.current = newDoc;
      setCurrentDoc(newDoc);
      await saveDocument(newDoc);
      await refreshDocsList();

      if (newPage.files && Object.keys(newPage.files).length > 0) {
        excalidrawAPI.addFiles(Object.values(newPage.files));
      }

      excalidrawAPI.updateScene({
        elements: newPage.elements,
        appState: {
          ...newPage.appState,
          isLoading: false,
        } as any,
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      excalidrawAPI.history.clear();
    },
    [excalidrawAPI, refreshDocsList, setCurrentDoc],
  );

  const deletePage = useCallback(
    async (pageId: string) => {
      const doc = currentDocRef.current;
      if (!doc || !excalidrawAPI) {
        return;
      }
      if (doc.pages.length <= 1) {
        return;
      }

      const pageIndex = doc.pages.findIndex(
        (p: ExcalidrawPage) => p.id === pageId,
      );
      if (pageIndex === -1) {
        return;
      }

      const newPages = doc.pages.filter((p: ExcalidrawPage) => p.id !== pageId);
      let nextActivePageId = doc.activePageId;
      let shouldUpdateCanvas = false;

      if (doc.activePageId === pageId) {
        const newActiveIndex = Math.max(0, pageIndex - 1);
        nextActivePageId = newPages[newActiveIndex].id;
        shouldUpdateCanvas = true;
      }

      const newDoc: ExcalidrawDocument = {
        ...doc,
        pages: newPages,
        activePageId: nextActivePageId,
        updatedAt: Date.now(),
      };

      currentDocRef.current = newDoc;
      setCurrentDoc(newDoc);
      await saveDocument(newDoc);
      await refreshDocsList();

      if (shouldUpdateCanvas) {
        const targetPage = newPages.find(
          (p: ExcalidrawPage) => p.id === nextActivePageId,
        )!;
        if (targetPage.files && Object.keys(targetPage.files).length > 0) {
          excalidrawAPI.addFiles(Object.values(targetPage.files));
        }
        excalidrawAPI.updateScene({
          elements: targetPage.elements,
          appState: {
            ...targetPage.appState,
            isLoading: false,
          } as any,
          captureUpdate: CaptureUpdateAction.NEVER,
        });
        excalidrawAPI.history.clear();
      }
    },
    [excalidrawAPI, refreshDocsList, setCurrentDoc],
  );

  const reorderPages = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const doc = currentDocRef.current;
      if (!doc) {
        return;
      }
      if (
        fromIndex < 0 ||
        fromIndex >= doc.pages.length ||
        toIndex < 0 ||
        toIndex >= doc.pages.length ||
        fromIndex === toIndex
      ) {
        return;
      }
      const newPages = [...doc.pages];
      const [moved] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, moved);

      const newDoc: ExcalidrawDocument = {
        ...doc,
        pages: newPages,
        updatedAt: Date.now(),
      };

      currentDocRef.current = newDoc;
      setCurrentDoc(newDoc);
      await saveDocument(newDoc);
    },
    [setCurrentDoc],
  );

  const switchDocument = useCallback(
    async (docId: string) => {
      if (!excalidrawAPI) {
        return;
      }
      const current = currentDocRef.current;
      if (current && current.id === docId) {
        return;
      }

      // 1. Snapshot current doc
      if (current) {
        const currentElements = excalidrawAPI.getSceneElements();
        const currentAppState = excalidrawAPI.getAppState();
        const currentFiles = excalidrawAPI.getFiles();

        const updatedPages: ExcalidrawPage[] = current.pages.map(
          (p: ExcalidrawPage) => {
            if (p.id === current.activePageId) {
              return {
                ...p,
                elements: currentElements,
                appState: {
                  viewBackgroundColor: currentAppState.viewBackgroundColor,
                  scrollX: currentAppState.scrollX,
                  scrollY: currentAppState.scrollY,
                  zoom: currentAppState.zoom,
                  gridSize: currentAppState.gridSize,
                },
                files: currentFiles,
                updatedAt: Date.now(),
              };
            }
            return p;
          },
        );

        await saveDocument({
          ...current,
          pages: updatedPages,
          updatedAt: Date.now(),
        });
      }

      // 2. Fetch target doc
      const targetDoc = await getDocument(docId);
      if (!targetDoc) {
        return;
      }

      await setActiveDocumentId(targetDoc.id);
      currentDocRef.current = targetDoc;
      setCurrentDoc(targetDoc);
      await refreshDocsList();

      // 3. Render active page
      const activePage =
        targetDoc.pages.find(
          (p: ExcalidrawPage) => p.id === targetDoc.activePageId,
        ) || targetDoc.pages[0];

      if (activePage.files && Object.keys(activePage.files).length > 0) {
        excalidrawAPI.addFiles(Object.values(activePage.files));
      }

      excalidrawAPI.updateScene({
        elements: activePage.elements,
        appState: {
          ...activePage.appState,
          isLoading: false,
        } as any,
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      excalidrawAPI.history.clear();
    },
    [excalidrawAPI, refreshDocsList, setCurrentDoc],
  );

  const createDocument = useCallback(
    async (name?: string) => {
      if (!excalidrawAPI) {
        return;
      }
      const current = currentDocRef.current;

      if (current) {
        const currentElements = excalidrawAPI.getSceneElements();
        const currentAppState = excalidrawAPI.getAppState();
        const currentFiles = excalidrawAPI.getFiles();

        const updatedPages: ExcalidrawPage[] = current.pages.map(
          (p: ExcalidrawPage) => {
            if (p.id === current.activePageId) {
              return {
                ...p,
                elements: currentElements,
                appState: {
                  viewBackgroundColor: currentAppState.viewBackgroundColor,
                  scrollX: currentAppState.scrollX,
                  scrollY: currentAppState.scrollY,
                  zoom: currentAppState.zoom,
                },
                files: currentFiles,
                updatedAt: Date.now(),
              };
            }
            return p;
          },
        );
        await saveDocument({
          ...current,
          pages: updatedPages,
          updatedAt: Date.now(),
        });
      }

      const list = await getAllDocumentsMetadata();
      const docName = name || `Bản vẽ ${list.length + 1}`;
      const newDoc = createDefaultDocument(docName);

      await saveDocument(newDoc);
      await setActiveDocumentId(newDoc.id);
      currentDocRef.current = newDoc;
      setCurrentDoc(newDoc);
      await refreshDocsList();

      excalidrawAPI.updateScene({
        elements: [],
        appState: {
          isLoading: false,
          scrollX: 0,
          scrollY: 0,
          zoom: { value: 1 as any },
        } as any,
        captureUpdate: CaptureUpdateAction.NEVER,
      });
      excalidrawAPI.history.clear();
    },
    [excalidrawAPI, refreshDocsList, setCurrentDoc],
  );

  const renameDocument = useCallback(
    async (docId: string, newName: string) => {
      if (!newName.trim()) {
        return;
      }
      const doc = await getDocument(docId);
      if (!doc) {
        return;
      }

      const updated: ExcalidrawDocument = {
        ...doc,
        name: newName.trim(),
        updatedAt: Date.now(),
      };
      await saveDocument(updated);

      if (currentDocRef.current && currentDocRef.current.id === docId) {
        currentDocRef.current = updated;
        setCurrentDoc(updated);
      }
      await refreshDocsList();
    },
    [refreshDocsList, setCurrentDoc],
  );

  const duplicateDocument = useCallback(
    async (docId: string) => {
      let sourceDoc: ExcalidrawDocument | null = null;
      const current = currentDocRef.current;

      if (current && current.id === docId && excalidrawAPI) {
        const currentElements = excalidrawAPI.getSceneElements();
        const currentAppState = excalidrawAPI.getAppState();
        const currentFiles = excalidrawAPI.getFiles();

        sourceDoc = {
          ...current,
          pages: current.pages.map((p: ExcalidrawPage) =>
            p.id === current.activePageId
              ? {
                  ...p,
                  elements: currentElements,
                  appState: {
                    viewBackgroundColor: currentAppState.viewBackgroundColor,
                    scrollX: currentAppState.scrollX,
                    scrollY: currentAppState.scrollY,
                    zoom: currentAppState.zoom,
                  },
                  files: currentFiles,
                  updatedAt: Date.now(),
                }
              : p,
          ),
        };
        await saveDocument(sourceDoc);
      } else {
        sourceDoc = await getDocument(docId);
      }

      if (!sourceDoc) {
        return;
      }

      const newDocId = generateId();
      const clonedPages: ExcalidrawPage[] = sourceDoc.pages.map(
        (p: ExcalidrawPage) => ({
          ...p,
          id: generateId(),
          elements: p.elements.map((el: ExcalidrawElement) =>
            deepCopyElement(el),
          ),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );

      const clonedDoc: ExcalidrawDocument = {
        id: newDocId,
        name: `${sourceDoc.name} (Bản sao)`,
        pages: clonedPages,
        activePageId: clonedPages[0].id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveDocument(clonedDoc);
      await refreshDocsList();
    },
    [excalidrawAPI, refreshDocsList],
  );

  const deleteDoc = useCallback(
    async (docId: string) => {
      await deleteDocument(docId);
      const remaining = await getAllDocumentsMetadata();
      setDocsList(remaining);

      const current = currentDocRef.current;
      if (current && current.id === docId) {
        if (remaining.length > 0) {
          await switchDocument(remaining[0].id);
        } else {
          const fallback = createDefaultDocument("Bản vẽ 1");
          await saveDocument(fallback);
          await setActiveDocumentId(fallback.id);
          currentDocRef.current = fallback;
          setCurrentDoc(fallback);
          await refreshDocsList();

          if (excalidrawAPI) {
            excalidrawAPI.updateScene({
              elements: [],
              appState: { isLoading: false } as any,
              captureUpdate: CaptureUpdateAction.NEVER,
            });
            excalidrawAPI.history.clear();
          }
        }
      }
    },
    [
      excalidrawAPI,
      refreshDocsList,
      setCurrentDoc,
      setDocsList,
      switchDocument,
    ],
  );

  return {
    currentDoc,
    docsList,
    isDocModalOpen,
    setIsDocModalOpen,
    switchPage,
    addPage,
    renamePage,
    duplicatePage,
    deletePage,
    reorderPages,
    switchDocument,
    createDocument,
    renameDocument,
    duplicateDocument,
    deleteDoc,
    handleSceneChange,
    refreshDocsList,
  };
};
