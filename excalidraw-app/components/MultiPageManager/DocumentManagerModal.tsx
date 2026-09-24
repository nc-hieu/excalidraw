import React, { useState, useMemo, useRef, useEffect } from "react";
import clsx from "clsx";

import "./DocumentManagerModal.scss";
import { PageThumbnail } from "./PageThumbnail";

import type { useDocumentsManager } from "./useDocumentsManager";
import type { ExcalidrawDocument } from "../../data/documentsDB";

interface DocumentManagerModalProps {
  manager: ReturnType<typeof useDocumentsManager>;
}

const FolderIcon = () => (
  <svg
    width="18"
    height="18"
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

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ArrowLeftIcon = () => (
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
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const GridIcon = () => (
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
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const SearchIcon = () => (
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
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
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

const EditIcon = () => (
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
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CopyIcon = () => (
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
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const TrashIcon = () => (
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const DocumentManagerModal: React.FC<DocumentManagerModalProps> = ({
  manager,
}) => {
  const {
    currentDoc,
    docsList,
    isDocModalOpen,
    setIsDocModalOpen,
    switchDocument,
    createDocument,
    renameDocument,
    duplicateDocument,
    deleteDoc,
    getFullDocument,
  } = manager;

  const [searchQuery, setSearchQuery] = useState("");
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [viewingDoc, setViewingDoc] = useState<ExcalidrawDocument | null>(null);
  const [isLoadingPages, setIsLoadingPages] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing name
  useEffect(() => {
    if (editingDocId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingDocId]);

  // Reset viewingDoc and search when modal closes
  useEffect(() => {
    if (!isDocModalOpen) {
      setViewingDoc(null);
      setSearchQuery("");
      setEditingDocId(null);
    }
  }, [isDocModalOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isDocModalOpen) {
      return;
    }

    const doc = dialogRef.current?.ownerDocument || document;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewingDoc) {
          setViewingDoc(null);
        } else {
          setIsDocModalOpen(false);
        }
      }
    };

    doc.addEventListener("keydown", handleKeyDown);
    return () => {
      doc.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDocModalOpen, viewingDoc, setIsDocModalOpen]);

  // Keep viewingDoc in sync with currentDoc if viewing currentDoc
  const activeViewingDoc =
    currentDoc && viewingDoc?.id === currentDoc.id ? currentDoc : viewingDoc;

  // Filter documents
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) {
      return docsList;
    }
    const q = searchQuery.toLowerCase().trim();
    return docsList.filter((doc) => doc.name.toLowerCase().includes(q));
  }, [docsList, searchQuery]);

  if (!isDocModalOpen) {
    return null;
  }

  const handleStartRename = (id: string, name: string) => {
    setEditingDocId(id);
    setEditingName(name);
  };

  const handleFinishRename = async () => {
    if (editingDocId && editingName.trim()) {
      await renameDocument(editingDocId, editingName.trim());
      if (viewingDoc && viewingDoc.id === editingDocId) {
        setViewingDoc({ ...viewingDoc, name: editingName.trim() });
      }
    }
    setEditingDocId(null);
  };

  const handleCreateNew = async () => {
    await createDocument();
    setIsDocModalOpen(false);
    setViewingDoc(null);
  };

  const handleSelectDoc = async (id: string) => {
    if (currentDoc?.id !== id) {
      await switchDocument(id);
    }
    setIsDocModalOpen(false);
    setViewingDoc(null);
  };

  const handleOpenPagesView = async (docId: string) => {
    if (currentDoc && currentDoc.id === docId) {
      setViewingDoc(currentDoc);
      return;
    }
    setIsLoadingPages(true);
    try {
      const full = await getFullDocument(docId);
      if (full) {
        setViewingDoc(full);
      }
    } catch (err) {
      console.error("Failed to load document pages:", err);
    } finally {
      setIsLoadingPages(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div
      className="document-manager-backdrop"
      onClick={() => {
        setIsDocModalOpen(false);
        setViewingDoc(null);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Drawings"
    >
      <div
        ref={dialogRef}
        className={clsx("document-manager-dialog", {
          "document-manager-dialog--gallery": !!activeViewingDoc,
        })}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gallery View: View all pages of a specific drawing in a grid */}
        {activeViewingDoc ? (
          <>
            <div className="document-manager-dialog__header">
              <div className="document-manager-dialog__header-left">
                <button
                  type="button"
                  className="document-manager-dialog__back-btn"
                  title="Back to drawings list"
                  onClick={() => setViewingDoc(null)}
                >
                  <ArrowLeftIcon />
                  <span>Back to drawings</span>
                </button>
                <div className="document-manager-dialog__header-divider" />
                <h2 className="document-manager-dialog__title">
                  <FolderIcon />
                  <span className="document-manager-dialog__title-text">
                    {activeViewingDoc.name}
                  </span>
                  <span className="document-manager-dialog__pages-badge">
                    {activeViewingDoc.pages.length}{" "}
                    {activeViewingDoc.pages.length === 1 ? "page" : "pages"}
                  </span>
                </h2>
              </div>
              <button
                type="button"
                className="document-manager-dialog__close-btn"
                title="Close (Esc)"
                onClick={() => {
                  setIsDocModalOpen(false);
                  setViewingDoc(null);
                }}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="document-manager-dialog__gallery-container">
              <div className="document-manager-dialog__gallery-hint">
                Click on any page below to open and jump directly to it:
              </div>

              <div className="document-manager-dialog__page-grid">
                {activeViewingDoc.pages.map((page, index) => {
                  const isPageActive =
                    currentDoc?.id === activeViewingDoc.id &&
                    currentDoc.activePageId === page.id;

                  return (
                    <div
                      key={page.id}
                      className={clsx("document-manager-dialog__page-card", {
                        "document-manager-dialog__page-card--active": isPageActive,
                      })}
                      onClick={async () => {
                        await switchDocument(activeViewingDoc.id, page.id);
                        setIsDocModalOpen(false);
                        setViewingDoc(null);
                      }}
                      title={`Open ${page.name}`}
                    >
                      <div className="document-manager-dialog__page-thumb-wrapper">
                        <PageThumbnail page={page} maxWidthOrHeight={220} />
                        {isPageActive && (
                          <span className="document-manager-dialog__page-badge">
                            Active
                          </span>
                        )}
                        <span className="document-manager-dialog__page-num">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="document-manager-dialog__page-footer">
                        <span
                          className="document-manager-dialog__page-name"
                          title={page.name}
                        >
                          {page.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Normal View: List of drawings */
          <>
            <div className="document-manager-dialog__header">
              <h2 className="document-manager-dialog__title">
                <FolderIcon />
                <span>Drawings</span>
              </h2>
              <button
                type="button"
                className="document-manager-dialog__close-btn"
                title="Close (Esc)"
                onClick={() => setIsDocModalOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="document-manager-dialog__top-bar">
              <div className="document-manager-dialog__search">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search drawings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="document-manager-dialog__create-btn"
                onClick={handleCreateNew}
              >
                <PlusIcon />
                <span>New drawing</span>
              </button>
            </div>

            <div className="document-manager-dialog__list">
              {isLoadingPages && (
                <div className="document-manager-dialog__loading-bar">
                  Loading pages...
                </div>
              )}
              {filteredDocs.length === 0 ? (
                <div className="document-manager-dialog__empty">
                  No drawings found
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const isActive = currentDoc?.id === doc.id;
                  const isEditing = editingDocId === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className={clsx("document-manager-dialog__item", {
                        "document-manager-dialog__item--active": isActive,
                      })}
                    >
                      <div
                        className="document-manager-dialog__item__info"
                        onClick={() => !isEditing && handleSelectDoc(doc.id)}
                      >
                        <div className="document-manager-dialog__item__title-row">
                          {isEditing ? (
                            <input
                              ref={inputRef}
                              type="text"
                              className="document-manager-dialog__item__input"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={handleFinishRename}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleFinishRename();
                                }
                                if (e.key === "Escape") {
                                  setEditingDocId(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="document-manager-dialog__item__title">
                              {doc.name}
                            </span>
                          )}

                          {isActive && (
                            <span className="document-manager-dialog__item__badge document-manager-dialog__item__badge--active">
                              Current
                            </span>
                          )}

                          {/* Button to view all pages in grid */}
                          <button
                            type="button"
                            className="document-manager-dialog__view-pages-btn"
                            title="Click to view all pages of this drawing"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPagesView(doc.id);
                            }}
                          >
                            <GridIcon />
                            <span>
                              {doc.pageCount}{" "}
                              {doc.pageCount === 1 ? "page" : "pages"}
                            </span>
                          </button>
                        </div>

                        <div className="document-manager-dialog__item__meta">
                          Updated: {formatDate(doc.updatedAt)}
                        </div>
                      </div>

                      <div className="document-manager-dialog__item__actions">
                        {/* Open all pages in gallery button */}
                        <button
                          type="button"
                          className="document-manager-dialog__item__btn document-manager-dialog__item__btn--pages"
                          title="View all pages in grid"
                          onClick={() => handleOpenPagesView(doc.id)}
                        >
                          <GridIcon />
                          <span>Pages</span>
                        </button>

                        {!isActive && (
                          <button
                            type="button"
                            className="document-manager-dialog__item__btn document-manager-dialog__item__btn--primary"
                            onClick={() => handleSelectDoc(doc.id)}
                          >
                            Open
                          </button>
                        )}

                        <button
                          type="button"
                          className="document-manager-dialog__item__btn"
                          title="Rename drawing"
                          onClick={() => handleStartRename(doc.id, doc.name)}
                        >
                          <EditIcon />
                        </button>

                        <button
                          type="button"
                          className="document-manager-dialog__item__btn"
                          title="Duplicate drawing"
                          onClick={() => duplicateDocument(doc.id)}
                        >
                          <CopyIcon />
                        </button>

                        <button
                          type="button"
                          className="document-manager-dialog__item__btn document-manager-dialog__item__btn--danger"
                          title="Delete drawing"
                          onClick={() => {
                            const win =
                              dialogRef.current?.ownerDocument.defaultView ||
                              window;
                            if (
                              win.confirm(
                                `Are you sure you want to delete drawing "${doc.name}"? All pages in this drawing will be permanently removed.`,
                              )
                            ) {
                              deleteDoc(doc.id);
                            }
                          }}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
