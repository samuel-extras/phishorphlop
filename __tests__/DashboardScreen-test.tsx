import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import * as SQLite from "expo-sqlite";
import { useFocusEffect } from "expo-router";
import { useSession } from "@/providers/session";
import { SQLiteDatabase } from "expo-sqlite";
import DashboardScreen from "@/app/(app)/(drawer)/dashboard";

describe("<DashboardScreen />", () => {
  test("Text renders correctly on DashboardScreen", () => {
    const { getByText } = render(<DashboardScreen />);

    getByText("Dashboard!");
  });
});

// Mock dependencies
jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));
jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
}));
jest.mock("@/providers/session", () => ({
  useSession: jest.fn(),
}));
jest.mock("@/components/footer", () => () => <></>);
jest.mock("@/components/EditScreenInfo", () => () => <></>);
jest.mock("@/components/Themed", () => ({
  Text: (props: any) => <>{props.children}</>,
  View: (props: any) => <>{props.children}</>,
}));

describe("DashboardScreen Integration Tests", () => {
  let mockDb: jest.Mocked<SQLiteDatabase>;
  let mockUseFocusEffectCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock SQLite database
    mockDb = {
      getFirstAsync: jest.fn(),
    } as unknown as jest.Mocked<SQLiteDatabase>;
    (SQLite.useSQLiteContext as jest.Mock).mockReturnValue(mockDb);
    // Mock useSession
    (useSession as jest.Mock).mockReturnValue({
      session: "1,testuser,test@example.com",
    });
    // Mock useFocusEffect
    mockUseFocusEffectCallback = jest.fn((callback) => callback());
    (useFocusEffect as jest.Mock).mockImplementation(
      mockUseFocusEffectCallback
    );
  });

  it("renders the dashboard correctly", async () => {
    mockDb.getFirstAsync.mockResolvedValue({
      id: 1,
      username: "testuser",
      quizScores: "[]",
      simulationScores: "[]",
    });

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText("Progress Dashboard")).toBeTruthy();
      expect(getByText("Profile")).toBeTruthy();
      expect(getByText("Username: testuser")).toBeTruthy();
      expect(getByText("Email: test@example.com")).toBeTruthy();
      expect(getByText("Overall Performance")).toBeTruthy();
      expect(getByText("Quiz Attempts: 0")).toBeTruthy();
      expect(getByText("Quiz Average Score: 0.0%")).toBeTruthy();
      expect(getByText("Simulated Attack Attempts: 0")).toBeTruthy();
      expect(getByText("Simulated Attack Average Score: 0.0%")).toBeTruthy();
    });
  });

  it("fetches and displays user data with quiz and simulation scores", async () => {
    mockDb.getFirstAsync.mockResolvedValue({
      id: 1,
      username: "testuser",
      quizScores: JSON.stringify([
        {
          attempt_id: "1",
          type: "mcq",
          score: 4,
          total_questions: 5,
          attempt_date: "2025-01-01",
        },
        {
          attempt_id: "2",
          type: "drag_drop",
          score: 3,
          total_questions: 4,
          attempt_date: "2025-01-02",
        },
      ]),
      simulationScores: JSON.stringify([
        {
          attempt_id: "3",
          type: "email",
          score: 2,
          total_questions: 3,
          attempt_date: "2025-01-03",
        },
      ]),
    });

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = ?",
        [1]
      );
      expect(getByText("Username: testuser")).toBeTruthy();
      expect(getByText("Email: test@example.com")).toBeTruthy();
      expect(getByText("Quiz Attempts: 2")).toBeTruthy();
      expect(getByText("Quiz Average Score: 77.5%")).toBeTruthy(); // (4/5 * 100 + 3/4 * 100) / 2
      expect(getByText("Simulated Attack Attempts: 1")).toBeTruthy();
      expect(getByText("Simulated Attack Average Score: 66.7%")).toBeTruthy(); // (2/3 * 100) / 1
    });
  });

  it("handles empty session gracefully", async () => {
    (useSession as jest.Mock).mockReturnValue({ session: null });
    mockDb.getFirstAsync.mockResolvedValue(null);

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(mockDb.getFirstAsync).not.toHaveBeenCalled(); // No userId, so no query
      expect(getByText("Username:")).toBeTruthy();
      expect(getByText("Email:")).toBeTruthy();
      expect(getByText("Quiz Attempts: 0")).toBeTruthy();
      expect(getByText("Quiz Average Score: 0.0%")).toBeTruthy();
      expect(getByText("Simulated Attack Attempts: 0")).toBeTruthy();
      expect(getByText("Simulated Attack Average Score: 0.0%")).toBeTruthy();
    });
  });

  it("handles database errors gracefully", async () => {
    mockDb.getFirstAsync.mockRejectedValue(new Error("Database error"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = ?",
        [1]
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching dashboard data:",
        expect.any(Error)
      );
      expect(getByText("Username: testuser")).toBeTruthy();
      expect(getByText("Email: test@example.com")).toBeTruthy();
      expect(getByText("Quiz Attempts: 0")).toBeTruthy();
      expect(getByText("Quiz Average Score: 0.0%")).toBeTruthy();
      expect(getByText("Simulated Attack Attempts: 0")).toBeTruthy();
      expect(getByText("Simulated Attack Average Score: 0.0%")).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });

  it("triggers fetchData when screen comes into focus", async () => {
    mockDb.getFirstAsync.mockResolvedValue({
      id: 1,
      username: "testuser",
      quizScores: "[]",
      simulationScores: "[]",
    });

    render(<DashboardScreen />);

    await waitFor(() => {
      expect(mockUseFocusEffectCallback).toHaveBeenCalled();
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = ?",
        [1]
      );
    });
  });
});
