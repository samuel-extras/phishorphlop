import { StatusBar } from "expo-status-bar";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { router } from "expo-router";
import Footer from "@/components/footer";
import { useSharedValue } from "react-native-reanimated";
import { FlipCard } from "@/components/FlipCard";

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export default function FlashcardsScreen() {
  const db = useSQLiteContext();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const isFlipped = useSharedValue(false);

  const handlePress = () => {
    isFlipped.value = !isFlipped.value;
  };

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const results = await db.getAllAsync<Flashcard>(
          "SELECT * FROM flashcards"
        );
        setFlashcards(results);
      } catch (error: any) {
        console.error("Error fetching flashcards:", error);
      }
    };
    fetchFlashcards();
  }, [db]);

  const filteredFlashcards =
    selectedCategory === "All"
      ? flashcards
      : flashcards.filter((card) => card.category === selectedCategory);

  const currentFlashcard = filteredFlashcards[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredFlashcards.length);
    isFlipped.value = false;
  };

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) =>
        (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length
    );
    isFlipped.value = false;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Text
              style={{ color: "#000", fontWeight: "900" }}
            >{`${"Flashcards"}`}</Text>
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
        <View
          style={{
            backgroundColor: "#1E1E1E",
            height: "auto",
            paddingVertical: 18,
            paddingHorizontal: 36,

            borderRadius: 4,
            marginTop: 10,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "900",
            }}
          >
            Tap the card below to reveal the answers!
          </Text>
        </View>

        <TouchableOpacity onPress={handlePress} activeOpacity={1}>
          <FlipCard
            isFlipped={isFlipped}
            cardStyle={styles.flipCard}
            FlippedContent={
              <View style={[styles.card, styles.back]}>
                <Text style={styles.flashcardText}>
                  {currentFlashcard?.answer}
                </Text>
              </View>
            }
            RegularContent={
              <View style={[styles.card, { backgroundColor: "#1E1E1E" }]}>
                <Text style={styles.flashcardText}>
                  {currentFlashcard?.question}
                </Text>
              </View>
            }
          />
        </TouchableOpacity>
        <View style={styles.navigationContainer}>
          {currentIndex !== 0 && (
            <TouchableOpacity
              onPress={handlePrevious}
              style={[
                styles.button,
                currentIndex === flashcards.length - 1 && { width: "100%" },
              ]}
            >
              <Text style={styles.buttonText}>Prev Card! </Text>
            </TouchableOpacity>
          )}
          {currentIndex !== flashcards.length - 1 && (
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.button, currentIndex === 0 && { width: "100%" }]}
            >
              <Text style={styles.buttonText}>Next Card! </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Footer />
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
  card: {
    flex: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  flipCard: {
    width: "100%",
    height: "auto",
    minHeight: 200,
    backfaceVisibility: "hidden",
  },
});
