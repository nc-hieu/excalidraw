import React, { useState, useMemo, useRef, useEffect } from "react";
import clsx from "clsx";

import "./DocumentManagerModal.scss";

import type { useDocumentsManager } from "./useDocumentsManager";

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
  } = manager;

  const [searchQuery, setSearchQuery] = useState("");
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing name
  useEffect(() => {
    if (editingDocId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingDocId]);

  // Handle Escape key
  useEffect(() => {
    if (!isDocModalOpen) {
      return;
    }

    const doc = dialogRef.current?.ownerDocument || document;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingDocId) {
          setEditingDocId(null);
        } else {
          setIsDocModalOpen(false);
        }
      }
    };

    doc.addEventListener("keydown", handleKeyDown);
    return () => doc.removeEventListener("keydown", handleKeyDown);
  }, [isDocModalOpen, editingDocId, setIsDocModalOpen]);

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) {
      return docsList;
    }
    const query = searchQuery.toLowerCase();
    return docsList.filter((doc) => doc.name.toLowerCase().includes(query));
  }, [docsList, searchQuery]);

  if (!isDocModalOpen) {
    return null;
  }

  const handleStartRename = (id: string, name: string) => {
    setEditingDocId(id);
    setEditingName(name);
  };

  const handleFinishRename = () => {
    if (editingDocId && editingName.trim()) {
      renameDocument(editingDocId, editingName.trim());
    }
    setEditingDocId(null);
  };

  const handleCreateNew = async () => {
    await createDocument();
    setIsDocModalOpen(false);
  };

  const handleSelectDoc = async (id: string) => {
    if (currentDoc?.id !== id) {
      await switchDocument(id);
    }
    setIsDocModalOpen(false);
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
      onClick={() => setIsDocModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Quản lý Bản vẽ"
    >
      <div
        ref={dialogRef}
        className="document-manager-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="document-manager-dialog__header">
          <h2 className="document-manager-dialog__title">
            <FolderIcon />
            <span>Quản lý Bản vẽ</span>
          </h2>
          <button
            type="button"
            className="document-manager-dialog__close-btn"
            title="Đóng (Esc)"
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
              placeholder="Tìm kiếm bản vẽ..."
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
            <span>Tạo bản vẽ mới</span>
          </button>
        </div>

        <div className="document-manager-dialog__list">
          {filteredDocs.length === 0 ? (
            <div className="document-manager-dialog__empty">
              Không tìm thấy bản vẽ nào phù hợp
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
                          Đang mở
                        </span>
                      )}

                      <span className="document-manager-dialog__item__badge document-manager-dialog__item__badge--pages">
                        {doc.pageCount} trang
                      </span>
                    </div>

                    <div className="document-manager-dialog__item__meta">
                      Cập nhật: {formatDate(doc.updatedAt)}
                    </div>
                  </div>

                  <div className="document-manager-dialog__item__actions">
                    {!isActive && (
                      <button
                        type="button"
                        className="document-manager-dialog__item__btn document-manager-dialog__item__btn--primary"
                        onClick={() => handleSelectDoc(doc.id)}
                      >
                        Mở
                      </button>
                    )}

                    <button
                      type="button"
                      className="document-manager-dialog__item__btn"
                      title="Đổi tên bản vẽ"
                      onClick={() => handleStartRename(doc.id, doc.name)}
                    >
                      <EditIcon />
                    </button>

                    <button
                      type="button"
                      className="document-manager-dialog__item__btn"
                      title="Nhân bản bản vẽ"
                      onClick={() => duplicateDocument(doc.id)}
                    >
                      <CopyIcon />
                    </button>

                    <button
                      type="button"
                      className="document-manager-dialog__item__btn document-manager-dialog__item__btn--danger"
                      title="Xóa bản vẽ"
                      onClick={() => {
                        const win =
                          dialogRef.current?.ownerDocument.defaultView ||
                          window;
                        if (
                          win.confirm(
                            `Bạn có chắc chắn muốn xóa bản vẽ "${doc.name}"? Toàn bộ các trang trong bản vẽ này sẽ bị xóa.`,
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
      </div>
    </div>
  );
};
