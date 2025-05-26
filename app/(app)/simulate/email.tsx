import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayer } from "expo-audio";
import { Image } from "react-native";

const audioSource = require("../../../assets/message.mp3");

export default function EmailScreen() {
  const [showLink, setShowLink] = useState(false);
  const params = useLocalSearchParams();
  const player = useAudioPlayer(audioSource);
  const [open, setOpen] = useState<boolean>(false);

  const emailData = {
    from: "security@amazone-support.com",
    subject: "Immediate Action Required: Account Compromised",
    time: "9:42 AM",
    avatar: "https://ui-avatars.com/api/?name=OpenAI&background=random",
    sender: "Amazone",
    snippet:
      "Dear Valued Customer, We have detected unauthorized access to your account...",
    body: "Dear Valued Customer,\n\nWe have detected unauthorized access to your account. Please click the link below to secure your account immediately:\n\nSecure Account: https://amazone-security.net/verify\n\nFailure to act within 24 hours will result in permanent account suspension.\n\nBest regards,\nAmazon Security Team",
    options: [
      { id: 1, text: "Click the security link", safe: false },
      { id: 2, text: "Check sender email carefully", safe: true },
      { id: 3, text: "Go to Amazon directly", safe: true },
      { id: 4, text: "Forward to friends as warning", safe: false },
    ],
  };
  async function schedulePushNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: emailData.subject,
        body: "From: " + emailData.from,
        // data: { data: 'goes here', test: { test1: 'more data' } },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  }

  useEffect(() => {
    (async () => {
      await schedulePushNotification();
    })();
  }, []);

  useEffect(() => {
    player.play();
  }, []);
  const handleSimulationChoice = (choice: any) => {
    const feedback = {
      correct: choice.safe,
      explanation: choice.safe
        ? "Great job! You correctly identified this as a potential threat."
        : "This was a phishing email. Notice the misspelled domain and urgent language.",
      tips: [
        "Check the sender's email address carefully",
        "Hover over links to see the real destination",
        "Look for spelling and grammar mistakes",
      ],
      score: choice.safe ? Number(params.score) + 1 : Number(params.score),
      completed: "true",
    };
    router.replace({
      pathname: "/(app)/simulate/feedback",
      params: feedback,
    });
  };

  if (!open) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Feather name="mail" size={24} color="#3B82F6" />
              <Text style={styles.headerTitle}>Email</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setOpen(true)}
            style={styles.xEmailContainer}
          >
            <Image source={{ uri: emailData.avatar }} style={styles.avatar} />
            <View style={styles.textContainer}>
              <View style={styles.headerRow}>
                <Text style={styles.xSender}>{emailData.sender}</Text>
                <Text style={styles.time}>{emailData.time}</Text>
              </View>
              <Text style={styles.xSubject}>{emailData.subject}</Text>
              <Text style={styles.snippet} numberOfLines={1}>
                {emailData.snippet}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Feather name="mail" size={24} color="#3B82F6" />
            <Text style={styles.headerTitle}>Email</Text>
          </View>
          <TouchableOpacity onPress={() => setOpen(false)}>
            <Feather name="x" size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View style={styles.emailContainer}>
          <View style={styles.emailHeader}>
            <View style={styles.senderContainer}>
              <Text style={styles.senderLabel}>From:</Text>
              <Text style={styles.sender}>{emailData.from}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowLink(!showLink)}>
              <View style={styles.inspectButton}>
                <Feather name="eye" size={12} color="#3B82F6" />
                <Text style={styles.inspectText}>Inspect</Text>
              </View>
            </TouchableOpacity>
          </View>
          {showLink && (
            <Text style={styles.link}>
              Link: https://amazone-security.net/verify
            </Text>
          )}
          <Text style={styles.subject}>{emailData.subject}</Text>
          <Text style={styles.body}>{emailData.body}</Text>
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              <Text style={styles.warningBold}>Think carefully:</Text> What
              should you do with this email?
            </Text>
          </View>
          <View style={styles.optionsContainer}>
            {emailData.options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionButton}
                onPress={() => handleSimulationChoice(option)}
              >
                <Feather name="external-link" size={16} color="#9CA3AF" />
                <Text style={styles.optionText}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#1F2937" },
  emailContainer: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  senderContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  senderLabel: { fontSize: 14, color: "#6B7280" },
  sender: { fontSize: 14, fontWeight: "600", color: "#DC2626" },
  inspectButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  inspectText: {
    fontSize: 12,
    color: "#3B82F6",
    textDecorationLine: "underline",
  },
  link: {
    fontSize: 12,
    color: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subject: { fontSize: 16, fontWeight: "bold", color: "#1F2937", padding: 16 },
  body: { fontSize: 14, color: "#1F2937", padding: 16, lineHeight: 20 },
  warning: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#FBBF24",
    padding: 16,
    margin: 16,
  },
  warningText: { fontSize: 14, color: "#1F2937" },
  warningBold: { fontWeight: "600" },
  optionsContainer: { padding: 16, gap: 12 },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  optionText: { fontSize: 14, color: "#1F2937" },
  listContent: {
    padding: 10,
  },
  xEmailContainer: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomColor: "#e0e0e0",
    borderBottomWidth: 1,
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  xSender: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#202124",
  },
  time: {
    fontSize: 12,
    color: "#5f6368",
  },
  xSubject: {
    fontSize: 15,
    color: "#202124",
    fontWeight: "500",
  },
  snippet: {
    fontSize: 14,
    color: "#5f6368",
  },
});
