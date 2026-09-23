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
    const doc = createDefaultDocument("Sample Drawing");
    expect(doc.name).toBe("Sample Drawing");
    expect(doc.pages.length).toBe(1);
    expect(doc.pages[0].name).toBe("Page 1");
    expect(doc.activePageId).toBe(doc.pages[0].id);
    expect(doc.pages[0].elements).toEqual([]);
  });

  it("createNewPage should initialize a clean page with unique id", () => {
    const page = createNewPage("Design Page 2");
    expect(page.id).toBeTruthy();
    expect(page.name).toBe("Design Page 2");
    expect(page.elements).toEqual([]);
    expect(page.appState).toEqual({});
  });

  it("should support adding multiple pages to a document", () => {
    const doc = createDefaultDocument("Project Alpha");
    const page2 = createNewPage("Page 2");
    const page3 = createNewPage("Page 3");

    const updatedDoc: ExcalidrawDocument = {
      ...doc,
      pages: [...doc.pages, page2, page3],
      activePageId: page2.id,
      updatedAt: Date.now(),
    };

    expect(updatedDoc.pages.length).toBe(3);
    expect(updatedDoc.activePageId).toBe(page2.id);
    expect(updatedDoc.pages.map((p) => p.name)).toEqual([
      "Page 1",
      "Page 2",
      "Page 3",
    ]);
  });

  it("should support renaming and reordering pages", () => {
    const doc = createDefaultDocument("Drawing");
    const page2 = createNewPage("Page 2");
    let pages = [...doc.pages, page2];

    // Rename
    pages = pages.map((p) =>
      p.id === page2.id ? { ...p, name: "Diagram Page" } : p,
    );
    expect(pages[1].name).toBe("Diagram Page");

    // Reorder
    const reordered = [pages[1], pages[0]];
    expect(reordered[0].name).toBe("Diagram Page");
    expect(reordered[1].name).toBe("Page 1");
  });
});
