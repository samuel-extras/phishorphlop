import React, { useState, useEffect, Component } from "react";
import {
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { router, Stack } from "expo-router";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSession } from "@/providers/session";
import Footer from "@/components/footer";

const { width } = Dimensions.get("window");

interface Quiz {
  id: number;
  question: string;
  correct_answer: string;
  incorrect_answers: string;
  explanation: string;
  category: string;
  type: string;
}

interface CustomRadioButtonProps {
  value: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  label: string;
}

interface User {
  id: number;
  username: string;
  quizScores: string;
  simulationScores: string;
}

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Something went wrong: {this.state.error}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.errorButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const CustomRadioButton: React.FC<CustomRadioButtonProps> = ({
  value,
  selected,
  onPress,
  disabled,
  label,
}) => {
  return (
    <TouchableOpacity
      style={styles.option}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Option ${label}`}
    >
      <View style={[styles.radioCircle, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInnerCircle} />}
      </View>
      <Text style={styles.optionText}>{label}</Text>
    </TouchableOpacity>
  );
};
const QUESTIONS_PER_ATTEMPT = 10;

export default function QuizScreen() {
  const [start, setStart] = useState<boolean>(false);
  const db = useSQLiteContext();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [selectedType, setSelectedType] = useState<string>("All");
  const [answerOptions, setAnswerOptions] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [attemptId, setAttemptId] = useState<string>("");
  const feedbackOpacity = useSharedValue(0);
  const { session } = useSession();

  // Drag & Drop state
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [draggedAnswer, setDraggedAnswer] = useState<string | null>(null);
  const [dragItems, setDragItems] = useState<
    { id: string; text: string; position: { x: number; y: number } }[]
  >([]);
  const [dropZone, setDropZone] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const query =
          selectedType === "All"
            ? "SELECT * FROM quizzes"
            : "SELECT * FROM quizzes WHERE type = ?";
        const params = selectedType === "All" ? [] : [selectedType];
        const results = await db.getAllAsync<Quiz>(query, params);
        setQuizzes(results);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setFeedback(null);
        setIsCorrect(null);
        setCorrectCount(0);
        setQuestionCount(0);
        setAttemptId(Date.now().toString());
        setDragItems([]);
      } catch (error: any) {
        console.error("Error fetching quizzes:", error);
        Alert.alert("Error", "Failed to load quizzes. Please try again.");
      }
    };
    fetchQuizzes();
  }, [db, selectedType]);

  // Update answer options when question changes
  useEffect(() => {
    if (quizzes.length > 0 && currentIndex < quizzes.length) {
      const currentQuiz = quizzes[currentIndex];
      const incorrect = currentQuiz.incorrect_answers.split(",");
      const options = [currentQuiz.correct_answer, ...incorrect].sort(
        () => Math.random() - 0.5
      );
      setAnswerOptions(options);
      setSelectedAnswer(null);
      setFeedback(null);
      setIsCorrect(null);
      translateX.value = 0;
      translateY.value = 0;
      setDraggedAnswer(null);
    }
  }, [currentIndex, quizzes]);

  const currentQuiz = quizzes[currentIndex];

  const logQuizScore = async (
    type: string,
    score: number,
    totalQuestions: number
  ) => {
    try {
      if (!session) {
        console.error("No session available");
        Alert.alert("Error", "Please log in to continue.");
        return;
      }
      const userId = Number(session.split(",")[0]);
      if (isNaN(userId)) {
        console.error("Invalid user ID from session");
        Alert.alert("Error", "Invalid session. Please log in again.");
        return;
      }
      const user = await db.getFirstAsync<User>(
        "SELECT * FROM users WHERE id = ?",
        [userId]
      );
      if (!user) {
        console.error("User not found");
        return;
      }
      const quizScores = JSON.parse(user.quizScores || "[]");
      quizScores.push({
        attempt_id: attemptId,
        type,
        score,
        total_questions: totalQuestions,
        attempt_date: new Date().toISOString(),
      });
      await db.runAsync("UPDATE users SET quizScores = ? WHERE id = ?", [
        JSON.stringify(quizScores),
        userId,
      ]);
      console.log("Logged quiz score:", {
        attemptId,
        type,
        score,
        totalQuestions,
      });
    } catch (error: any) {
      console.error("Error logging quiz score:", error);
    }
  };

  // const handleSubmit = () => {
  //   if (!selectedAnswer && !draggedAnswer) {
  //     Alert.alert("Error", "Please select or drag an answer.");
  //     return;
  //   }

  //   const answer = draggedAnswer || selectedAnswer;
  //   if (!currentQuiz) return;
  //   const isAnswerCorrect = answer === currentQuiz.correct_answer;
  //   setIsCorrect(isAnswerCorrect);
  //   setFeedback(
  //     isAnswerCorrect
  //       ? "Correct! " + currentQuiz.explanation
  //       : `Incorrect. The correct answer is "${currentQuiz.correct_answer}". ${currentQuiz.explanation}`
  //   );
  //   if (currentQuiz.type === "drag_drop") {
  //     translateX.value = 0;
  //     translateY.value = 0;
  //     setDraggedAnswer(null);
  //   }
  // };

  const handleSubmit = async () => {
    if (
      !selectedAnswer &&
      !draggedAnswer &&
      currentQuiz?.type !== "drag_drop"
    ) {
      Alert.alert("Error", "Please select an answer.");
      return;
    }

    if (!currentQuiz) return;

    let isAnswerCorrect = false;
    let answer = selectedAnswer;

    if (currentQuiz.type === "drag_drop") {
      answer = draggedAnswer;
      if (answer) {
        isAnswerCorrect = answer === currentQuiz.correct_answer;
      }
    } else {
      isAnswerCorrect = selectedAnswer === currentQuiz.correct_answer;
    }

    if (!answer) {
      Alert.alert("Error", "Please select or drag an answer.");
      return;
    }

    setIsCorrect(isAnswerCorrect);
    setFeedback(
      isAnswerCorrect
        ? "Correct! " + currentQuiz.explanation
        : `Incorrect. The correct answer is "${currentQuiz.correct_answer}". ${currentQuiz.explanation}`
    );
    feedbackOpacity.value = withSpring(1);

    const newQuestionCount = questionCount + 1;
    const newCorrectCount = correctCount + (isAnswerCorrect ? 1 : 0);
    setQuestionCount(newQuestionCount);
    setCorrectCount(newCorrectCount);

    const totalQuestions = Math.min(quizzes.length, QUESTIONS_PER_ATTEMPT);

    if (newQuestionCount >= totalQuestions) {
      // End of attempt
      await logQuizScore(currentQuiz.type, newCorrectCount, totalQuestions);
      Alert.alert(
        "Attempt Completed",
        `You scored ${newCorrectCount}/${totalQuestions} in this ${currentQuiz.type} quiz.`,
        [
          {
            text: "OK",
            onPress: () => {
              setCurrentIndex(0);
              setCorrectCount(0);
              setQuestionCount(0);
              setAttemptId(Date.now().toString());
              setSelectedAnswer(null);
              setFeedback(null);
              setIsCorrect(null);
              feedbackOpacity.value = 0;
              translateX.value = 0;
              translateY.value = 0;
              setDraggedAnswer(null);
              setDragItems([]);
              setStart(false);
            },
          },
        ]
      );
    }

    if (currentQuiz.type === "drag_drop") {
      translateX.value = 0;
      translateY.value = 0;
      setDraggedAnswer(null);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % quizzes.length);
    setSelectedAnswer(null);
    setFeedback(null);
    setIsCorrect(null);
    translateX.value = 0;
    translateY.value = 0;
    setDraggedAnswer(null);
  };

  const handleStartAgain = () => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setQuestionCount(0);
    setAttemptId(Date.now().toString());
    setSelectedAnswer(null);
    setFeedback(null);
    setIsCorrect(null);
    feedbackOpacity.value = 0;
    translateX.value = 0;
    translateY.value = 0;
    setDraggedAnswer(null);
    setDragItems([]);
    setStart(false);
  };

  // Drag & Drop gesture handler
  const onGestureEvent = (event: any) => {
    translateX.value = event.nativeEvent.translationX;
    translateY.value = event.nativeEvent.translationY;
  };

  const onHandlerStateChange = (event: any) => {
    if (
      event.nativeEvent.state === State.END &&
      currentQuiz?.type === "drag_drop"
    ) {
      const x = event.nativeEvent.absoluteX;
      const halfScreen = width / 2;
      const answer = x > halfScreen ? "Scam" : "Safe";
      setDraggedAnswer(answer);
      translateX.value = withSpring(x > halfScreen ? 100 : -100);
      // translateY.value = withSpring(0);
    }
  };

  const dragItemStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const renderQuizContent = () => {
    if (!currentQuiz) return null;

    switch (currentQuiz.type) {
      case "mcq":
      case "red_flag":
      case "password_strength":
        return (
          <View style={styles.optionsContainer}>
            {answerOptions.map((option, index) => (
              <CustomRadioButton
                key={index}
                value={option}
                selected={selectedAnswer === option}
                onPress={() => setSelectedAnswer(option)}
                disabled={feedback !== null}
                label={option}
              />
            ))}
          </View>
        );
      case "drag_drop":
        return (
          <View style={styles.dragDropContainer}>
            <Text style={styles.dragInstruction}>Drag to Safe or Scam</Text>
            <View style={styles.dropZones}>
              <View style={[styles.dropZone, styles.safeZone]}>
                <Text style={styles.dropZoneText}>Safe</Text>
              </View>
              <View style={[styles.dropZone, styles.scamZone]}>
                <Text style={styles.dropZoneText}>Scam</Text>
              </View>
            </View>
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
              enabled={feedback === null}
            >
              <Animated.View style={[styles.dragItem, dragItemStyle]}>
                <Text style={{ color: "#000", fontWeight: "900" }}>
                  {draggedAnswer}
                </Text>
                <Text style={styles.dragItemText}>{currentQuiz.question}</Text>
              </Animated.View>
            </PanGestureHandler>
          </View>
        );
      default:
        return null;
    }
  };

  if (!start) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerRight: () => (
              <Text
                style={{ color: "#000", fontWeight: "900" }}
              >{`${"Quiz"}`}</Text>
            ),
          }}
        />
        {/* Use a light status bar on iOS to account for the black space above the modal */}
        <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
        <View
          style={{
            flex: 1,
            width: "100%",
            paddingHorizontal: 8,
            paddingTop: 10,
            paddingBottom: 20,
            justifyContent: "center",
            rowGap: 40,
          }}
        >
          <Text
            style={{
              color: "#000000",
              fontSize: 32,
              fontWeight: "900",
              textAlign: "center",
              marginHorizontal: 40,
            }}
          >
            Welcome To The Quiz Zone! 🧠
          </Text>
          <View
            style={{
              backgroundColor: "#000",
              height: "auto",
              paddingVertical: 10,
              paddingHorizontal: 6,
              borderRadius: 2,
              marginTop: 10,
              rowGap: 16,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: "900",
                textAlign: "center",
                marginBottom: 18,
              }}
            >
              Think you can spot a scam? Prove it.
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Here you’ll test your skills with fun, fast-paced challenges like:
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Scenario Challenges – What would you do?
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Password Strength – Rank the strongest passwords.
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Safe or Scam? – Drag-and-drop your way to safety.
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: "900",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Red Flag Finder – Spot the phishing traps.
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: "900",
                textAlign: "center",
                marginBottom: 18,
              }}
            >
              Get instant feedback, earn points, and level up your scam-spotting
              skills.
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Tap Start when you’re ready to show off what you know! Good Luck!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setStart(true)}
          >
            <Text style={styles.buttonText}>Start! </Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ScrollView style={[styles.container, { padding: 20 }]}>
          <Text style={styles.title}>Quiz Time!</Text>
          <Text style={styles.subtitle}>
            Test your knowledge on phishing and social engineering.
          </Text>

          {quizzes.length > 0 && currentQuiz ? (
            <View style={styles.quizContainer}>
              <Text style={styles.progressText}>
                Question {questionCount + 1} of{" "}
                {Math.min(quizzes.length, QUESTIONS_PER_ATTEMPT)}
              </Text>
              <Text style={styles.question}>
                {currentIndex + 1}. {currentQuiz.question}
              </Text>
              <Text style={styles.category}>
                Category: {currentQuiz.category}
              </Text>
              {renderQuizContent()}
              {feedback ? (
                <View
                  style={[
                    styles.feedbackContainer,
                    isCorrect
                      ? styles.correctFeedback
                      : styles.incorrectFeedback,
                  ]}
                >
                  <Text style={styles.feedbackText}>{feedback}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              )}
              <View style={styles.navigationContainer}>
                {currentIndex !== 0 && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={handleStartAgain}
                  >
                    <Text style={styles.navButtonText}>Start again</Text>
                  </TouchableOpacity>
                )}
                {feedback && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={handleNext}
                  >
                    <Text style={styles.navButtonText}>Next Question</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.noQuizzes}>
              No quizzes available for this type.
            </Text>
          )}
        </ScrollView>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  button: {
    backgroundColor: "#1E1E1E",
    height: "auto",
    paddingVertical: 18,
    paddingHorizontal: 60,

    borderRadius: 100,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    marginRight: 10,
    color: "#333",
  },
  picker: {
    flex: 1,
    height: 44,
  },
  quizContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  question: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  category: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioSelected: {
    borderColor: "#007AFF",
  },
  radioInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#007AFF",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  dragDropContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  dragInstruction: {
    fontSize: 16,
    color: "#333",
    marginBottom: 15,
  },
  dropZones: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  dropZone: {
    width: "45%",
    height: 100,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  safeZone: {
    borderColor: "#28a745",
    backgroundColor: "#e6ffed",
  },
  scamZone: {
    borderColor: "#dc3545",
    backgroundColor: "#ffe6e6",
  },
  dropZoneText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  dragItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: "90%",
    alignItems: "center",
  },
  dragItemText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  feedbackContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  correctFeedback: {
    backgroundColor: "#e6ffed",
    borderColor: "#28a745",
    borderWidth: 1,
  },
  incorrectFeedback: {
    backgroundColor: "#ffe6e6",
    borderColor: "#dc3545",
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 16,
    color: "#333",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navButton: {
    backgroundColor: "#666",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  noQuizzes: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 18,
    color: "#dc3545",
    marginBottom: 20,
    textAlign: "center",
  },
  errorButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
});
