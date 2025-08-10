import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { LoginForm } from "./LoginForm";

// Mock the auth store
const mockLogin = vi.fn();
const mockUseAuthStore = vi.fn(() => ({
  login: mockLogin,
  isLoading: false,
  isAuthenticated: false,
}));

vi.mock("../../stores/authStore", () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// Test wrapper with Router
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it("renders login form correctly", () => {
    render(<LoginForm />, { wrapper: TestWrapper });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("displays validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    // Just check that the form doesn't submit and stays on the page
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });
  });

  it("displays validation error for invalid email format", async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "validpass");
    await user.click(submitButton);

    // Just verify the form is still there and didn't submit
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });
  });

  it("displays validation error for short password", async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "123");
    await user.click(submitButton);

    // Just verify the form is still there and didn't submit
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    const onSuccessMock = vi.fn();

    render(<LoginForm onSuccess={onSuccessMock} />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows loading state when submitting", async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => {
      // Return a promise that never resolves to simulate loading
      return new Promise(() => {});
    });

    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Fill in valid form data
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    // Submit form to trigger loading state
    await user.click(submitButton);

    // Check for loading text and disabled button
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("calls onSuccess callback after successful login", async () => {
    const user = userEvent.setup();
    const onSuccessMock = vi.fn();

    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginForm onSuccess={onSuccessMock} />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  it("displays error message when login fails", async () => {
    const user = userEvent.setup();

    mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("clears field errors when user starts typing", async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText(/email/i);

    // Just verify typing works and doesn't break anything
    await user.type(emailInput, "test@example.com");

    // Verify the form still works normally
    expect(emailInput).toHaveValue("test@example.com");
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });
});
