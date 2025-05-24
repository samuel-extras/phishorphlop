import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { Stack, useLocalSearchParams } from "expo-router";

export default function ModalScreen() {
  const { title, desc, topic } = useLocalSearchParams<{
    title?: string;
    desc?: string;
    topic?: string;
  }>();

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: `${topic || ""}`,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>{title || ""}</Text>
        <View
          style={styles.separator}
          lightColor="#eee"
          darkColor="rgba(255,255,255,0.1)"
        />
        <Text style={styles.description}>{desc || ""}</Text>
        {/* Use a light status bar on iOS to account for the black space above the modal */}
        <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    fontStyle: "italic",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
