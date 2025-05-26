import React from "react";
import { Text, View } from "./Themed";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const TIPS: string[] = [
  "No one should ask for your password—not even your best friend!",
  "Strong password = strong protection. Don’t make it easy!",
  "Don’t click on random links! They could lead to fake websites or download software that steals personal info!",
  "Scammers pretend to be people you trust. Don’t fall for it!",
  "Think before you share personal info—keep it secret, keep it safe!",
  "If it sounds too good to be true, it probably is. Always check first!",
  "Real companies won’t ask for your details by email or message!",
  "Watch out for fake ‘freebies’—they often come with a scam attached!",
  "  Stranger on social media? Don’t share your personal info!",
  "  Keep your passwords private. Seriously—don’t share them!",
  "  Strange calls or messages? Real companies don’t ask for passwords!",
  "  Scammers want you to panic. Stay calm, check, then act!",
  "  Public Wi-Fi isn’t safe for important stuff. Avoid logging in!",
  "  Weird message? Ask the person if it’s real before clicking anything!",
  "  Scammers are good actors. If it feels off, trust your gut and double-check!",
  "  Someone calling for your personal info? It’s probably a trick—hang up!",
  "  Strange email? Never open attachments from people you don’t know!",
  "  Look closely at links—fake websites can look real!",
  "  Don’t rush! Scammers love pressure. Slow down and think first!",
  "  If something feels ‘too perfect’—it’s probably a scam!",
  "  Always log out on shared devices. Don’t leave your info behind!",
  "  Free game cheats or skins that ask for your login? It’s a trap!",
  "  Just because friends click a link doesn’t mean you should. Stay smart!",
  "  Fake accounts can pretend to be teachers or schools—verify before you trust!",
  "  Found a USB on the ground? Don’t plug it in—it could be a trap!",
  "  If someone rushes you to ‘act now,’ it’s probably a scam. Take your time!",
  "  No ID badge? No entry! Even at school, not everyone is who they say!",
  "  Not sure if a message is real? Double-check with someone you trust!",
  "  Weird pop-up offering a prize? Close it fast—don’t click!",
  "  Your private info is like treasure. Guard it like a pirate!",
  "  If someone threatens to share your private photos or videos, it’s sextortion—report it immediately!",
  "  Never share intimate photos or videos with anyone online, even if they seem trustworthy!",
  "  If you get a strange call asking for personal details, hang up! Real companies don’t ask for your password or financial info over the phone!",
  "  Scammers can fake phone numbers to look like someone you trust. Always double-check before sharing any information!",
  "  If someone calls saying they’re from tech support, don’t give them access to your computer! Hang up and call the company directly to verify!",
  "  Never share your password or other private information with anyone on the phone!",
  "  Don’t trust anyone who asks for your personal info or passwords on social media! They might be trying to scam you!",
  "  Keep your devices updated! Many updates protect you from new threats!",
  "  Always check the website address (URL) before entering your info! Fake websites can look real!",
  "  Use two-factor authentication (2FA) when possible! It’s an extra layer of protection for your accounts!",
  "If something feels suspicious, trust your gut! Scammers want you to panic, so stay calm and check everything!",
];

export default function Footer() {
  const tipOpacity = useSharedValue(0);

  // Select daily tip
  const getDailyTip = (): string => {
    const today = new Date().toISOString().split("T")[0]; // e.g., "2025-05-24"
    const seed = today.split("-").reduce((acc, val) => acc + parseInt(val), 0);
    const randomIndex = seed % TIPS.length;
    return TIPS[randomIndex];
  };

  const dailyTip = getDailyTip();

  // Animate footer on mount
  React.useEffect(() => {
    tipOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: tipOpacity.value,
  }));
  return (
    <Animated.View
      style={[
        {
          height: "auto",
          minHeight: 80,
          backgroundColor: "#FF0000",
          width: "100%",
          paddingVertical: 10,
          paddingHorizontal: 10,
          justifyContent: "space-between",
        },
        animatedStyle,
      ]}
    >
      <Text style={styles.footerTitle}>Tip of the Day: </Text>
      <Text style={styles.footerDescription}>{dailyTip}</Text>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  footerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 5,
    textAlign: "center",
  },
  footerDescription: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
