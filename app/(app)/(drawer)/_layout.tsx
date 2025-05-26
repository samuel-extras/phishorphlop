import { Link, router, useNavigation, useRouter } from "expo-router";
import { Pressable, StyleSheet, TouchableOpacity } from "react-native";
import { Drawer } from "expo-router/drawer";
import { DrawerActions } from "@react-navigation/native";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text, View } from "@/components/Themed";
import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { useSession } from "@/providers/session";

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { signOut } = useSession();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        backgroundColor: "#1E1E1E",
        width: "100%",
      }}
    >
      <DrawerContentScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          justifyContent: "center",
          flex: 1,
          rowGap: 10,
        }}
        {...props}
        scrollEnabled={false}
      >
        <DrawerItem
          label="Dashboard"
          onPress={() => router.push("/(app)/(drawer)/dashboard")}
          style={{ backgroundColor: "#fff", borderRadius: 4 }}
          labelStyle={{
            color: "#000",
            fontWeight: "900",
            fontSize: 18,
            textAlign: "center",
          }}
        />
        <DrawerItem
          label="Log out"
          onPress={() => {
            // The `app/(app)/_layout.tsx` will redirect to the sign-in screen.
            signOut();
          }}
          style={{ backgroundColor: "#fff", borderRadius: 4 }}
          labelStyle={{
            color: "#000",
            fontWeight: "900",
            fontSize: 18,
            textAlign: "center",
          }}
        />
      </DrawerContentScrollView>
    </View>
  );
}

export default function Layout() {
  const navigation = useNavigation();
  const onToggle = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };
  const { session } = useSession();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={CustomDrawerContent}
        screenOptions={{
          drawerPosition: "right",
          drawerIcon: () => <FontAwesome6 name="bars" size={24} color="#000" />,
          drawerType: "back",
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            headerTitleAlign: "center",
            headerTitle: "",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: "#01BAFD" },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.replace("/")}>
                <Text style={{ color: "#000", fontWeight: "900" }}>
                  Hi, {session ? session.split(",")[1] : ""}
                </Text>
              </TouchableOpacity>
            ),
            // headerRight: () => (
            //   <TouchableOpacity
            //     onPress={() => {
            //       // Open the drawer view.
            //       // navigation.dispatch(DrawerActions.openDrawer());
            //       navigation.openDrawer();
            //     }}
            //   >
            //     <FontAwesome6 name="bars" size={24} color="#000" />,
            //   </TouchableOpacity>
            // ),
          }}
        />
        <Drawer.Screen
          name="dashboard"
          options={{
            headerTitleAlign: "center",
            headerTitle: "",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: "#01BAFD" },

            headerLeft: () => (
              <TouchableOpacity
                style={{
                  backgroundColor: "#1E1E1E",
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                }}
                onPress={() => router.replace("/")}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>Home</Text>
              </TouchableOpacity>
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "orange",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  button: {
    padding: 15,
    alignItems: "center",
    borderRadius: 5,
  },
  text: {
    backgroundColor: "transparent",
    fontSize: 15,
    color: "#fff",
  },
});
