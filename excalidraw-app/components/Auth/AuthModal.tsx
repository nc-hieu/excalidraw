import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";

import { useAtom, useSetAtom } from "../../app-jotai";
import { login, register, type AuthUser } from "../../data/backendAPI";

import { currentUserAtom, isAuthModalOpenAtom } from "./authState";

import "./AuthModal.scss";

interface AuthModalProps {
  onSuccess?: (user: AuthUser) => void;
}

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

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useAtom(isAuthModalOpenAtom);
  const setCurrentUser = useSetAtom(currentUserAtom);

  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Focus email on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTimeout(() => {
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, tab]);

  // Handle Escape key and isolate modal keyboard events from Excalidraw canvas
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const doc = dialogRef.current?.ownerDocument || document;
    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        e.stopPropagation();
      }
    };

    const dialogNode = dialogRef.current;
    const stopPropagation = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
      e.stopPropagation();
    };

    if (dialogNode) {
      dialogNode.addEventListener("keydown", stopPropagation);
      dialogNode.addEventListener("keyup", stopPropagation);
    }
    doc.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      if (dialogNode) {
        dialogNode.removeEventListener("keydown", stopPropagation);
        dialogNode.removeEventListener("keyup", stopPropagation);
      }
      doc.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password");
      return;
    }

    if (tab === "register") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setLoading(true);
    try {
      let res;
      if (tab === "login") {
        res = await login(email.trim(), password);
      } else {
        res = await register(email.trim(), password, name.trim() || undefined);
      }

      setCurrentUser(res.user);
      setIsOpen(false);
      if (onSuccess) {
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-modal-backdrop"
      onClick={() => setIsOpen(false)}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={tab === "login" ? "Sign in" : "Sign up"}
    >
      <div
        ref={dialogRef}
        className="auth-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        <div className="auth-modal-dialog__header">
          <h2 className="auth-modal-dialog__title">
            {tab === "login" ? "Sign in" : "Create an account"}
          </h2>
          <button
            type="button"
            className="auth-modal-dialog__close-btn"
            title="Close (Esc)"
            onClick={() => setIsOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="auth-modal-dialog__tabs">
          <button
            type="button"
            className={clsx("auth-modal-dialog__tab", {
              "auth-modal-dialog__tab--active": tab === "login",
            })}
            onClick={() => {
              setTab("login");
              setError(null);
              setConfirmPassword("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={clsx("auth-modal-dialog__tab", {
              "auth-modal-dialog__tab--active": tab === "register",
            })}
            onClick={() => {
              setTab("register");
              setError(null);
              setConfirmPassword("");
            }}
          >
            Sign up
          </button>
        </div>

        <form className="auth-modal-dialog__form" onSubmit={handleSubmit}>
          {error && <div className="auth-modal-dialog__error">{error}</div>}

          {tab === "register" && (
            <div className="auth-modal-dialog__field">
              <label htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="auth-modal-dialog__field">
            <label htmlFor="auth-email">Email address</label>
            <input
              ref={emailInputRef}
              id="auth-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="auth-modal-dialog__field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {tab === "register" && (
            <div className="auth-modal-dialog__field">
              <label htmlFor="auth-confirm-password">Confirm password</label>
              <input
                id="auth-confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            className="auth-modal-dialog__submit-btn"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : tab === "login"
              ? "Sign in"
              : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
};
