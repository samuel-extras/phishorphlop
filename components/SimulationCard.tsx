import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { ColorValue } from "react-native";

export default function SimulationCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Feather
          name={icon as any}
          size={32}
          color="#fff"
          style={styles.icon}
        />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Suspicious {title.toLowerCase()}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.description}>{description}</Text>
        {/* <TouchableOpacity
          style={[styles.button, completed && styles.completedButton]}
          onPress={onPress}
          disabled={completed}
        >
          <Text
            style={[styles.buttonText, completed && styles.completedButtonText]}
          >
            {completed ? "✓ Completed" : "Start Simulation"}
          </Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  header: { padding: 24, backgroundColor: "#000" },
  icon: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8 },
  content: { paddingHorizontal: 24, paddingVertical: 6 },
  description: { fontSize: 14, color: "#6B7280", marginBottom: 4 },
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  completedButton: { backgroundColor: "#D1FAE5", opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  completedButtonText: { color: "#047857" },
});
