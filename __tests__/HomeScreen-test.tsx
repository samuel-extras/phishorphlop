import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import HomeScreen from "@/app/(app)/(drawer)/index";

describe("<HomeScreen />", () => {
  test("Text renders correctly on HomeScreen", () => {
    const { getByText } = render(<HomeScreen />);

    getByText("Welcome!");
  });
});

// Mock dependencies
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));
jest.mock("@/providers/session", () => ({
  useSession: jest.fn(() => ({ session: null })),
}));
jest.mock("@/components/footer", () => () => <></>);
jest.mock("@/components/EditScreenInfo", () => () => <></>);
jest.mock("@/components/Themed", () => ({
  Text: (props: any) => <>{props.children}</>,
  View: (props: any) => <>{props.children}</>,
}));
jest.mock("expo-status-bar", () => ({
  StatusBar: () => <></>,
}));

describe("HomeScreen Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all buttons and footer correctly", () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText("Learning Material! 🧠")).toBeTruthy();
    expect(getByText("Flashcards! 🧠")).toBeTruthy();
    expect(getByText("Quiz! 🧠")).toBeTruthy();
    expect(getByText("Simulated Attack Challenges! 🧠")).toBeTruthy();
    expect(getByText("Social Engineering Best Practices! 🧠")).toBeTruthy();
  });

  it('navigates to learning screen when "Learning Material!" button is pressed', () => {
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText("Learning Material! 🧠"));
    expect(router.push).toHaveBeenCalledWith("/(app)/learning");
  });

  it('navigates to flashcards screen when "Flashcards!" button is pressed', () => {
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText("Flashcards! 🧠"));
    expect(router.push).toHaveBeenCalledWith("/(app)/flashcards");
  });

  it('navigates to quiz screen when "Quiz!" button is pressed', () => {
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText("Quiz! 🧠"));
    expect(router.push).toHaveBeenCalledWith("/(app)/quiz");
  });

  it('navigates to simulated attack screen when "Simulated Attack Challenges!" button is pressed', () => {
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText("Simulated Attack Challenges! 🧠"));
    expect(router.push).toHaveBeenCalledWith("/(app)/simulate");
  });

  it('navigates to best practices screen when "Social Engineering Best Practices!" button is pressed', () => {
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText("Social Engineering Best Practices! 🧠"));
    expect(router.push).toHaveBeenCalledWith("/(app)/best-pratices");
  });
});
