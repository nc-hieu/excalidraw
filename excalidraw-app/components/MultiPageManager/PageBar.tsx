import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import "./PageBar.scss";
import { PageThumbnail } from "./PageThumbnail";

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
  const [hoveredPage, setHoveredPage] = useState<{
    page: ExcalidrawPage;
    rect: DOMRect;
  } | null>(null);
  const hoverTimeoutRef = useRef<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef<{
    isDown: boolean;
    startX: number;
    scrollLeft: number;
    hasMoved: boolean;
  }>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  });

  // Check scroll overflow to toggle arrow buttons
  const updateScrollButtons = () => {
    const el = tabsRef.current;
    if (el) {
      const atStart = el.scrollLeft <= 2;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      setCanScrollLeft(!atStart);
      setCanScrollRight(!atEnd);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const el = tabsRef.current;
    if (!el) {
      return;
    }

    const handleScroll = () => {
      updateScrollButtons();
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateScrollButtons();
      });
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [currentDoc?.pages.length]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (!currentDoc?.activePageId || !tabsRef.current) {
      return;
    }
    const activeTabEl = tabsRef.current.querySelector(
      ".excalidraw-page-bar__tab--active",
    ) as HTMLElement | null;
    if (activeTabEl && typeof activeTabEl.scrollIntoView === "function") {
      activeTabEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    // Update scroll buttons after smooth scroll
    setTimeout(updateScrollButtons, 300);
  }, [currentDoc?.activePageId]);

  // Horizontal wheel scroll listener (converts vertical wheel deltaY to horizontal scroll)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    clearTimeout(hoverTimeoutRef.current);
    setHoveredPage(null);
    const el = tabsRef.current;
    if (!el) {
      return;
    }
    if (e.deltaY !== 0) {
      el.scrollLeft += e.deltaY;
      e.stopPropagation();
    }
  };

  // Drag to scroll handlers for desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    clearTimeout(hoverTimeoutRef.current);
    setHoveredPage(null);
    // Only drag with primary mouse button and not on menu buttons or input
    if (e.button !== 0) {
      return;
    }
    const target = e.target as HTMLElement;
    if (
      target.closest(".excalidraw-page-bar__tab__menu-btn") ||
      target.closest("input")
    ) {
      return;
    }

    const el = tabsRef.current;
    if (!el) {
      return;
    }

    const clientX = e.clientX ?? e.pageX ?? 0;
    const offsetLeft = el.getBoundingClientRect ? el.getBoundingClientRect().left : el.offsetLeft || 0;
    dragInfoRef.current = {
      isDown: true,
      startX: clientX - offsetLeft,
      scrollLeft: el.scrollLeft,
      hasMoved: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragInfoRef.current.isDown) {
      return;
    }
    const el = tabsRef.current;
    if (!el) {
      return;
    }

    const clientX = e.clientX ?? e.pageX ?? 0;
    const offsetLeft = el.getBoundingClientRect ? el.getBoundingClientRect().left : el.offsetLeft || 0;
    const x = clientX - offsetLeft;
    const walk = x - dragInfoRef.current.startX;
    if (Math.abs(walk) > 4) {
      dragInfoRef.current.hasMoved = true;
      setIsDragging(true);
      el.scrollLeft = dragInfoRef.current.scrollLeft - walk;
    }
  };

  const handleMouseUpOrLeave = () => {
    dragInfoRef.current.isDown = false;
    setTimeout(() => {
      setIsDragging(false);
      dragInfoRef.current.hasMoved = false;
    }, 50);
  };

  const scrollLeftBy = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: -140, behavior: "smooth" });
    }
  };

  const scrollRightBy = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: 140, behavior: "smooth" });
    }
  };

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

  const doc = containerRef.current?.ownerDocument || document;
  const win = doc.defaultView || window;
  const isOnlyPage = currentDoc.pages.length <= 1;

  return (
    <div
      ref={containerRef}
      className="excalidraw-page-bar"
      aria-label="Page & document management"
    >
      {/* Document Manager Trigger Button */}
      <button
        type="button"
        className="excalidraw-page-bar__doc-btn"
        title="Manage drawings"
        onClick={() => setIsDocModalOpen(true)}
      >
        <FolderIcon />
        <span>{currentDoc.name}</span>
      </button>

      <div className="excalidraw-page-bar__divider" />

      {/* Scrollable Tabs Wrapper */}
      <div className="excalidraw-page-bar__scroll-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="excalidraw-page-bar__scroll-btn excalidraw-page-bar__scroll-btn--left"
            title="Scroll left"
            onClick={scrollLeftBy}
          >
            <ArrowLeftIcon />
          </button>
        )}

        <div
          ref={tabsRef}
          className={clsx("excalidraw-page-bar__tabs-container", {
            "excalidraw-page-bar__tabs-container--dragging": isDragging,
          })}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
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
                onMouseEnter={(e) => {
                  if (
                    isDragging ||
                    isEditing ||
                    editingPageId ||
                    dropdownState ||
                    ("ontouchstart" in window && window.innerWidth <= 1024)
                  ) {
                    return;
                  }
                  const target = e.currentTarget as HTMLElement;
                  clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = setTimeout(() => {
                    if (!dragInfoRef.current.isDown && !dragInfoRef.current.hasMoved) {
                      const rect = target.getBoundingClientRect();
                      setHoveredPage({ page, rect });
                    }
                  }, 180);
                }}
                onMouseLeave={() => {
                  clearTimeout(hoverTimeoutRef.current);
                  setHoveredPage(null);
                }}
                onClick={() => {
                  clearTimeout(hoverTimeoutRef.current);
                  setHoveredPage(null);
                  if (dragInfoRef.current.hasMoved) {
                    return;
                  }
                  if (!isActive && !isEditing) {
                    switchPage(page.id);
                  }
                }}
                onDoubleClick={(e) => {
                  clearTimeout(hoverTimeoutRef.current);
                  setHoveredPage(null);
                  e.stopPropagation();
                  handleStartRename(page.id, page.name);
                }}
                title={
                  isActive
                    ? `Drawing: ${page.name} (Double-click to rename)`
                    : `Switch to: ${page.name}`
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
                  title="Page options"
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

        {canScrollRight && (
          <button
            type="button"
            className="excalidraw-page-bar__scroll-btn excalidraw-page-bar__scroll-btn--right"
            title="Scroll right"
            onClick={scrollRightBy}
          >
            <ArrowRightIcon />
          </button>
        )}
      </div>

      {/* Add Page Button */}
      <button
        type="button"
        className="excalidraw-page-bar__add-btn"
        title="Add new page"
        onClick={() => addPage()}
      >
        <PlusIcon />
      </button>

      {/* Page Options Dropdown (Rendered via Portal to body to avoid transform containing block bugs) */}
      {dropdownState &&
        doc.body &&
        createPortal(
          <div
            className="excalidraw-page-bar__dropdown"
            style={{
              position: "fixed",
              bottom: `${win.innerHeight - dropdownState.rect.top + 8}px`,
              right: `${Math.max(
                8,
                win.innerWidth - dropdownState.rect.right,
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
              <span>Rename page</span>
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
              <span>Duplicate page</span>
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
                <span>Move left</span>
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
                <span>Move right</span>
              </button>
            )}

            <button
              type="button"
              className="excalidraw-page-bar__dropdown__item excalidraw-page-bar__dropdown__item--danger"
              disabled={isOnlyPage}
              title={
                isOnlyPage
                  ? "Cannot delete the only page in the drawing"
                  : "Delete this page"
              }
              onClick={() => {
                if (!isOnlyPage) {
                  setPageToDelete(dropdownState.page);
                  setDropdownState(null);
                }
              }}
            >
              <TrashIcon />
              <span>Delete page</span>
            </button>
          </div>,
          doc.body,
        )}

      {/* Custom Delete Page Confirmation Modal (Rendered via Portal to body) */}
      {pageToDelete &&
        doc.body &&
        createPortal(
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
                <h3 id="delete-page-title">Delete page</h3>
              </div>
              <p className="excalidraw-page-bar__confirm-modal__desc">
                Are you sure you want to delete page{" "}
                <strong>&quot;{pageToDelete.name}&quot;</strong>? This action
                will permanently remove all content on this page and cannot be undone.
              </p>
              <div className="excalidraw-page-bar__confirm-modal__actions">
                <button
                  type="button"
                  className="excalidraw-page-bar__confirm-modal__btn excalidraw-page-bar__confirm-modal__btn--cancel"
                  onClick={() => setPageToDelete(null)}
                >
                  Cancel
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
                  Delete
                </button>
              </div>
            </div>
          </div>,
          doc.body,
        )}

      {/* Desktop Hover Thumbnail Preview */}
      {hoveredPage &&
        !dropdownState &&
        !isDragging &&
        !editingPageId &&
        createPortal(
          <div
            className="excalidraw-page-preview-popover"
            style={{
              left: hoveredPage.rect.left + hoveredPage.rect.width / 2,
              top: hoveredPage.rect.top - 8,
            }}
          >
            <div className="excalidraw-page-preview-popover__thumb">
              <PageThumbnail page={hoveredPage.page} maxWidthOrHeight={180} />
            </div>
            <div className="excalidraw-page-preview-popover__title">
              {hoveredPage.page.name}
            </div>
            <div className="excalidraw-page-preview-popover__arrow" />
          </div>,
          doc.body,
        )}
    </div>
  );
};
