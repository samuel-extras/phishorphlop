import { useSession } from "@/providers/session";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Crypto from "expo-crypto";
import { useSQLiteContext } from "expo-sqlite";
import Footer from "@/components/footer";
interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}
export default function SignUpScreen() {
  const db = useSQLiteContext();
  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSchemaValid, setIsSchemaValid] = useState(false);
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  const generateSalt = async () => {
    // Generate a random salt using expo-crypto and encode as base64
    const saltBytes = await Crypto.getRandomBytesAsync(16);
    return btoa(String.fromCharCode(...saltBytes));
  };

  const hashPassword = async (password: string, salt: string) => {
    // Combine password and salt, then hash using SHA-256
    const saltedPassword = password + salt;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      saltedPassword
    );
    return hash;
  };

  const handleRegister = async () => {
    // Input validation
    if (!form.username || form.username.length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters long");
      return;
    }

    if (!validateEmail(form.email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!form.password || form.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      // Generate salt and hash password
      const salt = await generateSalt();
      const passwordHash = await hashPassword(form.password, salt);

      // Insert user into database
      await db.runAsync(
        "INSERT INTO users (username, email, password_hash, salt) VALUES (?, ?, ?, ?)",
        [form.username, form.email, passwordHash, salt]
      );

      Alert.alert("Success", "Registration successful!");
      // Reset form
      setForm({ username: "", email: "", password: "", confirmPassword: "" });
      router.push("/sign-in");
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        Alert.alert("Error", "Username or email already exists");
      } else {
        Alert.alert("Error", "Registration failed. Please try again.");
        console.error("Registration error:", error);
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
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: "flex-end",
        }}
      >
        <Text
          style={{
            fontWeight: "900",
            fontStyle: "italic",
            fontSize: 40,
            textAlign: "center",
            marginBottom: 32,
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
            placeholder="Username"
            placeholderTextColor="#fff"
            keyboardType="email-address"
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            placeholderTextColor="#fff"
            keyboardType="email-address"
            onChangeText={(text) => setForm({ ...form, email: text })}
            autoCapitalize="none"
          />

          <View style={{ marginBottom: 16 }}>
            <TextInput
              style={{
                height: 60,
                borderColor: "#ddd",
                borderWidth: 1,
                borderRadius: 2,
                paddingHorizontal: 14,
                marginBottom: 4,
                fontSize: 18,
                backgroundColor: "#1E1E1E",
                fontWeight: "900",
                color: "#fff",
              }}
              placeholder="Password"
              placeholderTextColor="#fff"
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text
              style={{
                color: "#000",
                fontWeight: "900",
                fontStyle: "italic",
                fontSize: 12,
              }}
            >
              Min. 12 Characters. 1 Uppercase, Lowercase, Number, and Symbol
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#fff"
            value={form.confirmPassword}
            onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Sign Up!</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already Have An Account? </Text>
            <TouchableOpacity
              onPress={() => {
                router.push("/sign-in");
              }}
            >
              <Text style={styles.link}> Login Now!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Footer />
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
    height: 60,
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
    height: 60,
    paddingVertical: 17,
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
