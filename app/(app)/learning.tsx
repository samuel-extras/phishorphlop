import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { router } from "expo-router";
import Footer from "@/components/footer";

export default function LearningScreen() {
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
        <View style={{ borderBottomColor: "#000", borderBottomWidth: 1 }}>
          <View style={{ backgroundColor: "#1E1E1E", paddingVertical: 6 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 900,
                fontStyle: "italic",
                textAlign: "center",
                color: "#fff",
              }}
            >
              Social Engineering -
            </Text>
          </View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 900,
              fontStyle: "italic",
              textAlign: "center",
              color: "#000",
              marginHorizontal: 10,
              marginBottom: 6,
            }}
          >
            "The psychological manipulation of people into performing actions or
            divulging confidential information."
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/Phishing");
          }}
        >
          <Text style={styles.buttonText}>Phishing! </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/Spear Phishing");
          }}
        >
          <Text style={styles.buttonText}>Spear Phishing! </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/Vishing");
          }}
        >
          <Text style={styles.buttonText}>Vishing! </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/Smishing");
          }}
        >
          <Text style={styles.buttonText}>Smishing!</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/Pretexting");
          }}
        >
          <Text style={styles.buttonText}>Pretexting!</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/Baiting");
          }}
        >
          <Text style={styles.buttonText}>Baiting!</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/(app)/Quid Pro Quo");
          }}
        >
          <Text style={styles.buttonText}>Quid Pro Quo!</Text>
        </TouchableOpacity>
      </View>
      <Footer />
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
