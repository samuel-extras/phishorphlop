import React, { useState, useEffect, Component } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { router, Stack } from "expo-router";
import { useSession } from "@/providers/session";

interface Attack {
  id: number;
  scenario: string;
  attack_type: string;
  correct_action: string;
  incorrect_actions: string;
  explanation: string;
}

interface User {
  id: number;
  username: string;
  simulationScores: string;
}

interface CustomRadioButtonProps {
  value: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  label: string;
}

const QUESTIONS_PER_ATTEMPT = 5;

// Error Boundary
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
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 100 }) }],
  }));

  const handlePress = () => {
    scale.value = 0.95;
    setTimeout(() => (scale.value = 1), 100);
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.option}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Option ${label}`}
    >
      <Animated.View style={[animatedStyle]}>
        <View style={[styles.radioCircle, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioInnerCircle} />}
        </View>
      </Animated.View>
      <Text style={styles.optionText}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function SimulatedAttackScreen() {
  const db = useSQLiteContext();
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [attemptId, setAttemptId] = useState<string>("");
  const [isAttemptComplete, setIsAttemptComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const feedbackOpacity = useSharedValue(0);
  const { session } = useSession();

  useEffect(() => {
    const fetchAttacks = async () => {
      setIsLoading(true);
      try {
        const query = "SELECT * FROM simulated_attacks";
        const results = await db.getAllAsync<Attack>(query);
        console.log("Fetched attacks:", results);
        setAttacks(results);
        setCurrentIndex(0);
        setSelectedAction(null);
        setFeedback(null);
        setIsCorrect(null);
        setCorrectCount(0);
        setQuestionCount(0);
        setAttemptId(Date.now().toString());
        setIsAttemptComplete(false);
      } catch (error: any) {
        console.error("Error fetching attacks:", error);
        Alert.alert("Error", "Failed to load challenges. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttacks();
  }, [db]);

  useEffect(() => {
    if (attacks.length > 0 && currentIndex < attacks.length) {
      const currentAttack = attacks[currentIndex];
      const incorrect = currentAttack.incorrect_actions
        ? currentAttack.incorrect_actions
            .split(",")
            .filter((action) => action.trim())
        : [];
      const options = [currentAttack.correct_action, ...incorrect].sort(
        () => Math.random() - 0.5
      );
      setActionOptions(options);
      setSelectedAction(null);
      setFeedback(null);
      setIsCorrect(null);
      feedbackOpacity.value = 0;
    }
  }, [currentIndex, attacks]);

  const currentAttack = attacks[currentIndex];

  const logAttackScore = async (
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
        Alert.alert("Error", "User not found. Please log in again.");
        return;
      }
      let simulationScores: any[] = [];
      try {
        simulationScores = JSON.parse(user.simulationScores || "[]");
      } catch (error) {
        console.error("Error parsing simulationScores:", error);
      }
      simulationScores.push({
        attempt_id: attemptId,
        type,
        score,
        total_questions: totalQuestions,
        attempt_date: new Date().toISOString(),
      });
      await db.runAsync("UPDATE users SET simulationScores = ? WHERE id = ?", [
        JSON.stringify(simulationScores),
        userId,
      ]);
      console.log("Logged attack score:", {
        attemptId,
        type,
        score,
        totalQuestions,
      });
    } catch (error: any) {
      console.error("Error logging attack score:", error);
      Alert.alert("Error", "Failed to save score. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!selectedAction) {
      Alert.alert("Error", "Please select an action.");
      return;
    }
    if (!currentAttack || isAttemptComplete) return;

    const isAnswerCorrect = selectedAction === currentAttack.correct_action;
    setIsCorrect(isAnswerCorrect);
    setFeedback(
      isAnswerCorrect
        ? "Correct! " + currentAttack.explanation
        : `Incorrect. The correct action is "${currentAttack.correct_action}". ${currentAttack.explanation}`
    );
    feedbackOpacity.value = withTiming(1, { duration: 300 });

    const newQuestionCount = questionCount + 1;
    const newCorrectCount = correctCount + (isAnswerCorrect ? 1 : 0);
    setQuestionCount(newQuestionCount);
    setCorrectCount(newCorrectCount);

    const totalQuestions = Math.min(attacks.length, QUESTIONS_PER_ATTEMPT);
    if (newQuestionCount >= totalQuestions) {
      await logAttackScore(
        currentAttack.attack_type,
        newCorrectCount,
        totalQuestions
      );
      setIsAttemptComplete(true);
    }
  };

  const handlePrev = () => {
    if (isAttemptComplete || questionCount >= QUESTIONS_PER_ATTEMPT - 1) return;
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setSelectedAction(null);
    setFeedback(null);
    setIsCorrect(null);
    feedbackOpacity.value = 0;
  };

  const handleNext = () => {
    if (isAttemptComplete || questionCount >= QUESTIONS_PER_ATTEMPT) return;
    const totalQuestions = Math.min(attacks.length, QUESTIONS_PER_ATTEMPT);
    if (questionCount < totalQuestions) {
      setCurrentIndex((prev) => {
        const newIndex = Math.min(prev + 1, attacks.length - 1);
        console.log("Navigating to index:", newIndex);
        return newIndex;
      });
    }
    setSelectedAction(null);
    setFeedback(null);
    setIsCorrect(null);
    feedbackOpacity.value = 0;
  };

  const handleRetry = () => {
    setSelectedAction(null);
    setFeedback(null);
    setIsCorrect(null);
    feedbackOpacity.value = 0;
  };

  const startNewAttempt = () => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setQuestionCount(0);
    setAttemptId(Date.now().toString());
    setSelectedAction(null);
    setFeedback(null);
    setIsCorrect(null);
    setIsAttemptComplete(false);
    feedbackOpacity.value = 0;
  };

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
  }));

  const renderAttackContent = () => {
    if (isLoading) {
      return <Text style={styles.noAttacks}>Loading challenges...</Text>;
    }
    if (!currentAttack || attacks.length === 0) {
      return <Text style={styles.noAttacks}>No challenges available.</Text>;
    }

    const totalQuestions = Math.min(attacks.length, QUESTIONS_PER_ATTEMPT);
    const displayQuestionNumber = Math.min(questionCount + 1, totalQuestions);

    return (
      <View style={styles.scenarioContainer}>
        <Text style={styles.progressText}>
          Question {displayQuestionNumber} of {totalQuestions}
        </Text>
        <Text style={styles.scenarioType}>
          {currentAttack.attack_type.toUpperCase()} Attack
        </Text>
        <Text style={styles.scenarioText}>{currentAttack.scenario}</Text>
        <View style={styles.optionsContainer}>
          {actionOptions.map((option, index) => (
            <CustomRadioButton
              key={index}
              value={option}
              selected={selectedAction === option}
              onPress={() => setSelectedAction(option)}
              disabled={feedback !== null || isAttemptComplete}
              label={option}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderAttemptComplete = () => {
    const totalQuestions = Math.min(attacks.length, QUESTIONS_PER_ATTEMPT);
    return (
      <View style={styles.scenarioContainer}>
        <Text style={styles.scenarioType}>Attempt Completed</Text>
        <Text style={styles.scenarioText}>
          You scored {correctCount}/{totalQuestions} in this{" "}
          {currentAttack?.attack_type || "attack"} simulation.
        </Text>
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.dismissTo("/")}
          >
            <Text style={styles.navButtonText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={startNewAttempt}>
            <Text style={styles.navButtonText}>Start New Attempt</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ErrorBoundary>
        <Stack.Screen
          options={{
            headerRight: () => (
              <Text style={{ color: "#000", fontWeight: "900" }}>
                Simulated Attack
              </Text>
            ),
            headerLeft: () => (
              <TouchableOpacity
                style={{
                  backgroundColor: "#1E1E1E",
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                }}
                onPress={() => router.dismissAll()}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>Home</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <Text style={styles.title}>Simulated Attack Challenges</Text>
        <Text style={styles.subtitle}>
          Practice recognizing real-world social engineering attacks.
        </Text>
        {isAttemptComplete ? (
          renderAttemptComplete()
        ) : (
          <View>
            {renderAttackContent()}
            {!isAttemptComplete && !feedback && attacks.length > 0 && (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            )}
            {!isAttemptComplete && feedback && (
              <Animated.View
                style={[
                  styles.feedbackContainer,
                  isCorrect ? styles.correctFeedback : styles.incorrectFeedback,
                  feedbackStyle,
                ]}
              >
                <Text style={styles.feedbackText}>{feedback}</Text>
              </Animated.View>
            )}
            {!isAttemptComplete && feedback && (
              <View style={styles.navigationContainer}>
                {currentIndex > 0 &&
                  questionCount < QUESTIONS_PER_ATTEMPT - 1 && (
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={handlePrev}
                    >
                      <Text style={styles.navButtonText}>
                        Previous Challenge
                      </Text>
                    </TouchableOpacity>
                  )}
                {!isCorrect && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={handleRetry}
                  >
                    <Text style={styles.navButtonText}>Try Again</Text>
                  </TouchableOpacity>
                )}
                {questionCount < QUESTIONS_PER_ATTEMPT && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={handleNext}
                  >
                    <Text style={styles.navButtonText}>Next Challenge</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </ErrorBoundary>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  scenarioContainer: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  scenarioType: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  scenarioText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
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
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  feedbackContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  correctFeedback: {
    backgroundColor: "#E6FFED",
    borderColor: "#28A745",
  },
  incorrectFeedback: {
    backgroundColor: "#FFE6E6",
    borderColor: "#DC3545",
  },
  feedbackText: {
    fontSize: 16,
    color: "#333",
  },
  navigationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  navButton: {
    backgroundColor: "#666",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
    marginVertical: 4,
    minWidth: 100,
  },
  navButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  noAttacks: {
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
    backgroundColor: "#F5F5F5",
  },
  errorText: {
    fontSize: 18,
    color: "#DC3545",
    marginBottom: 20,
    textAlign: "center",
  },
  errorButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
