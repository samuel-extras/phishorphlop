import React from "react";
import { TouchableOpacity, ScrollView, StyleSheet } from "react-native";

import { router, Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "@/components/Themed";
import { Feather } from "@expo/vector-icons";
import SimulationCard from "@/components/SimulationCard";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import Footer from "@/components/footer";

export default function SimulateScreen() {
  const { completed, score } = useLocalSearchParams<{
    completed?: string;
    score?: string;
  }>();
  return (
    <>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Feather name="shield" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>PhishGuard Trainer</Text>
              <Text style={styles.headerSubtitle}>
                Learn to identify phishing attempts
              </Text>
            </View>
          </View>
          {completed && (
            <View>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <Text style={styles.score}>{Number(score)} / 3</Text>
            </View>
          )}
        </View>

        <View style={styles.cardsContainer}>
          <SimulationCard
            icon="phone"
            title="Phishing Call"
            description="Practice identifying fraudulent phone calls."
          />
          <SimulationCard
            icon="message-square"
            title="Phishing SMS"
            description="Learn to spot malicious text messages."
          />
          <SimulationCard
            icon="mail"
            title="Phishing Email"
            description="Identify fake emails that steal data."
          />
          <TouchableOpacity
            style={[styles.button, completed && styles.completedButton]}
            onPress={() =>
              router.push({
                pathname: "/(app)/simulate/phone",
                params: {},
              })
            }
          >
            <Text
              style={[
                styles.buttonText,
                completed && styles.completedButtonText,
              ]}
            >
              {completed ? "Restart Simulation" : "Start Simulation"}
            </Text>
          </TouchableOpacity>
        </View>

        {completed && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Your score</Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${(Number(score) / 3) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {`${(Number(score) / 3) * 100}%`}
            </Text>
            <Text style={styles.progressMessage}>
              {score === "3"
                ? "Congratulations! You've completed all modules. Stay vigilant!"
                : "Keep learning and stay vigilant!"}
            </Text>
          </View>
        )}
      </ScrollView>
      <Footer />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF", paddingBottom: 100 },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: { padding: 24 },
  description: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  icon: { marginBottom: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  completedButton: { backgroundColor: "#000" },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  completedButtonText: { color: "#fff" },

  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#1F2937" },
  headerSubtitle: { fontSize: 14, color: "#4B5563" },
  scoreLabel: { fontSize: 14, color: "#6B7280", textAlign: "right" },
  score: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3B82F6",
    textAlign: "right",
  },
  cardsContainer: { padding: 16, gap: 16 },
  progressContainer: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  progressBarContainer: {
    backgroundColor: "#E5E7EB",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    backgroundColor: "#3B82F6",
    height: "100%",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  progressMessage: { fontSize: 14, color: "#6B7280" },
});
