import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayer } from "expo-audio";

const audioSource = require("../../../assets/message.mp3");

export default function SMSScreen() {
  const params = useLocalSearchParams();
  const player = useAudioPlayer(audioSource);
  const [open, setOpen] = useState<boolean>(false);

  const smsData = {
    sender: "Your Mobile Carrier",
    number: "5555",
    message:
      "URGENT: Your account will be suspended in 24hrs. Verify now: bit.ly/verify-account",
    messages: [
      {
        message: "URGENT: Your account will be suspended in 24hrs. Verify now:",
      },
      { message: "bit.ly/verify-account", type: "link" },
    ],
    timestamp: "2 min ago",
    options: [
      { id: 3, text: "Report as phishing", safe: true },
      { id: 4, text: "Reply ", safe: false },
    ],
  };

  async function schedulePushNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: smsData.sender,
        body: smsData.message,
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
        : "This was a phishing SMS. Legitimate companies don’t use shortened URLs or urgent threats.",
      tips: [
        "Be suspicious of urgent messages with links",
        "Check for spelling errors and suspicious domains",
        "Contact the company directly if unsure",
      ],
      next: "email",
      score: choice.safe ? Number(params.score) + 1 : Number(params.score),
    };
    router.replace({
      pathname: "/(app)/simulate/feedback",
      params: feedback,
    });
  };

  if (!open) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.senderIcon}>
                <Feather name="message-square" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.sender}>Messages</Text>
                {/* <Text style={styles.number}>{smsData.number}</Text> */}
              </View>
            </View>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="x" size={20} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <Text style={{ marginHorizontal: 12, marginTop: 12 }}>Today</Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#F3F4F6",
              padding: 12,
              margin: 16,
              borderRadius: 8,
            }}
            onPress={() => setOpen(true)}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontWeight: "bold" }}>{smsData.sender}</Text>
              <Text style={{ fontSize: 10 }}>{smsData.timestamp}</Text>
            </View>
            <Text numberOfLines={2} style={styles.message}>
              {smsData.message}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.senderIcon}>
              <Feather name="message-square" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.sender}>{smsData.sender}</Text>
              <Text style={styles.number}>{smsData.number}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() =>
              handleSimulationChoice({
                id: 2,
                text: "Ignore the message",
                safe: true,
              })
            }
          >
            <Feather name="x" size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            {smsData.messages.map((message, index) => (
              <Text
                style={{ color: message.type === "link" ? "blue" : "#1F2937" }}
                key={index}
                onPress={
                  message.type === "link"
                    ? () =>
                        handleSimulationChoice({
                          id: 1,
                          text: "Click the link",
                          safe: false,
                        })
                    : () => false
                }
              >
                {message.message}{" "}
              </Text>
            ))}
          </Text>
          <Text style={styles.timestamp}>{smsData.timestamp}</Text>
        </View>
        {/* <Text style={styles.prompt}>How do you respond?</Text> */}
        <View style={styles.optionsContainer}>
          {smsData.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionButton}
              onPress={() => handleSimulationChoice(option)}
            >
              <Text style={styles.optionText}>{option.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingBottom: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  senderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  sender: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  number: { fontSize: 12, color: "#6B7280" },
  messageContainer: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  message: { fontSize: 14, color: "#1F2937" },
  timestamp: { fontSize: 12, color: "#6B7280", marginTop: 8 },
  prompt: {
    fontSize: 14,
    color: "#6B7280",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  optionsContainer: { marginHorizontal: 16, gap: 8, flexDirection: "row" },
  optionButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  optionText: { fontSize: 14, color: "#1F2937", textAlign: "center" },
});
