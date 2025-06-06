import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SessionProvider } from "@/providers/session";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase,
} from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { useColorScheme } from "@/components/useColorScheme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider databaseName="phishorphlop.db" onInit={createDbIfNeeded}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <SessionProvider>
          <Slot />
        </SessionProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}

interface QuizQuestion {
  question: string;
  correct_answer: string;
  incorrect_answers: string; // Ensure this is always a string
  explanation: string;
  category: string;
  type: string;
}

// Generate a random key for database encryption
const generateKey = async () => {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// Database initialization
const createDbIfNeeded = async (db: SQLiteDatabase) => {
  console.log("Initializing database...");
  try {
    let password = await SecureStore.getItemAsync("dbPassword");
    if (!password) {
      password = await generateKey();
      await SecureStore.setItemAsync("dbPassword", password);
    }

    // This statement must be run first!!!
    // Otherwise there will be an error saying "file is not a database".
    await db.execAsync(`PRAGMA key = "${password}"`);

    await db.runAsync("pragma journal_mode = WAL");

    // Create the users table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT,
        salt TEXT,
        quizScores TEXT, -- JSON string of [{ attempt_id, type, score, total_questions, attempt_date }]
        simulationScores TEXT -- JSON string of [{ attempt_id, type, score, total_questions, attempt_date }]
      )
    `);
    console.log("Users table created or already exists");

    // Create the learning table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS learning (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT UNIQUE,
        definition TEXT,
        did_you_know TEXT,
        example TEXT,
        lesson TEXT
      )
    `);
    console.log("Learning table created or already exists");

    // Check if learning materials already exist
    const countResult = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM learning"
    );
    const existingCount = countResult?.count || 0;
    console.log(`Existing learning materials: ${existingCount}`);

    // Insert learning materials only if the table is empty
    if (existingCount === 0) {
      await db.runAsync(
        `INSERT INTO learning (topic, definition, did_you_know, example, lesson) VALUES (?, ?, ?, ?, ?)`,
        [
          "Phishing",
          "Phishing is a scam where attackers send fake emails, texts, or messages pretending to be someone trustworthy to trick you into sharing personal information like passwords or bank details.",
          "Did you know that phishing scams don’t just happen via email? They also come through text messages (smishing), phone calls (vishing), and even social media messages!",
          "You get an email that looks like it’s from your favorite game’s support team, asking you to log in to fix an account issue. The link takes you to a fake website that steals your password.",
          "Always check the sender’s email address and avoid clicking links in unexpected messages. Go directly to the official website to log in.",
        ]
      );

      await db.runAsync(
        `INSERT INTO learning (topic, definition, did_you_know, example, lesson) VALUES (?, ?, ?, ?, ?)`,
        [
          "Spear Phishing",
          "Spear phishing is a targeted phishing attack aimed at a specific person, using personal details to make the scam seem more convincing.",
          "Did you know that attackers might use your social media posts to learn about you and make their fake messages seem real, like mentioning your school or friends?",
          "You receive an email that seems to come from your teacher, mentioning a specific project you’re working on, asking you to share your login details to access a 'class portal.'",
          "Be cautious of messages that seem too personal or urgent. Verify with the person directly, like asking your teacher in person.",
        ]
      );

      await db.runAsync(
        `INSERT INTO learning (topic, definition, did_you_know, example, lesson) VALUES (?, ?, ?, ?, ?)`,
        [
          "Vishing",
          "Vishing, or voice phishing, is when scammers call you and pretend to be someone trustworthy, like a bank or tech support, to trick you into giving personal information.",
          "Did you know that scammers can fake phone numbers to make it look like they’re calling from a legitimate company or even your school?",
          "Someone calls you, claiming to be from your phone company, saying your account needs verification and asking for your password or PIN.",
          "Never share personal information over the phone unless you initiated the call to a verified number. Hang up and call back using an official contact number.",
        ]
      );

      await db.runAsync(
        `INSERT INTO learning (topic, definition, did_you_know, example, lesson) VALUES (?, ?, ?, ?, ?)`,
        [
          "Smishing",
          "Smishing is phishing through text messages, where scammers send fake texts pretending to be from a trusted source to trick you into sharing information or clicking malicious links.",
          "Did you know that smishing texts often create a sense of urgency, like claiming your account is locked, to make you act quickly without thinking?",
          "You get a text saying you’ve won a gift card for a popular store, but you need to click a link and enter your details to claim it.",
          "Don’t click links in unexpected texts. Verify offers by visiting the official website or contacting the company directly.",
        ]
      );

      await db.runAsync(
        `INSERT INTO learning (topic, definition, did_you_know, example, lesson) VALUES (?, ?, ?, ?, ?)`,
        [
          "Pretexting",
          "Pretexting is when a scammer creates a fake story or 'pretext' to gain your trust and trick you into sharing personal information or doing something for them.",
          "Did you know that pretexting often involves impersonating someone you know, like a friend or family member, to make the scam more believable?",
          "Someone messages you on social media, claiming to be a friend who lost their phone, asking for your login details to 'recover their account.'",
          "Always verify the person’s identity through another method, like calling them or asking a question only they would know.",
        ]
      );

      await db.runAsync(
        `INSERT INTO learning (topic, definition, did_you_know, example, lesson) VALUES (?, ?, ?, ?, ?)`,
        [
          "Baiting",
          "Baiting is when scammers offer something tempting, like free games or gift cards, to trick you into downloading malware or sharing personal information.",
          "Did you know that baiting can happen in person too, like leaving a USB drive labeled 'Free Music' that installs malware when plugged in?",
          "You see an ad on a gaming site offering free in-game currency if you download an app, but the app steals your account details.",
          "Avoid downloading apps or files from untrusted sources. Stick to official app stores and verified websites.",
        ]
      );

      await db.runAsync(
        `INSERT INTO learning (topic, definition, did_you_know, example, lesson) VALUES (?, ?, ?, ?, ?)`,
        [
          "Quid Pro Quo",
          "Quid pro quo is when a scammer offers something in exchange for your personal information or actions, like promising a reward for sharing your password.",
          "Did you know that scammers might pose as tech support offering to fix your device for free if you give them remote access?",
          "Someone messages you offering free game credits if you share your account login details to 'verify' your account.",
          "Never share personal information for a promised reward. Legitimate companies don’t ask for passwords or sensitive details.",
        ]
      );

      console.log("Learning materials inserted successfully");
    } else {
      console.log("Learning materials already exist, skipping insertion");
    }

    // Create the flashcards table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT UNIQUE,
        answer TEXT,
        category TEXT
      )
    `);
    console.log("Flashcards table created or already exists");

    // Check if flashcards already exist
    let flashcardsCountResult = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM flashcards"
    );
    let flashcardsExistingCount = flashcardsCountResult?.count || 0;
    console.log(`Existing flashcards: ${flashcardsExistingCount}`);

    // Insert flashcards only if the table is empty
    if (flashcardsExistingCount === 0) {
      const flashcards = [
        // Questions (15)
        {
          question: "What is phishing?",
          answer:
            "Phishing is a scam where attackers send fake emails, texts, or messages to trick you into sharing personal information.",
          category: "Question",
        },
        {
          question: "What is spear phishing?",
          answer:
            "Spear phishing is a targeted phishing attack using personal details to make the scam seem convincing.",
          category: "Question",
        },
        {
          question: "What does vishing mean?",
          answer:
            "Vishing is voice phishing, where scammers call and pretend to be trustworthy to steal information.",
          category: "Question",
        },
        {
          question: "What is smishing?",
          answer:
            "Smishing is phishing through text messages, tricking you into sharing info or clicking malicious links.",
          category: "Question",
        },
        {
          question: "What is pretexting in scams?",
          answer:
            "Pretexting is when scammers create a fake story to gain your trust and steal personal information.",
          category: "Question",
        },
        {
          question: "What is baiting in cybersecurity?",
          answer:
            "Baiting offers something tempting, like free games, to trick you into downloading malware or sharing info.",
          category: "Question",
        },
        {
          question: "What is a quid pro quo attack?",
          answer:
            "Quid pro quo is when scammers offer a reward in exchange for your personal information or actions.",
          category: "Question",
        },
        {
          question: "What is Scareware?",
          answer:
            "Scareware is fake software or pop-ups that try to scare you with warnings to make you click or pay for fake security.",
          category: "Question",
        },
        {
          question: "WWhat is Baiting?",
          answer:
            "Baiting is when scammers offer something exciting (like a prize or free download) to trick you into giving personal information or downloading malware.",
          category: "Question",
        },
        {
          question: "What is malware?",
          answer:
            "Malware is harmful software designed to damage or exploit devices, like viruses or spyware.",
          category: "Question",
        },
        {
          question: "What is a firewall?",
          answer:
            "A firewall is a security system that controls network traffic to protect your device.",
          category: "Question",
        },
        {
          question: "What does two-factor authentication do?",
          answer:
            "Two-factor authentication adds an extra security step, like a code sent to your phone, to verify your identity.",
          category: "Question",
        },
        {
          question: "What is social engineering?",
          answer:
            "Social engineering tricks people into giving away information by exploiting trust or fear.",
          category: "Question",
        },
        {
          question: "What is a strong password?",
          answer:
            "A strong password is long, random, and includes letters, numbers, and symbols.",
          category: "Question",
        },
        {
          question: "What is a data breach?",
          answer:
            "A data breach is when sensitive information is accessed or stolen by unauthorized people.",
          category: "Question",
        },
        {
          question: "What is ransomware?",
          answer:
            "Ransomware is malware that locks your files and demands payment to unlock them.",
          category: "Question",
        },
        {
          question: "What is a VPN?",
          answer:
            "A VPN (Virtual Private Network) encrypts your internet connection for privacy and security.",
          category: "Question",
        },
        {
          question: "WWhat is Tailgating?",
          answer:
            "Tailgating is when someone sneaks behind you to enter a secure area without permission, pretending they belong there.",
          category: "Question",
        },

        // Best Practices (15)
        {
          question: "How can you spot a phishing email?",
          answer:
            "Look for bad spelling, strange email addresses, urgent or scary messages, and links that don’t match the real website.",
          category: "Best Practices",
        },
        {
          question: "How can you create a strong password?",
          answer:
            "Use at least 12 characters with upper- and lowercase letters, numbers, and special symbols — and don’t reuse passwords!",
          category: "Best Practices",
        },
        {
          question: "What should you do if you get a strange text with a link?",
          answer:
            "Don’t click it. Delete the message or show a trusted adult — it could be a smishing attack.",
          category: "Best Practices",
        },
        {
          question: "What do you do if someone asks for your password?",
          answer:
            "Never share your password — not even with friends. Real companies or staff will never ask for it.",
          category: "Best Practices",
        },
        {
          question: "How do you stay safe on public Wi-Fi?",
          answer:
            "Avoid logging into important accounts and never enter passwords or card info when on public Wi-Fi.",
          category: "Best Practices",
        },
        {
          question: "How do you know if a message is fake?",
          answer:
            "If it feels rushed, weird, or too good to be true — double-check with someone you trust before acting.",
          category: "Best Practices",
        },
        {
          question: "How can you protect your accounts?",
          answer:
            "Use strong passwords and turn on two-factor authentication (2FA) to add an extra layer of security.",
          category: "Best Practices",
        },
        {
          question:
            "What should you do if someone calls and asks for private info?",
          answer:
            "Hang up. Call the real company or person directly using a trusted number.",
          category: "Best Practices",
        },
        {
          question:
            "What should you do if someone wants to follow you through a locked door?",
          answer:
            " Politely ask them to use their own ID or wait for staff. Don’t let strangers into secure areas.",
          category: "Best Practices",
        },
        {
          question: "Two-Factor Authentication",
          answer:
            "An extra security step requiring a second verification method, like a code.",
          category: "Definition",
        },
        {
          question: "What do you do if you find a USB stick lying around?",
          answer:
            "Don’t plug it in — it could contain malware. Give it to a teacher or trusted adult.",
          category: "Definition",
        },
        {
          question: "Data Breach",
          answer: "Unauthorized access or theft of sensitive information.",
          category: "Definition",
        },
        {
          question: "Ransomware",
          answer:
            "Malware that locks your files and demands payment to unlock them.",
          category: "Definition",
        },
        {
          question: "VPN",
          answer:
            "A Virtual Private Network that encrypts your internet connection for privacy.",
          category: "Definition",
        },
        {
          question: "Spyware",
          answer:
            "Malware that secretly monitors your activities and steals information.",
          category: "Definition",
        },

        // Best Practices (15)
        {
          question: "How should you create a strong password?",
          answer:
            "Use a mix of letters, numbers, and symbols, and make it at least 12 characters long.",
          category: "Best Practice",
        },
        {
          question: "What should you do with suspicious emails?",
          answer:
            "Don’t click links or attachments; verify the sender by contacting them directly.",
          category: "Best Practice",
        },
        {
          question: "How can you stay safe on social media?",
          answer:
            "Set your profiles to private and don’t share personal details with strangers.",
          category: "Best Practice",
        },
        {
          question: "What’s a safe way to download apps?",
          answer:
            "Only download apps from official stores like Google Play or the App Store.",
          category: "Best Practice",
        },
        {
          question: "How do you verify a website’s security?",
          answer:
            "Check for 'https://' and a padlock icon in the browser’s address bar.",
          category: "Best Practice",
        },
        {
          question: "What should you do if you get a suspicious call?",
          answer:
            "Hang up and call back using an official number from the company’s website.",
          category: "Best Practice",
        },
        {
          question: "How can you protect your accounts?",
          answer:
            "Enable two-factor authentication for an extra layer of security.",
          category: "Best Practice",
        },
        {
          question: "What’s the best way to handle urgent requests?",
          answer:
            "Take your time and verify the request through a trusted channel.",
          category: "Best Practice",
        },
        {
          question: "How do you avoid phishing scams?",
          answer:
            "Don’t share personal info in response to unsolicited messages.",
          category: "Best Practice",
        },
        {
          question: "What should you do with unknown USB drives?",
          answer:
            "Never plug in unknown USB drives; they could contain malware.",
          category: "Best Practice",
        },
        {
          question: "How can you spot a fake website?",
          answer:
            "Look for spelling errors, odd URLs, or missing security indicators.",
          category: "Best Practice",
        },
        {
          question: "What’s a safe way to share information?",
          answer:
            "Use secure, encrypted apps like Signal or WhatsApp for sensitive data.",
          category: "Best Practice",
        },
        {
          question: "How do you keep your device secure?",
          answer:
            "Update your apps and operating system regularly to fix security issues.",
          category: "Best Practice",
        },
        {
          question: "What should you do if you suspect a scam?",
          answer:
            "Report it to a trusted adult or your school’s IT team immediately.",
          category: "Best Practice",
        },
        {
          question: "How can you back up your data safely?",
          answer:
            "Use a trusted cloud service or external drive and keep it secure.",
          category: "Best Practice",
        },

        // Terms (10)
        {
          question: "Encryption",
          answer:
            "Converting data into a code to keep it secure from unauthorized access.",
          category: "Term",
        },
        {
          question: "Password Manager",
          answer: "A tool that stores and generates strong passwords securely.",
          category: "Term",
        },
        {
          question: "Spyware",
          answer:
            "Malware that secretly monitors and collects your information.",
          category: "Term",
        },
        {
          question: "Trojan",
          answer:
            "Malware disguised as legitimate software to trick users into installing it.",
          category: "Term",
        },
        {
          question: "Pharming",
          answer:
            "Redirecting users to fake websites to steal their information.",
          category: "Term",
        },
        {
          question: "Botnet",
          answer:
            "A network of infected devices controlled by attackers to perform malicious tasks.",
          category: "Term",
        },
        {
          question: "DDoS Attack",
          answer: "Overwhelming a website with traffic to make it unavailable.",
          category: "Term",
        },
        {
          question: "Identity Theft",
          answer:
            "Stealing someone’s personal information to impersonate them.",
          category: "Term",
        },
        {
          question: "Secure Socket Layer (SSL)",
          answer:
            "A protocol that encrypts data between your device and a website.",
          category: "Term",
        },
        {
          question: "Patch",
          answer:
            "A software update that fixes security vulnerabilities or bugs.",
          category: "Term",
        },
        {
          question: "What is Clickjacking?",
          answer:
            "Clickjacking tricks you into clicking something that looks harmless but does something you didn’t expect, like sharing private info.",
          category: "Term",
        },
        {
          question: "What is Social Engineering?",
          answer:
            "Social engineering is tricking people into giving away information or doing something dangerous, often by pretending to be someone they trust.",
          category: "Term",
        },
        {
          question: "What is Multi-Factor Authentication (MFA)?",
          answer:
            "MFA is a security method that uses two or more steps to log in, like a password plus a code sent to your phone.",
          category: "Term",
        },
      ];

      for (const card of flashcards) {
        await db.runAsync(
          `INSERT OR IGNORE INTO flashcards (question, answer, category) VALUES (?, ?, ?)`,
          [card.question, card.answer, card.category]
        );
      }
      console.log("Flashcards inserted successfully");
    } else {
      console.log("Flashcards already exist, skipping insertion");
    }

    // Drop and recreate the quizzes table
    // await db.execAsync(`DROP TABLE IF EXISTS quizzes`);
    // console.log("Quizzes table dropped");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT UNIQUE,
        correct_answer TEXT,
        incorrect_answers TEXT, -- Comma-separated list or JSON for red_flag
        explanation TEXT,
        category TEXT,
        type TEXT -- 'mcq', 'drag_drop', 'red_flag', 'password_strength'
      )
    `);
    console.log("Quizzes table created or already exists");

    let quizCountResult = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM quizzes"
    );
    let quizExistingCount = quizCountResult?.count || 0;
    console.log(`Existing quizzes: ${quizExistingCount}`);

    if (quizExistingCount === 0) {
      const quizQuestions: QuizQuestion[] = [
        // MCQ Questions (16)
        {
          question:
            "You receive an email from your 'bank' asking you to click a link to verify your account. The email address is 'support@bank-security.co'. What should you do?",
          correct_answer:
            "Contact your bank directly using their official website or phone number.",
          incorrect_answers:
            "Click the link to verify your account.,Reply to the email with your account details.,Forward the email to a friend for advice.",
          explanation:
            "The email address is not from the official bank domain, which is a red flag for phishing. Never click links in unsolicited emails. Always contact your bank directly using verified contact information.",
          category: "Phishing",
          type: "mcq",
        },
        {
          question:
            "A text message claims you’ve won a prize and asks you to send $10 to claim it. What is this likely to be?",
          correct_answer: "A smishing scam",
          incorrect_answers:
            "A legitimate prize offer,An error from your bank,A message from a friend",
          explanation:
            "Smishing is a phishing scam via text messages. Legitimate prize offers don’t require payment to claim. Be wary of unsolicited texts asking for money or personal information.",
          category: "Smishing",
          type: "mcq",
        },
        {
          question:
            "You get a call from someone claiming to be tech support, saying your computer has a virus and they need remote access to fix it. What should you do?",
          correct_answer: "Hang up and contact your tech support directly.",
          incorrect_answers:
            "Give them remote access to your computer.,Provide your credit card details to pay for the fix.,Download the software they recommend.",
          explanation:
            "This is likely a vishing scam. Legitimate tech support doesn’t call unsolicited and request remote access. Always verify by contacting support through official channels.",
          category: "Vishing",
          type: "mcq",
        },
        {
          question:
            "An email with a subject 'Urgent: Update Your Password' has a link to a login page. The URL starts with 'http://'. What is a red flag?",
          correct_answer: "The URL uses 'http://' instead of 'https://'.",
          incorrect_answers:
            "The email has a subject line.,The email asks for a password update.,The email includes a link.",
          explanation:
            "Legitimate websites, especially for logins, use 'https://' for security. 'http://' indicates an unsecured connection, a common phishing tactic. Always check the URL and go to the official site directly.",
          category: "Phishing",
          type: "mcq",
        },
        {
          question:
            "You’re on a social media site, and a friend’s account sends you a message with a link to a 'fun quiz'. The link looks suspicious. What should you do?",
          correct_answer:
            "Contact your friend through another channel to verify.",
          incorrect_answers:
            "Click the link to take the quiz.,Reply to the message with your details.,Share the link with others.",
          explanation:
            "Hackers often compromise social media accounts to send phishing links. Verify with your friend through a different method (e.g., phone call) before clicking any links.",
          category: "Social Media Phishing",
          type: "mcq",
        },
        {
          question:
            "A website pop-up says you’ve won a free gift card but need to enter your email and password to claim it. What is this likely to be?",
          correct_answer: "A phishing attempt",
          incorrect_answers:
            "A legitimate gift card offer,An advertisement,A browser error",
          explanation:
            "Pop-ups asking for personal information like passwords are common phishing tactics. Legitimate offers don’t require sensitive data to claim rewards. Close the pop-up and avoid sharing details.",
          category: "Phishing",
          type: "mcq",
        },
        {
          question:
            "You receive an email that looks like it’s from your school, but the sender’s email is 'admin@sch00l-updates.net'. What should you do?",
          correct_answer:
            "Verify the email by contacting your school directly.",
          incorrect_answers:
            "Reply with your student ID.,Click any links in the email.,Forward it to your teacher.",
          explanation:
            "The email domain doesn’t match your school’s official domain, a sign of phishing. Always verify suspicious emails by contacting the organization through official channels.",
          category: "Phishing",
          type: "mcq",
        },
        {
          question:
            "A message says you need to pay a fine for a library book via a link. You don’t remember borrowing a book. What should you do?",
          correct_answer:
            "Check with the library directly using their official contact information.",
          incorrect_answers:
            "Pay the fine through the link.,Reply with your payment details.,Ignore the message completely.",
          explanation:
            "This could be a phishing scam. Legitimate organizations like libraries don’t send payment links in unsolicited messages. Verify with the library before taking action.",
          category: "Phishing",
          type: "mcq",
        },
        {
          question:
            "You get a text from an unknown number saying your package is delayed and to click a link to reschedule delivery. What is a red flag?",
          correct_answer: "The message is from an unknown number.",
          incorrect_answers:
            "The message mentions a package.,The message includes a link.,The message is about delivery.",
          explanation:
            "Unsolicited messages from unknown numbers, especially with links, are often smishing scams. Verify delivery issues directly with the shipping company using official contact details.",
          category: "Smishing",
          type: "mcq",
        },
        {
          question:
            "An email claims your account is locked and you must log in via a link to unlock it. The email address ends in '@account-security.org'. What should you do?",
          correct_answer:
            "Log in to your account using the official website directly.",
          incorrect_answers:
            "Click the link to unlock your account.,Reply with your username.,Share the email with friends.",
          explanation:
            "The email domain is suspicious and not from the official service. Phishing emails often use fake domains to trick users. Always access accounts through the official website or app.",
          category: "Phishing",
          type: "mcq",
        },
        {
          question: "What is the strength of the password? \n Password: 123456",
          correct_answer: "Weak",
          incorrect_answers: "Moderate,Strong",
          explanation:
            "The password '123456' is very short and uses only numbers, making it weak. Strong passwords are long (12+ characters) and mix letters, numbers, and symbols.",
          category: "Password Security",
          type: "mcq",
        },
        {
          question:
            "What is the strength of the password? \n Password: SunnyDay2023",
          correct_answer: "Moderate",
          incorrect_answers: "Weak,Strong",
          explanation:
            "The password 'SunnyDay2023' is fairly long and mixes letters and numbers, but lacks special symbols, making it moderate. Add symbols for a strong password.",
          category: "Password Security",
          type: "mcq",
        },
        {
          question:
            "What is the strength of the password? \n Password: K9$mP!xQz@2023",
          correct_answer: "Strong",
          incorrect_answers: "Weak,Moderate",
          explanation:
            "The password 'K9$mP!xQz@2023' is long, with uppercase, lowercase, numbers, and symbols, making it strong. This combination resists brute-force attacks.",
          category: "Password Security",
          type: "mcq",
        },
        {
          question:
            "Email: From: support@paypa1.com, Subject: Account Issue, Body: Click here to update your details.",
          correct_answer: "Misspelled domain (paypa1.com)",
          incorrect_answers: "Subject line,Link in body,Support sender",
          explanation:
            "The domain 'paypa1.com' is misspelled (should be 'paypal.com'), a common phishing tactic. This is the red flag indicating the email is not legitimate.",
          category: "Phishing",
          type: "mcq",
        },
        {
          question:
            "Text: From: +1234567890, Body: Your bank account is locked. Call 555-1234 to unlock.",
          correct_answer: "Unknown phone number",
          incorrect_answers: "Bank account message,Call to action,Text format",
          explanation:
            "An unsolicited message from an unknown number is a red flag for smishing. Legitimate banks use official contact numbers, not random ones.",
          category: "Smishing",
          type: "mcq",
        },
        {
          question:
            "Email: From: admin@school.edu, Subject: Urgent, Body: Your grade report is ready at http://grades-report.net.",
          correct_answer: "Non-official link domain",
          incorrect_answers: "Sender email,Subject line,Grade report mention",
          explanation:
            "The link domain 'grades-report.net' doesn’t match the school’s official domain, a red flag for phishing. Official links should use the school’s domain.",
          category: "Phishing",
          type: "mcq",
        },
        // Drag & Drop Questions (3)
        {
          question:
            "Email: 'Your account is suspended. Click here to restore access.' (Link: http://login-service.co)",
          correct_answer: "Scam",
          incorrect_answers: "Safe",
          explanation:
            "The link uses 'http://' and a non-official domain ('login-service.co'), indicating a phishing scam. Drag to 'Scam' to avoid clicking suspicious links.",
          category: "Phishing",
          type: "drag_drop",
        },
        {
          question:
            "Text: 'Your package is ready! Track it at https://official-delivery.com/track.'",
          correct_answer: "Safe",
          incorrect_answers: "Scam",
          explanation:
            "The text uses 'https://' and a plausible domain for a delivery service. Drag to 'Safe' as it appears legitimate, but always verify the URL before clicking.",
          category: "Delivery",
          type: "drag_drop",
        },
        {
          question:
            "Message: 'Congrats! You won a $500 gift card. Send $20 to claim.'",
          correct_answer: "Scam",
          incorrect_answers: "Safe",
          explanation:
            "Asking for payment to claim a prize is a common scam tactic. Drag to 'Scam' to avoid falling for unsolicited prize offers.",
          category: "Smishing",
          type: "drag_drop",
        },
        // Red Flag Questions (3)
        {
          question:
            "Review this email for phishing red flags: 'From: support@paypa1.com, Subject: Urgent Action Required, Body: Update your account at http://secure-login.co.'",
          correct_answer: "2",
          incorrect_answers:
            '[{"text": "Sender: support@paypa1.com", "isRedFlag": true, "explanation": "The domain paypa1.com is misspelled (should be paypal.com), a common phishing tactic."}, {"text": "Subject: Urgent Action Required", "isRedFlag": false, "explanation": "Urgent subject lines are common but not inherently suspicious."}, {"text": "Link: http://secure-login.co", "isRedFlag": true, "explanation": "The link uses http:// and a non-official domain, indicating a phishing attempt."}]',
          explanation:
            "The email contains two red flags: a misspelled sender domain (paypa1.com) and an unsecured, non-official link (http://secure-login.co). Always verify sender domains and use official websites.",
          category: "Phishing",
          type: "red_flag",
        },
        {
          question:
            "Identify red flags in this text: 'From: +9876543210, Body: Your account is locked. Call 555-9876 to unlock.'",
          correct_answer: "2",
          incorrect_answers:
            '[{"text": "Sender: +9876543210", "isRedFlag": true, "explanation": "An unknown phone number sending unsolicited messages is a smishing red flag."}, {"text": "Body: Your account is locked", "isRedFlag": false, "explanation": "Account lock messages are common and not inherently suspicious."}, {"text": "Call 555-9876", "isRedFlag": true, "explanation": "Requesting a call to an unknown number is a common smishing tactic."}]',
          explanation:
            "The text has two red flags: an unknown sender number and a request to call an unverified number. Verify account issues directly with official contacts.",
          category: "Smishing",
          type: "red_flag",
        },
        {
          question:
            "Spot red flags in this message: 'From: YourFriend123, Body: Hey, check out this deal! http://dealz.co/click'",
          correct_answer: "1",
          incorrect_answers:
            '[{"text": "Sender: YourFriend123", "isRedFlag": false, "explanation": "The sender appears to be a friend, but accounts can be hacked."}, {"text": "Body: Hey, check out this deal!", "isRedFlag": false, "explanation": "Friendly messages are common and not inherently suspicious."}, {"text": "Link: http://dealz.co/click", "isRedFlag": true, "explanation": "A non-official link in an unsolicited message is a phishing red flag."}]',
          explanation:
            "The suspicious link (http://dealz.co/click) is the primary red flag, as hacked accounts often send phishing links. Verify with the sender via another channel.",
          category: "Social Media Phishing",
          type: "red_flag",
        },
        // Password Strength Questions (3)
        {
          question: "Enter a password that is considered weak.",
          correct_answer: "Weak",
          incorrect_answers: "Moderate,Strong",
          explanation:
            "Weak passwords are short (less than 8 characters) and lack variety (e.g., only numbers or letters). Example: '123456' or 'password'.",
          category: "Password Security",
          type: "password_strength",
        },
        {
          question: "Enter a password that is considered moderate.",
          correct_answer: "Moderate",
          incorrect_answers: "Weak,Strong",
          explanation:
            "Moderate passwords are longer (8+ characters) and include some variety (e.g., letters and numbers) but lack symbols or mixed case. Example: 'SunnyDay2023'.",
          category: "Password Security",
          type: "password_strength",
        },
        {
          question: "Enter a password that is considered strong.",
          correct_answer: "Strong",
          incorrect_answers: "Weak,Moderate",
          explanation:
            "Strong passwords are long (12+ characters) and include uppercase, lowercase, numbers, and symbols. Example: 'K9$mP!xQz@2023'.",
          category: "Password Security",
          type: "password_strength",
        },
      ];

      for (const quiz of quizQuestions) {
        await db.runAsync(
          `INSERT OR IGNORE INTO quizzes (question, correct_answer, incorrect_answers, explanation, category, type) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            quiz.question,
            quiz.correct_answer,
            quiz.incorrect_answers ?? "", // Ensure incorrect_answers is a string
            quiz.explanation,
            quiz.category,
            quiz.type,
          ]
        );
      }
      console.log("Quiz questions inserted successfully");
    } else {
      console.log("Quiz questions already exist, skipping insertion");
    }

    // Verify the tables' schemas
    const userSchema = await db.getAllAsync("PRAGMA table_info(users)");
    console.log("Users table schema:", userSchema);
    const learningSchema = await db.getAllAsync("PRAGMA table_info(learning)");
    console.log("Learning table schema:", learningSchema);
    const flashcardSchema = await db.getAllAsync(
      "PRAGMA table_info(flashcards)"
    );
    console.log("Flashcards table schema:", flashcardSchema);

    const requiredUserColumns = [
      "id",
      "username",
      "email",
      "password_hash",
      "salt",
    ];
    const requiredLearningColumns = [
      "id",
      "topic",
      "definition",
      "did_you_know",
      "example",
      "lesson",
    ];
    const requiredFlashcardColumns = ["id", "question", "answer", "category"];
    const existingUserColumns = userSchema.map((col: any) => col.name);
    const existingLearningColumns = learningSchema.map((col: any) => col.name);
    const existingFlashcardColumns = flashcardSchema.map(
      (col: any) => col.name
    );
    const missingUserColumns = requiredUserColumns.filter(
      (col) => !existingUserColumns.includes(col)
    );
    const missingLearningColumns = requiredLearningColumns.filter(
      (col) => !existingLearningColumns.includes(col)
    );
    const missingFlashcardColumns = requiredFlashcardColumns.filter(
      (col) => !existingFlashcardColumns.includes(col)
    );

    if (missingUserColumns.length > 0) {
      console.error(
        "Missing required columns in users table:",
        missingUserColumns
      );
      throw new Error(
        `Failed to create users table with required columns: ${missingUserColumns.join(
          ", "
        )}`
      );
    }
    if (missingLearningColumns.length > 0) {
      console.error(
        "Missing required columns in learning table:",
        missingLearningColumns
      );
      throw new Error(
        `Failed to create learning table with required columns: ${missingLearningColumns.join(
          ", "
        )}`
      );
    }
    if (missingFlashcardColumns.length > 0) {
      console.error(
        "Missing required columns in flashcards table:",
        missingFlashcardColumns
      );
      throw new Error(
        `Failed to create flashcards table with required columns: ${missingFlashcardColumns.join(
          ", "
        )}`
      );
    }
    console.log("Database schema verified successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error; // Rethrow to prevent silent failures
  }
};
