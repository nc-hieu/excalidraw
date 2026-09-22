import {
  createDefaultDocument,
  createNewPage,
  generateId,
  type ExcalidrawDocument,
} from "../data/documentsDB";

describe("documentsDB & multi-page data models", () => {
  it("generateId should return unique non-empty string IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it("createDefaultDocument should initialize with 1 default page", () => {
    const doc = createDefaultDocument("Bản vẽ mẫu");
    expect(doc.name).toBe("Bản vẽ mẫu");
    expect(doc.pages.length).toBe(1);
    expect(doc.pages[0].name).toBe("Trang 1");
    expect(doc.activePageId).toBe(doc.pages[0].id);
    expect(doc.pages[0].elements).toEqual([]);
  });

  it("createNewPage should initialize a clean page with unique id", () => {
    const page = createNewPage("Trang thiết kế 2");
    expect(page.id).toBeTruthy();
    expect(page.name).toBe("Trang thiết kế 2");
    expect(page.elements).toEqual([]);
    expect(page.appState).toEqual({});
  });

  it("should support adding multiple pages to a document", () => {
    const doc = createDefaultDocument("Dự án Alpha");
    const page2 = createNewPage("Trang 2");
    const page3 = createNewPage("Trang 3");

    const updatedDoc: ExcalidrawDocument = {
      ...doc,
      pages: [...doc.pages, page2, page3],
      activePageId: page2.id,
      updatedAt: Date.now(),
    };

    expect(updatedDoc.pages.length).toBe(3);
    expect(updatedDoc.activePageId).toBe(page2.id);
    expect(updatedDoc.pages.map((p) => p.name)).toEqual([
      "Trang 1",
      "Trang 2",
      "Trang 3",
    ]);
  });

  it("should support renaming and reordering pages", () => {
    const doc = createDefaultDocument("Bản vẽ");
    const page2 = createNewPage("Trang 2");
    let pages = [...doc.pages, page2];

    // Rename
    pages = pages.map((p) =>
      p.id === page2.id ? { ...p, name: "Trang Sơ đồ" } : p,
    );
    expect(pages[1].name).toBe("Trang Sơ đồ");

    // Reorder
    const reordered = [pages[1], pages[0]];
    expect(reordered[0].name).toBe("Trang Sơ đồ");
    expect(reordered[1].name).toBe("Trang 1");
  });
});
