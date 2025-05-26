import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayer } from "expo-audio";
const audioSource = require("../../../assets/ringtone.mp3");

export default function PhoneCallScreen() {
  const [callState, setCallState] = useState("incoming");
  // const { setUserScore, setCompletedSimulations } = useRoute().params;
  const player = useAudioPlayer(audioSource);

  const phoneCallData = {
    callerName: "XYZ Bank Fraud Dept",
    callerNumber: "+1 (555) 123-4567",
    message:
      "Hello, this is Sarah from XYZ Bank Security. We've detected suspicious activity on your account. To verify your identity, I need your account number and PIN.",
    options: [
      { id: 1, text: "Provide account details", safe: false },
      { id: 2, text: "Ask for verification first", safe: true },
      { id: 3, text: "Hang up and call bank directly", safe: true },
      { id: 4, text: "Ask them to hold while I check", safe: false },
    ],
  };

  const handleSimulationChoice = (choice: any) => {
    const feedback = {
      correct: choice.safe,
      explanation: choice.safe
        ? "Great job! You correctly identified this as a potential threat."
        : "This was a phishing call. Legitimate banks never ask for sensitive information over the phone.",
      tips: [
        "Banks never ask for PINs or passwords over the phone",
        "Always hang up and call the official number",
        "Verify the caller's identity independently",
      ],
      next: "sms",
      score: choice.safe ? 1 : 0,
    };

    router.push({
      pathname: "/(app)/simulate/feedback",
      params: feedback,
    });
  };

  const handleDecline = () => {
    setCallState("ended");
    const feedback = {
      correct: JSON.stringify(true),
      explanation: "Great job! Declining unknown calls is a safe choice.",
      tips: [
        "Banks never ask for PINs or passwords over the phone",
        "Always hang up and call the official number",
        "Verify the caller's identity independently",
      ],
      next: "sms",
      score: 1,
    };
    router.replace({
      pathname: "/(app)/simulate/feedback",
      params: feedback,
    });
  };
  const handleAnswer = () => {
    setCallState("answered");
  };
  // Load and play ringtone when call is incoming
  useEffect(() => {
    if (callState === "incoming") {
      player.play();
    }
    if (callState === "answered") {
      player.pause();
    }
  }, [callState]);

  return (
    <LinearGradient colors={["#111827", "#000"]} style={styles.container}>
      <TouchableOpacity
        style={{
          position: "absolute",
          left: 20,
          top: 60,
          borderRadius: 4,
          padding: 8,
        }}
        onPress={() => router.back()}
      >
        <Feather name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>
      {callState === "incoming" ? (
        <View style={styles.callContainer}>
          <View style={styles.callerIcon}>
            <Feather name="phone-incoming" size={48} color="#fff" />
          </View>
          <Text style={styles.callerName}>{phoneCallData.callerName}</Text>
          <Text style={styles.callerNumber}>{phoneCallData.callerNumber}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
            >
              <Feather name="phone-off" size={20} color="#fff" />
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.answerButton]}
              onPress={handleAnswer}
            >
              <Feather name="phone-call" size={20} color="#fff" />
              <Text style={styles.buttonText}>Answer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.messageContainer}>
          <Text style={styles.messageTitle}>Caller says:</Text>
          <Text style={styles.message}>{phoneCallData.message}</Text>
          <View style={styles.optionsContainer}>
            {phoneCallData.options.map((option) => (
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
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  callContainer: { alignItems: "center", width: "100%", maxWidth: 320 },
  callerIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  callerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  callerNumber: { fontSize: 16, color: "#D1D5DB", marginBottom: 32 },
  buttonContainer: { flexDirection: "row", gap: 16, marginTop: 40 },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 999,
    gap: 8,
  },
  declineButton: { backgroundColor: "#DC2626" },
  answerButton: { backgroundColor: "#16A34A" },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  messageContainer: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 8,
    width: "100%",
    maxWidth: 320,
  },
  messageTitle: { fontSize: 14, color: "#D1D5DB", marginBottom: 8 },
  message: { fontSize: 16, color: "#fff", marginBottom: 16 },
  optionsContainer: { gap: 12 },
  optionButton: {
    backgroundColor: "#374151",
    padding: 12,
    borderRadius: 8,
  },
  optionText: { fontSize: 14, color: "#fff" },
});
