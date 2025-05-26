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

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(drawer)",
};

export default function AppLayout() {
  const { session, isLoading } = useSession();
  const param = useLocalSearchParams<{
    topic?: string;
  }>();

  // You can keep the splash screen open, or render a loading screen like we do here.
  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  // Only require authentication within the (app) group's layout as users
  // need to be able to access the (auth) group and sign in again.
  if (!session) {
    // On web, static rendering will stop here as the user is not authenticated
    // in the headless Node process that the pages are rendered in.
    return <Redirect href="/sign-in" />;
  }

  // This layout can be deferred because it's not the root layout.
  return (
    <Stack>
      <Stack.Screen
        name="(drawer)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="learning"
        options={{
          title: "",
          headerStyle: { backgroundColor: "#01BAFD" },
          headerLeft: () => (
            <TouchableOpacity
              style={{
                backgroundColor: "#1E1E1E",
                paddingVertical: 10,
                paddingHorizontal: 10,
              }}
              onPress={() => router.dismissAll()}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>Home</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="flashcards"
        options={{ title: "", headerStyle: { backgroundColor: "#01BAFD" } }}
      />
      <Stack.Screen
        name="quiz"
        options={{
          title: "",
          headerStyle: { backgroundColor: "#01BAFD" },
          headerLeft: () => (
            <TouchableOpacity
              style={{
                backgroundColor: "#1E1E1E",
                paddingVertical: 10,
                paddingHorizontal: 10,
              }}
              onPress={() => router.dismissAll()}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>Home</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="[topic]"
        options={{ title: "", headerStyle: { backgroundColor: "#01BAFD" } }}
      />

      <Stack.Screen
        name="best-pratices"
        options={{
          title: "",
          headerStyle: { backgroundColor: "#01BAFD" },
        }}
      />
      <Stack.Screen
        name="simulate"
        options={{
          title: "",
          headerStyle: { backgroundColor: "#01BAFD" },
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
