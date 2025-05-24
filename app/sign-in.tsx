import { useSession } from "@/providers/session";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Crypto from "expo-crypto";
import { useSQLiteContext } from "expo-sqlite";

interface LoginForm {
  emailOrUsername: string;
  password: string;
}
export default function SignIn() {
  const db = useSQLiteContext();
  const { signIn } = useSession();
  const [form, setForm] = useState<LoginForm>({
    emailOrUsername: "",
    password: "",
  });

  const handleLogin = async () => {
    // Input validation
    if (!form.emailOrUsername) {
      Alert.alert("Error", "Please enter your email or username");
      return;
    }

    if (!form.password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    try {
      await signIn(db, form.emailOrUsername, form.password);
      Alert.alert("Success", "Login successful!");
      // Navigate to home screen
      router.push("/(app)"); // Adjust the route as needed
      // Reset form
      setForm({ emailOrUsername: "", password: "" });
    } catch (error: any) {
      if (error.message.includes("No account found")) {
        Alert.alert("Error", "No account found with that email or username");
      } else if (error.message.includes("Incorrect password")) {
        Alert.alert("Error", "Incorrect password");
      } else {
        Alert.alert("Error", "Login failed: " + error.message);
      }
    }
  };

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <View
        style={{
          flex: 1 / 8,
          backgroundColor: "#01BAFD",
        }}
      ></View>

      <View
        style={{
          flex: 6 / 8,
          paddingHorizontal: 24,
          justifyContent: "flex-end",
        }}
      >
        <Text
          // onPress={() => {
          //   signIn();
          //   // Navigate after signing in. You may want to tweak this to ensure sign-in is
          //   // successful before navigating.
          //   router.replace("/");
          // }}
          style={{
            fontWeight: "900",
            fontStyle: "italic",
            fontSize: 40,
            textAlign: "center",
            marginBottom: 100,
          }}
        >
          <Text
            style={{
              color: "#01BAFD",
            }}
          >
            Phish
          </Text>
          or
          <Text
            style={{
              color: "#FF0000",
            }}
          >
            Phlop!
          </Text>
        </Text>

        <View>
          <TextInput
            style={styles.input}
            placeholder="Username or Email"
            placeholderTextColor="#fff"
            value={form.emailOrUsername}
            onChangeText={(text) => setForm({ ...form, emailOrUsername: text })}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#fff"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => {
                router.push("/sign-up");
              }}
            >
              <Text style={styles.link}> Sign Up Now!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View
        style={{
          flex: 1 / 8,
          backgroundColor: "#FF0000",
        }}
      ></View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 40,
    alignSelf: "center",
  },
  input: {
    height: 80,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 18,
    backgroundColor: "#1E1E1E",
    fontWeight: "900",
    color: "#fff",
  },
  button: {
    backgroundColor: "#1E1E1E",
    height: 80,
    paddingVertical: 28,
    borderRadius: 60,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
    marginBottom: 28,
  },
  footerText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  link: {
    fontSize: 16,
    color: "#01BAFD",
    fontWeight: "800",
  },
});
