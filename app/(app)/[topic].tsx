import { StatusBar } from "expo-status-bar";
import { Alert, Platform, StyleSheet, TouchableOpacity } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

interface LearningMaterial {
  id: number;
  topic: string;
  definition: string;
  did_you_know: string;
  example: string;
  lesson: string;
}

export default function TopicScreen() {
  const db = useSQLiteContext();
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const [material, setMaterial] = useState<LearningMaterial | null>(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!topic) {
        Alert.alert("Error", "No topic specified");
        return;
      }
      try {
        const result = await db.getFirstAsync<LearningMaterial>(
          "SELECT * FROM learning WHERE topic = ?",
          [topic]
        );
        if (result) {
          setMaterial(result);
        } else {
          Alert.alert(
            "Error",
            `No learning material found for topic: ${topic}`
          );
        }
      } catch (error: any) {
        console.error("Error fetching topic:", error);
        Alert.alert("Error", "Failed to load topic: " + error.message);
      }
    };
    fetchMaterial();
  }, [db, topic]);

  if (!material) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Text style={{ color: "#000", fontWeight: "900" }}>{`${
              topic || ""
            }`}</Text>
          ),
        }}
      />
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
            router.push(
              `/modal?topic=${encodeURI(
                material?.topic || ""
              )}&title=${encodeURI("Definition")}&desc=${encodeURI(
                material?.definition || ""
              )}`
            );
          }}
        >
          <Text style={styles.buttonText}>Definition</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push(
              `/modal?topic=${encodeURI(
                material?.topic || ""
              )}&title=${encodeURI("Did You Know?")}&desc=${encodeURI(
                material?.did_you_know || ""
              )}`
            );
          }}
        >
          <Text style={styles.buttonText}>Did You Know? </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push(
              `/modal?topic=${encodeURI(
                material?.topic || ""
              )}&title=${encodeURI("Example")}&desc=${encodeURI(
                material?.example || ""
              )}`
            );
          }}
        >
          <Text style={styles.buttonText}>Example </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push(
              `/modal?topic=${encodeURI(
                material?.topic || ""
              )}&title=${encodeURI("Lesson")}&desc=${encodeURI(
                material?.lesson || ""
              )}`
            );
          }}
        >
          <Text style={styles.buttonText}>Lesson</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
});
