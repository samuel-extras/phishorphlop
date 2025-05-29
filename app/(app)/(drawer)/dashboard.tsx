import { StatusBar } from "expo-status-bar";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router"; // Import useFocusEffect
import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { useSession } from "@/providers/session";
import React, { useState, useCallback } from "react"; // Import useCallback
import { useSQLiteContext } from "expo-sqlite";
import Footer from "@/components/footer";

interface Score {
  attempt_id: string;
  type: string;
  score: number;
  total_questions: number;
  attempt_date: string;
}

interface User {
  id: number;
  username: string;
  quizScores: string;
  simulationScores: string;
}

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const [quizScores, setQuizScores] = useState<Score[]>([]);
  const [simulationScores, setSimulationScores] = useState<Score[]>([]);
  const { session } = useSession();

  // Function to fetch data
  const fetchData = useCallback(async () => {
    try {
      const userId = Number(session?.split(",")[0]); // Replace with AuthContext userId
      const user = await db.getFirstAsync<User>(
        "SELECT * FROM users WHERE id = ?",
        [userId]
      );
      if (user) {
        setQuizScores(JSON.parse(user.quizScores || "[]"));
        setSimulationScores(JSON.parse(user.simulationScores || "[]"));
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
    }
  }, [db, session]);

  // Use useFocusEffect to refetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const getStats = () => {
    const totalQuizAttempts = quizScores.length;
    const quizAvgScore =
      totalQuizAttempts > 0
        ? (
            quizScores.reduce(
              (sum, s) => sum + (s.score / s.total_questions) * 100,
              0
            ) / totalQuizAttempts
          ).toFixed(1)
        : "0.0";

    const totalSimulationAttempts = simulationScores.length;
    const simulationAvgScore =
      totalSimulationAttempts > 0
        ? (
            simulationScores.reduce(
              (sum, s) => sum + (s.score / s.total_questions) * 100,
              0
            ) / totalSimulationAttempts
          ).toFixed(1)
        : "0.0";

    const quizTypeStats = [
      "mcq",
      "drag_drop",
      "red_flag",
      "password_strength",
      "simulated_attack",
    ].map((type) => {
      const typeScores = quizScores.filter((s) => s.type === type);
      const typeAttempts = typeScores.length;
      const score =
        typeAttempts > 0
          ? (
              typeScores.reduce(
                (sum, s) => sum + (s.score / s.total_questions) * 100,
                0
              ) / typeAttempts
            ).toFixed(1)
          : "0.0";
      return { type, attempts: typeAttempts, score };
    });

    const attackTypeStats = ["email", "message", "call"].map((type) => {
      const typeScores = simulationScores.filter((s) => s.type === type);
      const typeAttempts = typeScores.length;
      const score =
        typeAttempts > 0
          ? (
              typeScores.reduce(
                (sum, s) => sum + (s.score / s.total_questions) * 100,
                0
              ) / typeAttempts
            ).toFixed(1)
          : "0.0";
      return { type, attempts: typeAttempts, score };
    });

    return {
      totalQuizAttempts,
      quizAvgScore,
      totalSimulationAttempts,
      simulationAvgScore,
      quizTypeStats,
      attackTypeStats,
    };
  };

  const {
    totalQuizAttempts,
    quizAvgScore,
    totalSimulationAttempts,
    simulationAvgScore,
  } = getStats();

  return (
    <View style={styles.container}>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      <ScrollView style={[styles.container, { padding: 20 }]}>
        <Text style={styles.title}>Progress Dashboard</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.cardText}>
            Username: {session ? session.split(",")[1] : ""}
          </Text>
          <Text style={styles.cardText}>
            Email: {session ? session.split(",")[2] : ""}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overall Performance</Text>
          <Text style={styles.cardText}>
            Quiz Attempts: {totalQuizAttempts}
          </Text>
          <Text style={styles.cardText}>
            Quiz Average Score: {quizAvgScore}%
          </Text>
          <Text style={styles.cardText}>
            Simulated Attack Attempts: {totalSimulationAttempts}
          </Text>
          <Text style={styles.cardText}>
            Simulated Attack Average Score: {simulationAvgScore}%
          </Text>
        </View>
      </ScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1E1E1E",
    height: "auto",
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 4,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: "#666",
    marginVertical: 4,
  },
  cardSubText: {
    fontSize: 14,
    color: "#999",
    marginVertical: 2,
  },
  statRow: {
    marginVertical: 4,
  },
  attemptRow: {
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 8,
  },
});
