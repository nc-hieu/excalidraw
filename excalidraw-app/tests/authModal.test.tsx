import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { Provider, appJotaiStore } from "../app-jotai";
import { AuthModal } from "../components/Auth/AuthModal";
import { UserBadge } from "../components/Auth/UserBadge";
import { isAuthModalOpenAtom, currentUserAtom } from "../components/Auth/authState";
import * as backendAPI from "../data/backendAPI";

describe("AuthModal component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    appJotaiStore.set(isAuthModalOpenAtom, true);
  });

  it("should render centered title and tabs correctly", () => {
    render(
      <Provider store={appJotaiStore}>
        <AuthModal />
      </Provider>,
    );

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeDefined();
    expect(screen.queryByLabelText("Confirm password")).toBeNull();
  });

  it("should switch to register tab and show Confirm password field", () => {
    render(
      <Provider store={appJotaiStore}>
        <AuthModal />
      </Provider>,
    );

    const signUpTab = screen.getByRole("button", { name: "Sign up" });
    fireEvent.click(signUpTab);

    expect(screen.getByRole("heading", { name: "Create an account" })).toBeDefined();
    expect(screen.getByLabelText("Confirm password")).toBeDefined();
  });

  it("should show error when passwords do not match during registration", async () => {
    render(
      <Provider store={appJotaiStore}>
        <AuthModal />
      </Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "different123" },
    });

    const submitButtons = screen.getAllByRole("button", { name: "Sign up" });
    const actualSubmitBtn = submitButtons.find((btn) => btn.getAttribute("type") === "submit")!;
    fireEvent.click(actualSubmitBtn);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeDefined();
    });
  });

  it("should call register API when passwords match", async () => {
    const registerSpy = vi.spyOn(backendAPI, "register").mockResolvedValue({
      token: "mock_token",
      user: { id: "u_1", email: "test@example.com", name: "Tester" },
    });

    render(
      <Provider store={appJotaiStore}>
        <AuthModal />
      </Provider>,
    );

    const tabs = screen.getAllByRole("button", { name: "Sign up" });
    fireEvent.click(tabs[0]);

    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Tester" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "secret123" },
    });

    const submitButtons = screen.getAllByRole("button", { name: "Sign up" });
    const actualSubmitBtn = submitButtons.find((btn) => btn.getAttribute("type") === "submit")!;
    fireEvent.click(actualSubmitBtn);

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith("test@example.com", "secret123", "Tester");
    });
  });
});

describe("UserBadge component", () => {
  beforeEach(() => {
    vi.spyOn(backendAPI, "getMe").mockResolvedValue(null);
    appJotaiStore.set(currentUserAtom, null);
  });

  it("should render Sign in button with dedicated text span for responsive hiding", () => {
    const { container } = render(
      <Provider store={appJotaiStore}>
        <UserBadge />
      </Provider>,
    );

    const signInBtn = container.querySelector(".excalidraw-auth-btn");
    expect(signInBtn).toBeDefined();

    const textSpan = container.querySelector(".excalidraw-auth-btn__text");
    expect(textSpan).toBeDefined();
    expect(textSpan?.textContent).toBe("Sign in");
  });

  it("should render user name in dedicated span when logged in", () => {
    appJotaiStore.set(currentUserAtom, {
      id: "u_1",
      email: "alice@example.com",
      name: "Alice Wonderland",
    });

    const { container } = render(
      <Provider store={appJotaiStore}>
        <UserBadge />
      </Provider>,
    );

    const nameSpan = container.querySelector(".excalidraw-auth-btn__name");
    expect(nameSpan).toBeDefined();
    expect(nameSpan?.textContent).toBe("Alice Wonderland");
  });
});

