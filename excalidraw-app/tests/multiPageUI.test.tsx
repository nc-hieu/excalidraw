import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { PageBar } from "../components/MultiPageManager/PageBar";
import { DocumentManagerModal } from "../components/MultiPageManager/DocumentManagerModal";

import type { ExcalidrawDocument } from "../data/documentsDB";

describe("MultiPage UI Components", () => {
  const mockDoc: ExcalidrawDocument = {
    id: "doc-1",
    name: "Architecture Diagram",
    pages: [
      {
        id: "p-1",
        name: "Page 1",
        elements: [],
        appState: {},
        files: {},
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: "p-2",
        name: "Page 2",
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
        name: "Architecture Diagram",
        pageCount: 2,
        createdAt: 1000,
        updatedAt: 2000,
      },
      {
        id: "doc-2",
        name: "UI Draft",
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

    expect(screen.getByText("Architecture Diagram")).toBeDefined();
    expect(screen.getByText("Page 1")).toBeDefined();
    expect(screen.getByText("Page 2")).toBeDefined();
    expect(container.querySelector(".excalidraw-page-bar")).not.toBeNull();
  });

  it("should trigger addPage when clicking '+' button", () => {
    const manager = createMockManager();
    render(<PageBar manager={manager as any} />);

    const addBtn = screen.getByTitle("Add new page");
    fireEvent.click(addBtn);
    expect(manager.addPage).toHaveBeenCalledTimes(1);
  });

  it("should trigger switchPage when clicking another page tab", () => {
    const manager = createMockManager();
    render(<PageBar manager={manager as any} />);

    const page2Tab = screen.getByText("Page 2");
    fireEvent.click(page2Tab);
    expect(manager.switchPage).toHaveBeenCalledWith("p-2");
  });

  it("should open 3-dots menu and show page options", () => {
    const manager = createMockManager();
    render(<PageBar manager={manager as any} />);

    const menuBtns = screen.getAllByTitle("Page options");
    expect(menuBtns.length).toBe(2);

    // Click 3 dots on the first page
    fireEvent.click(menuBtns[0]);

    expect(screen.getByText("Rename page")).toBeDefined();
    expect(screen.getByText("Duplicate page")).toBeDefined();
    expect(screen.getByText("Move right")).toBeDefined();
    expect(screen.getByText("Delete page")).toBeDefined();
  });

  it("should prompt confirmation modal when clicking delete page and call deletePage on confirm", () => {
    const manager = createMockManager();
    render(<PageBar manager={manager as any} />);

    const menuBtns = screen.getAllByTitle("Page options");
    fireEvent.click(menuBtns[1]); // Page 2

    const deleteBtn = screen.getByText("Delete page");
    fireEvent.click(deleteBtn);

    // Modal should be visible
    expect(screen.getByText("Delete page", { selector: "h3" })).toBeDefined();
    expect(
      screen.getByText(/Are you sure you want to delete page/),
    ).toBeDefined();

    // Click confirm delete
    const confirmBtn = screen.getByText("Delete", { selector: "button" });
    fireEvent.click(confirmBtn);

    expect(manager.deletePage).toHaveBeenCalledWith("p-2");
    expect(screen.queryByText("Delete page", { selector: "h3" })).toBeNull();
  });

  it("should close delete modal without deleting when clicking cancel", () => {
    const manager = createMockManager();
    render(<PageBar manager={manager as any} />);

    const menuBtns = screen.getAllByTitle("Page options");
    fireEvent.click(menuBtns[0]);

    const deleteBtn = screen.getByText("Delete page");
    fireEvent.click(deleteBtn);

    expect(screen.getByText("Delete page", { selector: "h3" })).toBeDefined();

    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);

    expect(manager.deletePage).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete page", { selector: "h3" })).toBeNull();
  });

  it("should disable delete button when only 1 page remains", () => {
    const singlePageDoc = {
      ...mockDoc,
      pages: [mockDoc.pages[0]],
    };
    const manager = createMockManager({ currentDoc: singlePageDoc });
    render(<PageBar manager={manager as any} />);

    const menuBtn = screen.getByTitle("Page options");
    fireEvent.click(menuBtn);

    const deleteBtn = screen.getByText("Delete page").closest("button");
    expect(deleteBtn?.hasAttribute("disabled")).toBe(true);
  });

  it("should open DocumentManagerModal when modal is open and filter results", () => {
    const manager = createMockManager({ isDocModalOpen: true });
    render(<DocumentManagerModal manager={manager as any} />);

    expect(screen.getByText("Drawings")).toBeDefined();
    expect(screen.getByText("UI Draft")).toBeDefined();

    const searchInput = screen.getByPlaceholderText("Search drawings...");
    fireEvent.change(searchInput, { target: { value: "Architecture" } });

    expect(screen.getByText("Architecture Diagram")).toBeDefined();
    expect(screen.queryByText("UI Draft")).toBeNull();
  });

  it("should support horizontal wheel scroll on tabs container", () => {
    const manager = createMockManager();
    const { container } = render(<PageBar manager={manager as any} />);

    const tabsContainer = container.querySelector(
      ".excalidraw-page-bar__tabs-container",
    ) as HTMLElement;
    expect(tabsContainer).toBeDefined();

    // Fire wheel event
    fireEvent.wheel(tabsContainer, { deltaY: 80 });
    // Should handle wheel smoothly without throwing
    expect(tabsContainer).toBeDefined();
  });

  it("should handle mouse drag-to-scroll on desktop", () => {
    const manager = createMockManager();
    const { container } = render(<PageBar manager={manager as any} />);

    const tabsContainer = container.querySelector(
      ".excalidraw-page-bar__tabs-container",
    ) as HTMLElement;

    // Simulate drag interaction
    fireEvent.mouseDown(tabsContainer, { button: 0, clientX: 100, pageX: 100 });
    fireEvent.mouseMove(tabsContainer, { clientX: 50, pageX: 50 });
    expect(
      tabsContainer.classList.contains(
        "excalidraw-page-bar__tabs-container--dragging",
      ),
    ).toBe(true);

    fireEvent.mouseUp(tabsContainer);
  });
});
