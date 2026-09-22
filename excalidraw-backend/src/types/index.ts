export interface JwtPayload {
  userId: string;
  email: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export interface RegisterBody {
  email: string;
  password: string;
  name?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface SyncPagePayload {
  id: string;
  name: string;
  elements: any[];
  appState: Record<string, any>;
  files?: Record<string, any>;
  orderIndex?: number;
}

export interface SyncDocumentBody {
  name: string;
  activePageId: string;
  pages: SyncPagePayload[];
}

export interface UpdateDocumentBody {
  name?: string;
  activePageId?: string;
}

export interface ShareDocumentBody {
  shareMode: "view" | "edit" | "private";
}
