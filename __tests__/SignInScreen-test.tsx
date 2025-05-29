import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import * as SQLite from "expo-sqlite";
import { router } from "expo-router";
import { Alert } from "react-native";
import SignInScreen from "@/app/sign-in";
import { useSession } from "@/providers/session";
import { SQLiteDatabase } from "expo-sqlite";

// Mock dependencies
jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));
jest.mock("@/providers/session", () => ({
  useSession: jest.fn(),
}));
jest.mock("@/components/footer", () => () => <></>);
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn(),
}));

describe("SignInScreen Integration Tests", () => {
  let mockDb: jest.Mocked<SQLiteDatabase>;
  let mockSignIn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock SQLite database
    mockDb = {
      runAsync: jest.fn(),
    } as unknown as jest.Mocked<SQLiteDatabase>;
    (SQLite.useSQLiteContext as jest.Mock).mockReturnValue(mockDb);
    // Mock useSession
    mockSignIn = jest.fn();
    (useSession as jest.Mock).mockReturnValue({ signIn: mockSignIn });
  });

  it("renders the sign-in form correctly", () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);
    expect(getByPlaceholderText("Username or Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByText("Login")).toBeTruthy();
    expect(getByText("Don't have an account?")).toBeTruthy();
    expect(getByText("Sign Up Now!")).toBeTruthy();
  });

  it("shows error for empty email or username", async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Please enter your email or username"
      );
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows error for empty password", async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText("Username or Email"), "testuser");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Please enter your password"
      );
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("successfully logs in and navigates to home screen", async () => {
    mockSignIn.mockResolvedValueOnce(undefined); // Simulate successful sign-in

    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText("Username or Email"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        mockDb,
        "testuser",
        "Password123!"
      );
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Login successful!");
      expect(router.push).toHaveBeenCalledWith("/(app)");
    });
  });

  it('handles "No account found" error', async () => {
    mockSignIn.mockRejectedValueOnce(new Error("No account found"));

    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText("Username or Email"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        mockDb,
        "testuser",
        "Password123!"
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "No account found with that email or username"
      );
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  it('handles "Incorrect password" error', async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Incorrect password"));

    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText("Username or Email"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        mockDb,
        "testuser",
        "Password123!"
      );
      expect(Alert.alert).toHaveBeenCalledWith("Error", "Incorrect password");
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  it("handles unexpected errors", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Unexpected error"));

    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(getByPlaceholderText("Username or Email"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.press(getByText("Login"));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        mockDb,
        "testuser",
        "Password123!"
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Login failed: Unexpected error"
      );
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  it('navigates to sign-up screen when "Sign Up Now!" is pressed', async () => {
    const { getByText } = render(<SignInScreen />);
    fireEvent.press(getByText("Sign Up Now!"));
    expect(router.push).toHaveBeenCalledWith("/sign-up");
  });
});
