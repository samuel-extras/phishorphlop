import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ExternalPathString } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useSession } from "@/providers/session";

interface User {
  id: number;
  username: string;
  simulationScores: string;
}

export default function FeedbackScreen() {
  const params = useLocalSearchParams();
  const db = useSQLiteContext();
  const [attemptId, setAttemptId] = useState<string>("");
  const { session } = useSession();

  useEffect(() => {
    setAttemptId(Date.now().toString());
  }, [db]);

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

  const handleSubmit = async (newCorrectCount: number) => {
    await logAttackScore("all", newCorrectCount, 3);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {params.correct === "true" ? (
          <Feather name="check-circle" size={48} color="#16A34A" />
        ) : (
          <Feather name="alert-triangle" size={48} color="#DC2626" />
        )}
      </View>
      <Text style={styles.title}>
        {params.correct === "true" ? "Well Done!" : "Be Careful!"}
      </Text>
      <Text style={styles.explanation}>{params.explanation}</Text>
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Security Tips:</Text>
        {(params?.tips as string)
          .split(",")
          .map((tip: string, index: number) => (
            <View key={index} style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
      </View>
      {params.completed ? (
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: `/(app)/simulate/${
                params.next ? params.next : ""
              }` as ExternalPathString,
              params: {
                score: Number(params.score ? params.score : 0),
                completed: params.completed,
              },
            });
            handleSubmit(Number(params.score));
          }}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Submit</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: `/(app)/simulate/${
                params.next ? params.next : ""
              }` as ExternalPathString,
              params: {
                score: Number(params.score ? params.score : 0),
                completed: params.completed,
              },
            })
          }
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Continue Training</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  iconContainer: { marginBottom: 16 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  explanation: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  tipsContainer: {
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 8,
    width: "100%",
    maxWidth: 320,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 8,
  },
  tipItem: { flexDirection: "row", gap: 8, marginBottom: 4 },
  tipBullet: { fontSize: 14, color: "#1E40AF" },
  tipText: { fontSize: 14, color: "#1E40AF" },
  continueButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  continueButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
