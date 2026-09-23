import { atom } from "../../app-jotai";

import type { AuthUser } from "../../data/backendAPI";

export type SyncStatus = "synced" | "syncing" | "offline";

export const currentUserAtom = atom<AuthUser | null>(null);

export const isAuthModalOpenAtom = atom<boolean>(false);

export const syncStatusAtom = atom<SyncStatus>("synced");

export interface MergePromptState {
  isOpen: boolean;
  localDocCount: number;
}

export const mergePromptAtom = atom<MergePromptState | null>(null);

export interface ConflictPromptState {
  isOpen: boolean;
  docId: string;
  docName: string;
}

export const conflictPromptAtom = atom<ConflictPromptState | null>(null);

