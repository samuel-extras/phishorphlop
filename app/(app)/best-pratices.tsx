import { StatusBar } from "expo-status-bar";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { router } from "expo-router";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { FontAwesome } from "@expo/vector-icons";

const bestPractices: string[] = [
  "Don’t click quick, it might be a trick!",
  "Links that look odd, don’t give them a nod!",
  "Calls asking for cash, hang up in a flash!",
  "Emails that urge, check before you surge!",
  "Texts with a prize, they’re scams in disguise!",
  "Password you share, leads to a scare!",
  "Urgent mail’s a sign, take time to decline!",
  "Stranger’s request, put it to the test!",
  "Verify the sender, don’t be a pretender!",
  "Pop-ups that plead, ignore their need!",
  "Gift card demands, keep cash in your hands!",
  "Suspicious attachment, don’t give it a latchment!",
  "Bank calls at night, something’s not right!",
  "Hover o’er links, avoid scam blinks!",
  "Fake login page, don’t fall for the stage!",
  "IT on the phone, leave passwords alone!",
  "Text from a boss, double-check, don’t gloss!",
  "Odd email address, don’t clean up the mess!",
  "Free offer’s a bait, don’t take the plate!",
  "Caller ID spoof, don’t fall for the goof!",
  "Social media plea, verify who you see!",
  "Grammar that’s poor, don’t open the door!",
  "Invoice surprise, check it with wise eyes!",
  "Friend in distress, confirm, don’t guess!",
  "QR code in mail, could lead to a fail!",
  "Don’t overshare, keep secrets rare!",
  "Update your software, block the scam’s glare!",
  "Two-factor’s your friend, protect to the end!",
  "Public Wi-Fi’s risky, scams flow too frisky!",
  "Email from a prince, don’t give it a wince!",
  "Charity’s call, verify or stall!",
  "Strange USB stick, don’t give it a click!",
  "Voicemail with fear, don’t lend an ear!",
  "Invoice you didn’t send, don’t pay, just end!",
  "Survey with rewards, it’s one of those frauds!",
  "Boss wants gift cards, check, don’t discard!",
  "Fake job offer’s thrill, it’s a scam to kill!",
  "Lock your device, keep scams on ice!",
  "Don’t reuse a pass, or you’ll lose fast!",
  "Text says you’re fined, don’t pay, stay aligned!",
  "Email’s from a friend, check the trend!",
  "Phony tech support, don’t let them escort!",
  "Package delivery scare, verify with care!",
  "Random friend request, don’t join the quest!",
  "Bank text with a link, stop and think!",
  "Caller’s in a rush, hang up, don’t blush!",
  "Fake refund’s a ploy, don’t fall for the joy!",
  "Strong password’s a must, or you’ll bite the dust!",
  "Don’t trust a deal, if it’s too good to feel!",
  "Report scams with speed, help stop the greed!",
];

export default function BestPraticesScreen() {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const opacity = useSharedValue(1);

  const tips = bestPractices; // Use the 50-tip array

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };
  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1) % tips.length);
  };
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Text
              style={{ color: "#000", fontWeight: "900" }}
            >{`${"Best Practices"}`}</Text>
          ),
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
      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      <View
        style={{
          flex: 1,
          width: "100%",
          paddingHorizontal: 24,
          paddingTop: 10,
          paddingBottom: 20,
          justifyContent: "center",
          rowGap: 40,
        }}
      >
        <Text
          style={{
            color: "#000",
            fontSize: 20,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          Tips!
        </Text>
        <View style={styles.flashcard}>
          <Text style={styles.flashcardText}>{tips[currentTipIndex]}</Text>
        </View>

        <View style={styles.navigationContainer}>
          {currentTipIndex !== 0 && (
            <TouchableOpacity
              onPress={prevTip}
              style={[
                styles.button,
                currentTipIndex === tips.length - 1 && { width: "100%" },
              ]}
            >
              <FontAwesome name="arrow-left" size={16} color="#fff" />
              <Text style={styles.buttonText}>Prev Tip! </Text>
            </TouchableOpacity>
          )}
          {currentTipIndex !== tips.length - 1 && (
            <TouchableOpacity
              onPress={nextTip}
              style={[
                styles.button,
                currentTipIndex === 0 && { width: "100%" },
              ]}
            >
              <Text style={styles.buttonText}>Next Tip </Text>
              <FontAwesome name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
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
    paddingHorizontal: 20,
    borderRadius: 100,
    marginTop: 10,
    alignItems: "center",
    flexWrap: "nowrap",
    flexDirection: "row",
    columnGap: 4,
    justifyContent: "center",
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
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  picker: {
    flex: 1,
    height: 44,
  },
  flashcardContainer: {
    alignItems: "center",
  },
  flashcard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 4,
    padding: 18,
    width: "100%",
    height: "auto",
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginTop: 10,
  },

  back: {
    backgroundColor: "#01BAFD",
  },
  hidden: {
    backfaceVisibility: "hidden",
  },
  flashcardText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  flashcardCategory: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    columnGap: 6,
    marginTop: 200, // Adjust to ensure navigation is below the flashcard
  },
  navButton: {
    padding: 10,
  },
  navText: {
    fontSize: 16,
    color: "#333",
  },
  noFlashcards: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});
