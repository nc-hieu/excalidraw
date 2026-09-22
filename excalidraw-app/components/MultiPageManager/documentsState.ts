import { atom } from "../../app-jotai";

import type {
  ExcalidrawDocument,
  DocumentMetadata,
} from "../../data/documentsDB";

export const currentDocumentAtom = atom<ExcalidrawDocument | null>(null);
export const documentsListAtom = atom<DocumentMetadata[]>([]);
export const isDocModalOpenAtom = atom<boolean>(false);
