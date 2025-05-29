import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import { Alert } from "react-native";
import SignUpScreen from "@/app/sign-up";
import { SQLiteDatabase } from "expo-sqlite";

// Mock dependencies
jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));
jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(),
  digestStringAsync: jest.fn(),
}));
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));
jest.mock("@/components/footer", () => () => <></>);
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn(),
}));

describe("SignUpScreen Integration Tests", () => {
  let mockDb: jest.Mocked<SQLiteDatabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock SQLite database
    mockDb = {
      runAsync: jest.fn(),
    } as unknown as jest.Mocked<SQLiteDatabase>;
    (SQLite.useSQLiteContext as jest.Mock).mockReturnValue(mockDb);
    // Mock Crypto
    (Crypto.getRandomBytesAsync as jest.Mock).mockResolvedValue(
      new Uint8Array(16).fill(1)
    );
    (Crypto.digestStringAsync as jest.Mock).mockResolvedValue("mockedHash");
  });

  it("renders the sign-up form correctly", () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);
    expect(getByPlaceholderText("Username")).toBeTruthy();
    expect(getByPlaceholderText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Password")).toBeTruthy();
    expect(getByPlaceholderText("Confirm Password")).toBeTruthy();
    expect(getByText("Sign Up!")).toBeTruthy();
    expect(getByText("Already Have An Account?")).toBeTruthy();
    expect(getByText("Login Now!")).toBeTruthy();
  });

  it("shows error for username less than 3 characters", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("Username"), "ab");
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "Password123!"
    );
    fireEvent.press(getByText("Sign Up!"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Username must be at least 3 characters long"
      );
    });
    expect(mockDb.runAsync).not.toHaveBeenCalled();
  });

  it("shows error for invalid email", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Email"), "invalid-email");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "Password123!"
    );
    fireEvent.press(getByText("Sign Up!"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Please enter a valid email address"
      );
    });
    expect(mockDb.runAsync).not.toHaveBeenCalled();
  });

  it("shows error for password less than 6 characters", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Pass");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "Pass");
    fireEvent.press(getByText("Sign Up!"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Password must be at least 6 characters long"
      );
    });
    expect(mockDb.runAsync).not.toHaveBeenCalled();
  });

  it("shows error for mismatched passwords", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "Different123!"
    );
    fireEvent.press(getByText("Sign Up!"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Passwords do not match"
      );
    });
    expect(mockDb.runAsync).not.toHaveBeenCalled();
  });

  it("successfully registers a user and navigates to sign-in", async () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "Password123!"
    );
    fireEvent.press(getByText("Sign Up!"));

    await waitFor(() => {
      expect(Crypto.getRandomBytesAsync).toHaveBeenCalledWith(16);
      expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
        Crypto.CryptoDigestAlgorithm.SHA256,
        "Password123!" +
          btoa(String.fromCharCode(...new Uint8Array(16).fill(1)))
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        "INSERT INTO users (username, email, password_hash, salt) VALUES (?, ?, ?, ?)",
        [
          "testuser",
          "test@example.com",
          "mockedHash",
          btoa(String.fromCharCode(...new Uint8Array(16).fill(1))),
        ]
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        "Success",
        "Registration successful!"
      );
      expect(router.push).toHaveBeenCalledWith("/sign-in");
    });
  });

  it("handles duplicate username or email error", async () => {
    mockDb.runAsync.mockRejectedValueOnce(
      new Error("UNIQUE constraint failed")
    );

    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "Password123!"
    );
    fireEvent.press(getByText("Sign Up!"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Username or email already exists"
      );
    });
  });

  it("handles unexpected database errors", async () => {
    mockDb.runAsync.mockRejectedValueOnce(new Error("Unexpected error"));

    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
    fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "Password123!");
    fireEvent.changeText(
      getByPlaceholderText("Confirm Password"),
      "Password123!"
    );
    fireEvent.press(getByText("Sign Up!"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Registration failed. Please try again."
      );
    });
  });

  it('navigates to sign-in screen when "Login Now!" is pressed', async () => {
    const { getByText } = render(<SignUpScreen />);
    fireEvent.press(getByText("Login Now!"));
    expect(router.push).toHaveBeenCalledWith("/sign-in");
  });
});
