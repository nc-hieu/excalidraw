import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { exportToCanvas } from "@excalidraw/excalidraw";
import type { ExcalidrawPage } from "../../data/documentsDB";

import "./PageThumbnail.scss";

// In-memory cache for rendered thumbnails to avoid repeated canvas exports
const thumbnailCache = new Map<string, string>();

interface PageThumbnailProps {
  page: ExcalidrawPage;
  maxWidthOrHeight?: number;
  className?: string;
  showEmptyIcon?: boolean;
}

const EmptyPageIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  page,
  maxWidthOrHeight = 220,
  className,
  showEmptyIcon = true,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  const nonDeletedElements = (page.elements || []).filter(
    (el) => !(el as any).isDeleted,
  );
  const isEmpty = nonDeletedElements.length === 0;

  useEffect(() => {
    isMountedRef.current = true;

    if (isEmpty) {
      setDataUrl(null);
      setIsLoading(false);
      return;
    }

    const cacheKey = `${page.id}_${page.updatedAt || nonDeletedElements.length}_${maxWidthOrHeight}`;
    if (thumbnailCache.has(cacheKey)) {
      setDataUrl(thumbnailCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let isCancelled = false;

    (async () => {
      try {
        const canvas = await exportToCanvas({
          elements: nonDeletedElements as any,
          appState: {
            ...page.appState,
            exportBackground: true,
            viewBackgroundColor:
              page.appState?.viewBackgroundColor || "#ffffff",
          },
          files: page.files || null,
          maxWidthOrHeight,
        });

        if (!isCancelled && isMountedRef.current) {
          const url = canvas.toDataURL("image/png");
          thumbnailCache.set(cacheKey, url);
          setDataUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled && isMountedRef.current) {
          console.warn("Failed to generate page thumbnail:", err);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
    };
  }, [page.id, page.updatedAt, nonDeletedElements.length, isEmpty, maxWidthOrHeight]);

  if (isEmpty) {
    return (
      <div className={clsx("excalidraw-page-thumbnail excalidraw-page-thumbnail--empty", className)}>
        {showEmptyIcon && (
          <div className="excalidraw-page-thumbnail__empty-content">
            <EmptyPageIcon />
            <span>Empty page</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx("excalidraw-page-thumbnail", className)}>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={page.name}
          className="excalidraw-page-thumbnail__img"
          loading="lazy"
        />
      ) : (
        <div className="excalidraw-page-thumbnail__loading">
          <div className="excalidraw-page-thumbnail__spinner" />
        </div>
      )}
    </div>
  );
};
