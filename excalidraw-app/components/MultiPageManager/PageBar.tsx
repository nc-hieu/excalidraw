import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";

import "./PageBar.scss";

import type { useDocumentsManager } from "./useDocumentsManager";

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

  const [activeDropdownPageId, setActiveDropdownPageId] = useState<
    string | null
  >(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside adhering to app.ownerDocument guideline
  useEffect(() => {
    if (!activeDropdownPageId) {
      return;
    }

    const doc = containerRef.current?.ownerDocument || document;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActiveDropdownPageId(null);
      }
    };

    doc.addEventListener("pointerdown", handlePointerDown);
    return () => {
      doc.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [activeDropdownPageId]);

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
    setActiveDropdownPageId(null);
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
          const isDropdownOpen = page.id === activeDropdownPageId;

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
                  setActiveDropdownPageId(isDropdownOpen ? null : page.id);
                }}
              >
                <DotsIcon />
              </button>

              {/* Page Options Dropdown */}
              {isDropdownOpen && (
                <div
                  className="excalidraw-page-bar__dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="excalidraw-page-bar__dropdown__item"
                    onClick={() => handleStartRename(page.id, page.name)}
                  >
                    <EditIcon />
                    <span>Đổi tên trang</span>
                  </button>

                  <button
                    type="button"
                    className="excalidraw-page-bar__dropdown__item"
                    onClick={() => {
                      duplicatePage(page.id);
                      setActiveDropdownPageId(null);
                    }}
                  >
                    <CopyIcon />
                    <span>Nhân bản trang</span>
                  </button>

                  {index > 0 && (
                    <button
                      type="button"
                      className="excalidraw-page-bar__dropdown__item"
                      onClick={() => {
                        reorderPages(index, index - 1);
                        setActiveDropdownPageId(null);
                      }}
                    >
                      <ArrowLeftIcon />
                      <span>Chuyển sang trái</span>
                    </button>
                  )}

                  {index < currentDoc.pages.length - 1 && (
                    <button
                      type="button"
                      className="excalidraw-page-bar__dropdown__item"
                      onClick={() => {
                        reorderPages(index, index + 1);
                        setActiveDropdownPageId(null);
                      }}
                    >
                      <ArrowRightIcon />
                      <span>Chuyển sang phải</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="excalidraw-page-bar__dropdown__item excalidraw-page-bar__dropdown__item--danger"
                    disabled={currentDoc.pages.length <= 1}
                    onClick={() => {
                      const win =
                        containerRef.current?.ownerDocument.defaultView ||
                        window;
                      if (
                        win.confirm(
                          `Bạn có chắc chắn muốn xóa trang "${page.name}" không?`,
                        )
                      ) {
                        deletePage(page.id);
                      }
                      setActiveDropdownPageId(null);
                    }}
                  >
                    <TrashIcon />
                    <span>Xóa trang</span>
                  </button>
                </div>
              )}
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
    </div>
  );
};
