import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";

import "./PageBar.scss";

import type { useDocumentsManager } from "./useDocumentsManager";
import type { ExcalidrawPage } from "../../data/documentsDB";

interface PageBarProps {
  manager: ReturnType<typeof useDocumentsManager>;
}

// Compact SVG Icons
const FolderIcon = () => (
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
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const DotsIcon = () => (
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
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const EditIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CopyIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

interface DropdownState {
  page: ExcalidrawPage;
  index: number;
  rect: DOMRect;
}

export const PageBar: React.FC<PageBarProps> = ({ manager }) => {
  const {
    currentDoc,
    switchPage,
    addPage,
    renamePage,
    duplicatePage,
    deletePage,
    reorderPages,
    setIsDocModalOpen,
  } = manager;

  const [dropdownState, setDropdownState] = useState<DropdownState | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pageToDelete, setPageToDelete] = useState<ExcalidrawPage | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside adhering to app.ownerDocument guideline
  useEffect(() => {
    if (!dropdownState) {
      return;
    }

    const doc = containerRef.current?.ownerDocument || document;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(".excalidraw-page-bar__dropdown") ||
        target.closest(".excalidraw-page-bar__tab__menu-btn")
      ) {
        return;
      }
      setDropdownState(null);
    };

    doc.addEventListener("pointerdown", handlePointerDown);
    return () => {
      doc.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [dropdownState]);

  // Focus input when inline renaming
  useEffect(() => {
    if (editingPageId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPageId]);

  if (!currentDoc) {
    return null;
  }

  const handleStartRename = (pageId: string, currentName: string) => {
    setEditingPageId(pageId);
    setEditingName(currentName);
    setDropdownState(null);
  };

  const handleFinishRename = () => {
    if (editingPageId && editingName.trim()) {
      renamePage(editingPageId, editingName.trim());
    }
    setEditingPageId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishRename();
    } else if (e.key === "Escape") {
      setEditingPageId(null);
    }
  };

  const win = containerRef.current?.ownerDocument?.defaultView || window;
  const isOnlyPage = currentDoc.pages.length <= 1;

  return (
    <div
      ref={containerRef}
      className="excalidraw-page-bar"
      aria-label="Quản lý trang và bản vẽ"
    >
      {/* Document Manager Trigger Button */}
      <button
        type="button"
        className="excalidraw-page-bar__doc-btn"
        title="Mở danh sách quản lý bản vẽ"
        onClick={() => setIsDocModalOpen(true)}
      >
        <FolderIcon />
        <span>{currentDoc.name}</span>
      </button>

      <div className="excalidraw-page-bar__divider" />

      {/* Pages Tabs */}
      <div className="excalidraw-page-bar__tabs-container">
        {currentDoc.pages.map((page, index) => {
          const isActive = page.id === currentDoc.activePageId;
          const isEditing = page.id === editingPageId;
          const isDropdownOpen = dropdownState?.page.id === page.id;

          return (
            <div
              key={page.id}
              className={clsx("excalidraw-page-bar__tab", {
                "excalidraw-page-bar__tab--active": isActive,
              })}
              onClick={() => {
                if (!isActive && !isEditing) {
                  switchPage(page.id);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleStartRename(page.id, page.name);
              }}
              title={
                isActive
                  ? `Đang vẽ: ${page.name} (Click đúp để đổi tên)`
                  : `Chuyển sang: ${page.name}`
              }
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  className="excalidraw-page-bar__tab__input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="excalidraw-page-bar__tab__name">
                  {page.name}
                </span>
              )}

              {/* Tab Menu Button */}
              <button
                type="button"
                className="excalidraw-page-bar__tab__menu-btn"
                title="Tùy chọn trang"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDropdownOpen) {
                    setDropdownState(null);
                  } else {
                    const rect = (
                      e.currentTarget as HTMLElement
                    ).getBoundingClientRect();
                    setDropdownState({ page, index, rect });
                  }
                }}
              >
                <DotsIcon />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Page Button */}
      <button
        type="button"
        className="excalidraw-page-bar__add-btn"
        title="Thêm trang mới"
        onClick={() => addPage()}
      >
        <PlusIcon />
      </button>

      {/* Page Options Dropdown (Positioned outside tabs-container to prevent clipping) */}
      {dropdownState && (
        <div
          className="excalidraw-page-bar__dropdown"
          style={{
            position: "fixed",
            bottom: `${win.innerHeight - dropdownState.rect.top + 8}px`,
            left: `${Math.max(
              8,
              Math.min(dropdownState.rect.left, win.innerWidth - 180),
            )}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="excalidraw-page-bar__dropdown__item"
            onClick={() =>
              handleStartRename(
                dropdownState.page.id,
                dropdownState.page.name,
              )
            }
          >
            <EditIcon />
            <span>Đổi tên trang</span>
          </button>

          <button
            type="button"
            className="excalidraw-page-bar__dropdown__item"
            onClick={() => {
              duplicatePage(dropdownState.page.id);
              setDropdownState(null);
            }}
          >
            <CopyIcon />
            <span>Nhân bản trang</span>
          </button>

          {dropdownState.index > 0 && (
            <button
              type="button"
              className="excalidraw-page-bar__dropdown__item"
              onClick={() => {
                reorderPages(dropdownState.index, dropdownState.index - 1);
                setDropdownState(null);
              }}
            >
              <ArrowLeftIcon />
              <span>Chuyển sang trái</span>
            </button>
          )}

          {dropdownState.index < currentDoc.pages.length - 1 && (
            <button
              type="button"
              className="excalidraw-page-bar__dropdown__item"
              onClick={() => {
                reorderPages(dropdownState.index, dropdownState.index + 1);
                setDropdownState(null);
              }}
            >
              <ArrowRightIcon />
              <span>Chuyển sang phải</span>
            </button>
          )}

          <button
            type="button"
            className="excalidraw-page-bar__dropdown__item excalidraw-page-bar__dropdown__item--danger"
            disabled={isOnlyPage}
            title={
              isOnlyPage
                ? "Không thể xóa trang duy nhất trong bản vẽ"
                : "Xóa trang này"
            }
            onClick={() => {
              if (!isOnlyPage) {
                setPageToDelete(dropdownState.page);
                setDropdownState(null);
              }
            }}
          >
            <TrashIcon />
            <span>Xóa trang</span>
          </button>
        </div>
      )}

      {/* Custom Delete Page Confirmation Modal */}
      {pageToDelete && (
        <div
          className="excalidraw-page-bar__confirm-modal-overlay"
          onClick={() => setPageToDelete(null)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              setPageToDelete(null);
            }
          }}
          tabIndex={-1}
        >
          <div
            className="excalidraw-page-bar__confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-page-title"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="excalidraw-page-bar__confirm-modal__header">
              <div className="excalidraw-page-bar__confirm-modal__icon">
                <TrashIcon />
              </div>
              <h3 id="delete-page-title">Xác nhận xóa trang</h3>
            </div>
            <p className="excalidraw-page-bar__confirm-modal__desc">
              Bạn có chắc chắn muốn xóa trang{" "}
              <strong>&quot;{pageToDelete.name}&quot;</strong> không? Thao tác
              này sẽ xóa toàn bộ nội dung của trang và không thể hoàn tác.
            </p>
            <div className="excalidraw-page-bar__confirm-modal__actions">
              <button
                type="button"
                className="excalidraw-page-bar__confirm-modal__btn excalidraw-page-bar__confirm-modal__btn--cancel"
                onClick={() => setPageToDelete(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                autoFocus
                className="excalidraw-page-bar__confirm-modal__btn excalidraw-page-bar__confirm-modal__btn--delete"
                onClick={() => {
                  deletePage(pageToDelete.id);
                  setPageToDelete(null);
                }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
