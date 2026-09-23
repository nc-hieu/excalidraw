import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";

import { useAtom, useSetAtom } from "../../app-jotai";

import { clearAuthToken, getMe } from "../../data/backendAPI";

import {
  currentUserAtom,
  isAuthModalOpenAtom,
  syncStatusAtom,
  mergePromptAtom,
} from "./authState";

import "./UserBadge.scss";

interface UserBadgeProps {
  onSyncNow?: () => void;
  onMergeConfirm?: () => void;
  onMergeCancel?: () => void;
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
}) => {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const setIsAuthModalOpen = useSetAtom(isAuthModalOpenAtom);
  const [syncStatus] = useAtom(syncStatusAtom);
  const [mergePrompt, setMergePrompt] = useAtom(mergePromptAtom);

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
      ? "Đã đồng bộ lên Cloud an toàn"
      : syncStatus === "syncing"
      ? "Đang lưu lên Cloud..."
      : "Chế độ ngoại tuyến (lưu trên máy)";

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
          title={`Tài khoản: ${currentUser.email}`}
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
          title="Đăng nhập để đồng bộ bản vẽ đa thiết bị"
          onClick={() => setIsAuthModalOpen(true)}
        >
          <UserIcon />
          <span>Đăng nhập</span>
        </button>
      )}

      {/* Dropdown Menu */}
      {isDropdownOpen && currentUser && (
        <div className="user-badge-dropdown">
          <div className="user-badge-dropdown__header">
            <span className="user-badge-dropdown__user-name">
              {currentUser.name || "Người dùng"}
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
              <span>Đồng bộ ngay</span>
            </button>
          )}

          <button
            type="button"
            className="user-badge-dropdown__item user-badge-dropdown__item--danger"
            onClick={handleLogout}
          >
            <LogoutIcon />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}

      {/* Merge Confirmation Dialog */}
      {mergePrompt?.isOpen && (
        <div className="merge-prompt-backdrop">
          <div className="merge-prompt-dialog">
            <h3 className="merge-prompt-dialog__title">
              Đồng bộ bản vẽ vào tài khoản
            </h3>
            <p className="merge-prompt-dialog__desc">
              Phát hiện {mergePrompt.localDocCount} bản vẽ đang lưu trên thiết
              bị này. Bạn có muốn tải toàn bộ các bản vẽ này lên tài khoản Cloud
              để truy cập từ các thiết bị khác không?
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
                Bỏ qua
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
                Đồng bộ lên Cloud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
