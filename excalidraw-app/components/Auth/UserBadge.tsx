import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";

import { useAtom, useSetAtom } from "../../app-jotai";

import { clearAuthToken, getMe } from "../../data/backendAPI";

import {
  currentUserAtom,
  isAuthModalOpenAtom,
  syncStatusAtom,
  mergePromptAtom,
  conflictPromptAtom,
} from "./authState";

import "./UserBadge.scss";

interface UserBadgeProps {
  onSyncNow?: () => void;
  onMergeConfirm?: () => void;
  onMergeCancel?: () => void;
  onConflictFork?: () => void;
  onConflictReset?: () => void;
}

// Icons
const CloudCheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    <polyline points="9 13 12 16 17 11" />
  </svg>
);

const CloudSpinIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const CloudOfflineIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m2 2 20 20M5 17.82A7 7 0 0 1 9 5c1.1 0 2.14.26 3.07.72M17.5 19H9M20 16.58A4.5 4.5 0 0 0 17.5 10h-1.79" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const UserBadge: React.FC<UserBadgeProps> = ({
  onSyncNow,
  onMergeConfirm,
  onMergeCancel,
  onConflictFork,
  onConflictReset,
}) => {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const setIsAuthModalOpen = useSetAtom(isAuthModalOpenAtom);
  const [syncStatus] = useAtom(syncStatusAtom);
  const [mergePrompt, setMergePrompt] = useAtom(mergePromptAtom);
  const [conflictPrompt, setConflictPrompt] = useAtom(conflictPromptAtom);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;
    getMe().then((user) => {
      if (isMounted && user) {
        setCurrentUser(user);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [setCurrentUser]);

  // Click outside to close dropdown
  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const doc = containerRef.current?.ownerDocument || document;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    doc.addEventListener("pointerdown", handlePointerDown);
    return () => {
      doc.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setIsDropdownOpen(false);
  };

  const syncTitle =
    syncStatus === "synced"
      ? "Cloud synced securely"
      : syncStatus === "syncing"
      ? "Saving to Cloud..."
      : "Offline mode (saved locally)";

  return (
    <div ref={containerRef} className="excalidraw-user-badge-container">
      {/* Cloud Sync Indicator */}
      {currentUser && (
        <div
          className={clsx("cloud-sync-indicator", {
            "cloud-sync-indicator--synced": syncStatus === "synced",
            "cloud-sync-indicator--syncing": syncStatus === "syncing",
            "cloud-sync-indicator--offline": syncStatus === "offline",
          })}
          title={syncTitle}
          onClick={onSyncNow}
        >
          {syncStatus === "synced" && <CloudCheckIcon />}
          {syncStatus === "syncing" && <CloudSpinIcon />}
          {syncStatus === "offline" && <CloudOfflineIcon />}
        </div>
      )}

      {/* User Button */}
      {currentUser ? (
        <button
          type="button"
          className="excalidraw-auth-btn"
          title={`Account: ${currentUser.email}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="excalidraw-auth-btn__avatar">
            {currentUser.name ? currentUser.name[0] : currentUser.email[0]}
          </div>
          <span className="excalidraw-auth-btn__name">
            {currentUser.name || currentUser.email.split("@")[0]}
          </span>
        </button>
      ) : (
        <button
          type="button"
          className="excalidraw-auth-btn"
          title="Sign in to sync drawings across devices"
          onClick={() => setIsAuthModalOpen(true)}
        >
          <UserIcon />
          <span className="excalidraw-auth-btn__text">Sign in</span>
        </button>
      )}

      {/* Dropdown Menu */}
      {isDropdownOpen && currentUser && (
        <div className="user-badge-dropdown">
          <div className="user-badge-dropdown__header">
            <span className="user-badge-dropdown__user-name">
              {currentUser.name || "User"}
            </span>
            <span className="user-badge-dropdown__user-email">
              {currentUser.email}
            </span>
          </div>

          <div className="user-badge-dropdown__divider" />

          {onSyncNow && (
            <button
              type="button"
              className="user-badge-dropdown__item"
              onClick={() => {
                onSyncNow();
                setIsDropdownOpen(false);
              }}
            >
              <RefreshIcon />
              <span>Sync now</span>
            </button>
          )}

          <button
            type="button"
            className="user-badge-dropdown__item user-badge-dropdown__item--danger"
            onClick={handleLogout}
          >
            <LogoutIcon />
            <span>Sign out</span>
          </button>
        </div>
      )}

      {/* Merge Confirmation Dialog */}
      {mergePrompt?.isOpen && (
        <div
          className="merge-prompt-backdrop"
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
        >
          <div
            className="merge-prompt-dialog"
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          >
            <h3 className="merge-prompt-dialog__title">
              Sync drawings to your account
            </h3>
            <p className="merge-prompt-dialog__desc">
              Found {mergePrompt.localDocCount} drawings stored on this device.
              Would you like to upload all drawings to your Cloud account to
              access them from other devices?
            </p>
            <div className="merge-prompt-dialog__actions">
              <button
                type="button"
                className="merge-prompt-dialog__btn"
                onClick={() => {
                  setMergePrompt(null);
                  if (onMergeCancel) {
                    onMergeCancel();
                  }
                }}
              >
                Skip
              </button>
              <button
                type="button"
                className="merge-prompt-dialog__btn merge-prompt-dialog__btn--primary"
                onClick={() => {
                  setMergePrompt(null);
                  if (onMergeConfirm) {
                    onMergeConfirm();
                  }
                }}
              >
                Sync to Cloud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ownership Conflict Dialog */}
      {conflictPrompt?.isOpen && (
        <div
          className="merge-prompt-backdrop"
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
        >
          <div
            className="merge-prompt-dialog"
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          >
            <h3 className="merge-prompt-dialog__title">
              Drawing Ownership Conflict
            </h3>
            <p className="merge-prompt-dialog__desc">
              Drawing <strong>"{conflictPrompt.docName}"</strong> belongs to another account on the server. Would you like to create a copy (Fork) into your account to continue editing and syncing?
            </p>
            <div className="merge-prompt-dialog__actions">
              <button
                type="button"
                className="merge-prompt-dialog__btn merge-prompt-dialog__btn--danger"
                onClick={() => {
                  setConflictPrompt(null);
                  if (onConflictReset) {
                    onConflictReset();
                  }
                }}
              >
                Reset & Clear local copy
              </button>
              <button
                type="button"
                className="merge-prompt-dialog__btn merge-prompt-dialog__btn--primary"
                onClick={() => {
                  setConflictPrompt(null);
                  if (onConflictFork) {
                    onConflictFork();
                  }
                }}
              >
                Create a copy (Fork)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
