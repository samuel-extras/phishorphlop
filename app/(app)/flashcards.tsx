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
import Footer from "@/components/footer";
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
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));

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
  const handleFlip = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredFlashcards.length);
    if (isFlipped) {
      flipAnim.setValue(0);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) =>
        (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length
    );
    if (isFlipped) {
      flipAnim.setValue(0);
      setIsFlipped(false);
    }
  };
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
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
        <TouchableOpacity onPress={handleFlip} activeOpacity={1}>
          <Animated.View
            style={[
              styles.flashcard,
              frontAnimatedStyle,
              isFlipped && styles.hidden,
            ]}
          >
            <Text style={styles.flashcardText}>
              {currentFlashcard?.question}
            </Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.flashcard,
              backAnimatedStyle,
              !isFlipped && styles.hidden,
              styles.back,
            ]}
          >
            <Text style={styles.flashcardText}>{currentFlashcard?.answer}</Text>
          </Animated.View>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={{
            backgroundColor: "#1E1E1E",
            height: "auto",
            paddingVertical: 18,
            paddingHorizontal: 18,
            minHeight: 200,
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
            {" "}
          </Text>
        </TouchableOpacity> */}
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
    position: "absolute",
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

// import React, { useState, useEffect } from "react";

// import { useSQLiteContext } from "expo-sqlite";
// import { Picker } from '@react-native-picker/picker';
// import FontAwesome from "@expo/vector-icons/FontAwesome";

// interface Flashcard {
//   id: number;
//   question: string;
//   answer: string;
//   category: string;
// }

// export default function FlashcardScreen() {
//   const db = useSQLiteContext();
//   const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [selectedCategory, setSelectedCategory] = useState<string>("All");
//   const [isFlipped, setIsFlipped] = useState(false);
//   const [flipAnim] = useState(new Animated.Value(0));

//   useEffect(() => {
//     const fetchFlashcards = async () => {
//       try {
//         const results = await db.getAllAsync<Flashcard>(
//           "SELECT * FROM flashcards"
//         );
//         setFlashcards(results);
//       } catch (error: any) {
//         console.error("Error fetching flashcards:", error);
//       }
//     };
//     fetchFlashcards();
//   }, [db]);

//   const filteredFlashcards =
//     selectedCategory === "All"
//       ? flashcards
//       : flashcards.filter((card) => card.category === selectedCategory);

//   const currentFlashcard = filteredFlashcards[currentIndex];

//   const handleFlip = () => {
//     Animated.timing(flipAnim, {
//       toValue: isFlipped ? 0 : 1,
//       duration: 300,
//       easing: Easing.linear,
//       useNativeDriver: true,
//     }).start();
//     setIsFlipped(!isFlipped);
//   };

//   const handleNext = () => {
//     setCurrentIndex((prev) => (prev + 1) % filteredFlashcards.length);
//     if (isFlipped) {
//       flipAnim.setValue(0);
//       setIsFlipped(false);
//     }
//   };

//   const handlePrevious = () => {
//     setCurrentIndex(
//       (prev) =>
//         (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length
//     );
//     if (isFlipped) {
//       flipAnim.setValue(0);
//       setIsFlipped(false);
//     }
//   };

//   const frontInterpolate = flipAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["0deg", "180deg"],
//   });

//   const backInterpolate = flipAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["180deg", "360deg"],
//   });

//   const frontAnimatedStyle = {
//     transform: [{ rotateY: frontInterpolate }],
//   };

//   const backAnimatedStyle = {
//     transform: [{ rotateY: backInterpolate }],
//   };

//   return (
//     <ScrollView style={styles.container}>
//       <Text style={styles.title}>Study Flashcards</Text>
//       <Text style={styles.subtitle}>
//         Tap the card to flip, use arrows to navigate!
//       </Text>

//       {/* <View style={styles.filterContainer}>
//         <Text style={styles.filterLabel}>Filter by Category:</Text>
//         <Picker
//           selectedValue={selectedCategory}
//           onValueChange={(value) => {
//             setSelectedCategory(value);
//             setCurrentIndex(0);
//             if (isFlipped) {
//               flipAnim.setValue(0);
//               setIsFlipped(false);
//             }
//           }}
//           style={styles.picker}
//         >
//           <Picker.Item label="All" value="All" />
//           <Picker.Item label="Question" value="Question" />
//           <Picker.Item label="Definition" value="Definition" />
//           <Picker.Item label="Best Practice" value="Best Practice" />
//           <Picker.Item label="Term" value="Term" />
//         </Picker>
//       </View> */}

//       {filteredFlashcards.length > 0 ? (
//         <View style={styles.flashcardContainer}>
//           <TouchableOpacity onPress={handleFlip} activeOpacity={1}>
//             <Animated.View
//               style={[
//                 styles.flashcard,
//                 frontAnimatedStyle,
//                 isFlipped && styles.hidden,
//               ]}
//             >
//               <Text style={styles.flashcardText}>
//                 {currentFlashcard?.question}
//               </Text>
//               <Text style={styles.flashcardCategory}>
//                 {currentFlashcard?.category}
//               </Text>
//             </Animated.View>
//             <Animated.View
//               style={[
//                 styles.flashcard,
//                 backAnimatedStyle,
//                 !isFlipped && styles.hidden,
//                 styles.back,
//               ]}
//             >
//               <Text style={styles.flashcardText}>
//                 {currentFlashcard?.answer}
//               </Text>
//               <Text style={styles.flashcardCategory}>
//                 {currentFlashcard?.category}
//               </Text>
//             </Animated.View>
//           </TouchableOpacity>
//           <View style={styles.navigationContainer}>
//             <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
//               <FontAwesome name="arrow-left" size={24} color="#333" />
//             </TouchableOpacity>
//             <Text style={styles.navText}>
//               {currentIndex + 1} / {filteredFlashcards.length}
//             </Text>
//             <TouchableOpacity onPress={handleNext} style={styles.navButton}>
//               <FontAwesome name="arrow-right" size={24} color="#333" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       ) : (
//         <Text style={styles.noFlashcards}>
//           No flashcards available for this category.
//         </Text>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: "#f5f5f5",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 10,
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "#666",
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   filterContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   filterLabel: {
//     fontSize: 16,
//     marginRight: 10,
//   },
//   picker: {
//     flex: 1,
//     height: 44,
//   },
//   flashcardContainer: {
//     alignItems: "center",
//   },
//   flashcard: {
//     backgroundColor: "#fff",
//     borderRadius: 8,
//     padding: 20,
//     width: "100%",
//     minHeight: 150,
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     position: "absolute",
//   },
//   back: {
//     backgroundColor: "#e6f3ff",
//   },
//   hidden: {
//     backfaceVisibility: "hidden",
//   },
//   flashcardText: {
//     fontSize: 16,
//     textAlign: "center",
//     color: "#333",
//   },
//   flashcardCategory: {
//     fontSize: 14,
//     color: "#666",
//     marginTop: 10,
//   },
//   navigationContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     width: "100%",
//     marginTop: 180, // Adjust to ensure navigation is below the flashcard
//   },
//   navButton: {
//     padding: 10,
//   },
//   navText: {
//     fontSize: 16,
//     color: "#333",
//   },
//   noFlashcards: {
//     fontSize: 16,
//     color: "#666",
//     textAlign: "center",
//     marginTop: 20,
//   },
// });
