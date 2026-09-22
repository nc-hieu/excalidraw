import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { PageBar } from "../components/MultiPageManager/PageBar";
import { DocumentManagerModal } from "../components/MultiPageManager/DocumentManagerModal";

import type { ExcalidrawDocument } from "../data/documentsDB";

describe("MultiPage UI Components", () => {
  const mockDoc: ExcalidrawDocument = {
    id: "doc-1",
    name: "Sơ đồ kiến trúc",
    pages: [
      {
        id: "p-1",
        name: "Trang 1",
        elements: [],
        appState: {},
        files: {},
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: "p-2",
        name: "Trang 2",
        elements: [],
        appState: {},
        files: {},
        createdAt: 2000,
        updatedAt: 2000,
      },
    ],
    activePageId: "p-1",
    createdAt: 1000,
    updatedAt: 2000,
  };

  const createMockManager = (overrides = {}) => ({
    currentDoc: mockDoc,
    docsList: [
      {
        id: "doc-1",
        name: "Sơ đồ kiến trúc",
        pageCount: 2,
        createdAt: 1000,
        updatedAt: 2000,
      },
      {
        id: "doc-2",
        name: "Bản nháp UI",
        pageCount: 1,
        createdAt: 500,
        updatedAt: 500,
      },
    ],
    isDocModalOpen: false,
    setIsDocModalOpen: vi.fn(),
    switchPage: vi.fn(),
    addPage: vi.fn(),
    renamePage: vi.fn(),
    duplicatePage: vi.fn(),
    deletePage: vi.fn(),
    reorderPages: vi.fn(),
    switchDocument: vi.fn(),
    createDocument: vi.fn(),
    renameDocument: vi.fn(),
    duplicateDocument: vi.fn(),
    deleteDoc: vi.fn(),
    refreshDocsList: vi.fn(),
    handleSceneChange: vi.fn(),
    ...overrides,
  });

  it("should render PageBar with tabs and document trigger", () => {
    const manager = createMockManager();
    const { container } = render(<PageBar manager={manager as any} />);

    expect(screen.getByText("Sơ đồ kiến trúc")).toBeDefined();
    expect(screen.getByText("Trang 1")).toBeDefined();
    expect(screen.getByText("Trang 2")).toBeDefined();
    expect(container.querySelector(".excalidraw-page-bar")).not.toBeNull();
  });

  it("should trigger addPage when clicking '+' button", () => {
    const manager = createMockManager();
    render(<PageBar manager={manager as any} />);

    const addBtn = screen.getByTitle("Thêm trang mới");
    fireEvent.click(addBtn);
    expect(manager.addPage).toHaveBeenCalledTimes(1);
  });

  it("should trigger switchPage when clicking another page tab", () => {
    const manager = createMockManager();
    render(<PageBar manager={manager as any} />);

    const page2Tab = screen.getByText("Trang 2");
    fireEvent.click(page2Tab);
    expect(manager.switchPage).toHaveBeenCalledWith("p-2");
  });

  it("should open DocumentManagerModal when modal is open and filter results", () => {
    const manager = createMockManager({ isDocModalOpen: true });
    render(<DocumentManagerModal manager={manager as any} />);

    expect(screen.getByText("Quản lý Bản vẽ")).toBeDefined();
    expect(screen.getByText("Bản nháp UI")).toBeDefined();

    const searchInput = screen.getByPlaceholderText("Tìm kiếm bản vẽ...");
    fireEvent.change(searchInput, { target: { value: "kiến trúc" } });

    expect(screen.getByText("Sơ đồ kiến trúc")).toBeDefined();
    expect(screen.queryByText("Bản nháp UI")).toBeNull();
  });
});
