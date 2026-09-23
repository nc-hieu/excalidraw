import type { ExcalidrawDocument } from "./documentsDB";

const TOKEN_KEY = "excalidraw_auth_token";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
}

export interface CloudDocumentMetadata {
  id: string;
  name: string;
  activePageId: string;
  pageCount: number;
  shareMode: string;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getApiBaseUrl = (): string => {
  if (
    import.meta.env.VITE_APP_BACKEND_URL !== undefined &&
    import.meta.env.VITE_APP_BACKEND_URL !== ""
  ) {
    return import.meta.env.VITE_APP_BACKEND_URL as string;
  }

  if (typeof window !== "undefined") {
    // In production or when accessed via Docker Nginx reverse proxy (port 3003),
    // use relative path so requests go through Nginx proxy without CORS issues.
    if (import.meta.env.PROD || window.location.port === "3003") {
      return "";
    }

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:4000`;
  }

  return "http://localhost:4000";
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const getHeaders = (extraHeaders: Record<string, string> = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const register = async (
  email: string,
  password: string,
  name?: string,
): Promise<{ token: string; user: AuthUser }> => {
  const url = `${getApiBaseUrl()}/api/auth/register`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Đăng ký thất bại");
  }

  setAuthToken(data.token);
  return { token: data.token, user: data.user };
};

export const login = async (
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> => {
  const url = `${getApiBaseUrl()}/api/auth/login`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Đăng nhập thất bại");
  }

  setAuthToken(data.token);
  return { token: data.token, user: data.user };
};

export const getMe = async (): Promise<AuthUser | null> => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const url = `${getApiBaseUrl()}/api/auth/me`;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      clearAuthToken();
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

export const fetchCloudDocuments = async (): Promise<
  CloudDocumentMetadata[]
> => {
  const url = `${getApiBaseUrl()}/api/documents`;
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Không thể tải danh sách bản vẽ");
  }

  return data.documents || [];
};

export const getCloudDocument = async (
  id: string,
): Promise<ExcalidrawDocument | null> => {
  const url = `${getApiBaseUrl()}/api/documents/${id}`;
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.document || null;
};

export const syncDocumentToCloud = async (
  doc: ExcalidrawDocument,
): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  try {
    const url = `${getApiBaseUrl()}/api/documents/${doc.id}/sync`;
    const response = await fetch(url, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({
        name: doc.name,
        activePageId: doc.activePageId,
        pages: doc.pages.map((p, index) => ({
          id: p.id,
          name: p.name,
          elements: p.elements || [],
          appState: p.appState || {},
          files: p.files || {},
          orderIndex: index,
        })),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error(`Error syncing document ${doc.id} to cloud:`, error);
    return false;
  }
};

export const createCloudDocument = async (
  name: string,
): Promise<ExcalidrawDocument | null> => {
  try {
    const url = `${getApiBaseUrl()}/api/documents`;
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.document;
  } catch (error) {
    console.error("Error creating cloud document:", error);
    return null;
  }
};

export const deleteCloudDocument = async (id: string): Promise<boolean> => {
  try {
    const url = `${getApiBaseUrl()}/api/documents/${id}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(),
    });

    return response.ok;
  } catch (error) {
    console.error(`Error deleting cloud document ${id}:`, error);
    return false;
  }
};
