import React, { useState, useEffect, Component } from "react";
import {
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
  TextInput,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
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

interface RedFlagElement {
  text: string;
  isRedFlag: boolean;
  explanation: string;
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

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

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

  // Red Flag state
  const [selectedRedFlags, setSelectedRedFlags] = useState<string[]>([]);

  // Password Strength state
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordStrength, setPasswordStrength] = useState<string>("");
  const [passwordFeedback, setPasswordFeedback] = useState<string>("");

  // Drag & Drop state
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [draggedAnswer, setDraggedAnswer] = useState<string | null>(null);
  const [dragItems, setDragItems] = useState<
    { id: string; text: string; position: { x: number; y: number } }[]
  >([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const query =
          selectedType === "All"
            ? "SELECT * FROM quizzes"
            : "SELECT * FROM quizzes WHERE type = ?";
        const params = selectedType === "All" ? [] : [selectedType];
        const results = await db.getAllAsync<Quiz>(query, params);
        // Shuffle the quizzes array
        const shuffledQuizzes = shuffleArray(results);
        setQuizzes(shuffledQuizzes);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setFeedback(null);
        setIsCorrect(null);
        setCorrectCount(0);
        setQuestionCount(0);
        setAttemptId(Date.now().toString());
        setDragItems([]);
        setSelectedRedFlags([]);
        setPasswordInput("");
        setPasswordFeedback("");
        setPasswordStrength("");
      } catch (error: any) {
        console.error("Error fetching quizzes:", error);
        Alert.alert("Error", "Failed to load quizzes. Please try again.");
      }
    };
    fetchQuizzes();
  }, [db, selectedType]);

  // Update answer options or reset states when question changes
  useEffect(() => {
    if (quizzes.length > 0 && currentIndex < quizzes.length) {
      const currentQuiz = quizzes[currentIndex];
      if (
        currentQuiz.type === "mcq" ||
        currentQuiz.type === "red_flag" ||
        currentQuiz.type === "password_strength"
      ) {
        const incorrect = currentQuiz.incorrect_answers.split(",");
        const options = [currentQuiz.correct_answer, ...incorrect].sort(
          () => Math.random() - 0.5
        );
        setAnswerOptions(options);
      } else {
        setAnswerOptions([]);
      }
      setSelectedAnswer(null);
      setFeedback(null);
      setIsCorrect(null);
      translateX.value = 0;
      translateY.value = 0;
      setDraggedAnswer(null);
      setSelectedRedFlags([]);
      setPasswordInput("");
      setPasswordFeedback("");
      setPasswordStrength("");
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

  // Password strength validation
  const evaluatePasswordStrength = (
    password: string
  ): { strength: string; feedback: string } => {
    const hasLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let strength = "Weak";
    let feedback = "Too short! Add more characters.";

    if (hasLength) {
      const criteriaMet = [
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSymbols,
      ].filter(Boolean).length;
      if (criteriaMet >= 4 && password.length >= 12) {
        strength = "Strong";
        feedback = "Great! Includes numbers, symbols, and mixed case!";
      } else if (criteriaMet >= 2) {
        strength = "Moderate";
        feedback = "Good, but add more variety (e.g., symbols or numbers).";
      } else {
        strength = "Weak";
        feedback = "Too simple! Add uppercase, numbers, or symbols.";
      }
    }

    return { strength, feedback };
  };

  const handleSubmit = async () => {
    if (
      !selectedAnswer &&
      !draggedAnswer &&
      currentQuiz?.type !== "drag_drop" &&
      currentQuiz?.type !== "red_flag" &&
      currentQuiz?.type !== "password_strength"
    ) {
      Alert.alert("Error", "Please select an answer.");
      return;
    }

    if (!currentQuiz) return;

    let isAnswerCorrect = false;
    let answer = selectedAnswer;

    if (currentQuiz.type === "drag_drop") {
      if (!draggedAnswer) {
        Alert.alert("Error", "Please drag the item to Safe or Scam.");
        return;
      }
      answer = draggedAnswer;
      isAnswerCorrect = answer === currentQuiz.correct_answer;
      setFeedback(
        isAnswerCorrect
          ? `Correct! ${currentQuiz.explanation}`
          : `Incorrect. The correct answer is "${currentQuiz.correct_answer}". ${currentQuiz.explanation}`
      );
    } else if (currentQuiz.type === "red_flag") {
      if (!selectedRedFlags.length) {
        Alert.alert("Error", "Please select at least one red flag.");
        return;
      }
      let redFlags: RedFlagElement[] = [];
      try {
        redFlags = currentQuiz.incorrect_answers
          ? JSON.parse(currentQuiz.incorrect_answers)
          : [];
      } catch (error: any) {
        console.warn("Falling back to comma-separated red flags:", error);
        const elements = currentQuiz.incorrect_answers
          ? currentQuiz.incorrect_answers
              .split(",")
              .filter((e) => e.trim() !== "")
          : [];
        redFlags = elements.map((text, index) => ({
          text,
          isRedFlag: index < parseInt(currentQuiz.correct_answer),
          explanation: `Element "${text}" is ${
            index < parseInt(currentQuiz.correct_answer)
              ? "suspicious"
              : "normal"
          }.`,
        }));
      }

      const correctRedFlags = redFlags
        .filter((flag) => flag.isRedFlag)
        .map((flag) => flag.text);
      const allCorrect =
        selectedRedFlags.length === parseInt(currentQuiz.correct_answer) &&
        correctRedFlags.every((flag) => selectedRedFlags.includes(flag)) &&
        selectedRedFlags.every((flag) => correctRedFlags.includes(flag));
      isAnswerCorrect = allCorrect;
      const explanations = selectedRedFlags
        .map((flag) => {
          const element = redFlags.find((e) => e.text === flag);
          return element ? `${flag}: ${element.explanation}` : "";
        })
        .join("\n");
      setFeedback(
        isAnswerCorrect
          ? `Correct! You identified all red flags.\n${explanations}`
          : `Incorrect. You missed some red flags or selected incorrect ones.\n${explanations}\nCorrect red flags: ${correctRedFlags.join(
              ", "
            )}.`
      );
    } else if (currentQuiz.type === "password_strength") {
      if (!passwordInput.length) {
        Alert.alert("Error", "Please enter password.");
        return;
      }
      const { strength } = evaluatePasswordStrength(passwordInput);
      isAnswerCorrect = strength === currentQuiz.correct_answer;
      answer = passwordInput;
      setFeedback(
        isAnswerCorrect
          ? `Correct! This password is ${strength}. ${currentQuiz.explanation}`
          : `Incorrect. The password is ${strength}, but a ${currentQuiz.correct_answer} password is required. ${currentQuiz.explanation}`
      );
    } else {
      isAnswerCorrect = selectedAnswer === currentQuiz.correct_answer;
      setFeedback(
        isAnswerCorrect
          ? `Correct! ${currentQuiz.explanation}`
          : `Incorrect. The correct answer is "${currentQuiz.correct_answer}". ${currentQuiz.explanation}`
      );
    }

    setIsCorrect(isAnswerCorrect);
    feedbackOpacity.value = withSpring(1);

    const newQuestionCount = questionCount + 1;
    const newCorrectCount = correctCount + (isAnswerCorrect ? 1 : 0);
    setQuestionCount(newQuestionCount);
    setCorrectCount(newCorrectCount);

    const totalQuestions = Math.min(quizzes.length, QUESTIONS_PER_ATTEMPT);

    if (newQuestionCount >= totalQuestions) {
      await logQuizScore(currentQuiz.type, newCorrectCount, totalQuestions);
      Alert.alert(
        "Attempt Completed",
        `You scored ${newCorrectCount}/${totalQuestions} in this ${currentQuiz.type} quiz.`,
        [
          {
            text: "OK",
            onPress: () => {
              setQuizzes(shuffleArray<Quiz>(quizzes));
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
              setSelectedRedFlags([]);
              setPasswordInput("");
              setPasswordFeedback("");
              setPasswordStrength("");
              setStart(false);
            },
          },
        ]
      );
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
    setSelectedRedFlags([]);
    setPasswordInput("");
    setPasswordFeedback("");
    setPasswordStrength("");
  };

  const handleStartAgain = () => {
    setQuizzes(shuffleArray<Quiz>(quizzes));
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
    setSelectedRedFlags([]);
    setPasswordInput("");
    setPasswordFeedback("");
    setPasswordStrength("");
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
      case "red_flag":
        let redFlags: RedFlagElement[] = [];
        try {
          // Try parsing as JSON
          redFlags = currentQuiz.incorrect_answers
            ? JSON.parse(currentQuiz.incorrect_answers)
            : [];
        } catch (error: any) {
          // Fallback: Treat as comma-separated string
          console.warn("Falling back to comma-separated red flags:", error);
          const elements = currentQuiz.incorrect_answers
            ? currentQuiz.incorrect_answers
                .split(",")
                .filter((e) => e.trim() !== "")
            : [];
          redFlags = elements.map((text, index) => ({
            text,
            isRedFlag: index < parseInt(currentQuiz.correct_answer), // Assume first N elements are red flags based on correct_answer
            explanation: `Element "${text}" is ${
              index < parseInt(currentQuiz.correct_answer)
                ? "suspicious"
                : "normal"
            }.`,
          }));
        }
        return (
          <View style={styles.redFlagContainer}>
            <Text style={styles.dragInstruction}>
              Tap on suspicious parts of the message
            </Text>
            {redFlags.map((element, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.redFlagElement,
                  selectedRedFlags.includes(element.text) &&
                    styles.redFlagSelected,
                ]}
                onPress={() => {
                  if (selectedRedFlags.includes(element.text)) {
                    setSelectedRedFlags(
                      selectedRedFlags.filter((flag) => flag !== element.text)
                    );
                  } else {
                    setSelectedRedFlags([...selectedRedFlags, element.text]);
                  }
                }}
                disabled={feedback !== null}
              >
                <Text style={styles.redFlagText}>{element.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case "password_strength":
        return (
          <View style={styles.passwordContainer}>
            <Text style={styles.dragInstruction}>Enter password</Text>
            <TextInput
              style={styles.passwordInput}
              value={passwordInput}
              onChangeText={(text) => {
                setPasswordInput(text);
                const { strength, feedback } = evaluatePasswordStrength(text);
                setPasswordStrength(strength);
                setPasswordFeedback(feedback);
              }}
              secureTextEntry
              placeholder="Type your password"
              placeholderTextColor="#666"
            />
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
                <>
                  {currentQuiz.type === "password_strength" && (
                    <View
                      style={{
                        alignItems: "center",
                        marginVertical: 10,
                        width: "100%",
                      }}
                    >
                      <View style={styles.strengthMeter}>
                        <View
                          style={[
                            styles.strengthBar,
                            passwordStrength === "Weak" && styles.strengthWeak,
                            passwordStrength === "Moderate" &&
                              styles.strengthMedium,
                            passwordStrength === "Strong" &&
                              styles.strengthStrong,
                            { width: passwordStrength ? "100%" : "0%" },
                          ]}
                        />
                      </View>
                      <Text style={styles.passwordFeedback}>
                        {passwordFeedback}
                      </Text>
                    </View>
                  )}
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
                </>
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
  redFlagContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  redFlagElement: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  redFlagSelected: {
    borderColor: "#dc3545",
    backgroundColor: "#ffe6e6",
  },
  redFlagText: {
    fontSize: 16,
    color: "#333",
  },
  passwordContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  passwordInput: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginVertical: 10,
    fontSize: 16,
    color: "#333",
  },
  strengthMeter: {
    width: "100%",
    height: 10,
    backgroundColor: "#ccc",
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: 10,
  },
  strengthBar: {
    height: "100%",
    borderRadius: 5,
  },
  strengthWeak: {
    backgroundColor: "#dc3545",
  },
  strengthMedium: {
    backgroundColor: "#ffc107",
  },
  strengthStrong: {
    backgroundColor: "#28a745",
  },
  passwordFeedback: {
    fontSize: 14,
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
