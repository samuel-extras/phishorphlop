import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { router } from "expo-router";
import { useSession } from "@/providers/session";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      <View
        style={{
          flex: 1,
          width: "100%",
          paddingHorizontal: 40,
          paddingTop: 10,
          paddingBottom: 20,
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/learning");
          }}
        >
          <Text style={styles.buttonText}>Learning Material! 🧠 </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/flashcards");
          }}
        >
          <Text style={styles.buttonText}>Flashcards! 🧠 </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/quiz");
          }}
        >
          <Text style={styles.buttonText}>Quiz! 🧠 </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/simulate-attack");
          }}
        >
          <Text style={styles.buttonText}>
            Simulated Attack Challenges! 🧠{" "}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/best-pratices");
          }}
        >
          <Text style={styles.buttonText}>
            Social Engineering Best Practices! 🧠{" "}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          height: 80,
          backgroundColor: "#FF0000",
          width: "100%",
        }}
      ></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
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
});
