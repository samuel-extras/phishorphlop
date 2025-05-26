import { Text, TouchableOpacity } from "react-native";
import {
  Redirect,
  router,
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { useSession } from "@/providers/session";
import { FontAwesome } from "@expo/vector-icons";
export default function SimulateLayout() {
  const { session, isLoading } = useSession();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#01BAFD" },
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity
              style={{
                backgroundColor: "#1E1E1E",
                paddingVertical: 10,
                paddingHorizontal: 10,
              }}
              onPress={() => router.dismissTo("/")}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>Home</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="phone" />
      <Stack.Screen name="sms" />
      <Stack.Screen name="email" />
      <Stack.Screen name="feedback" />
    </Stack>
  );
}
