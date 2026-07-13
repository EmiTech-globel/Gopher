import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconShoppingBag, IconRun, IconWallet } from "@tabler/icons-react-native";
import { onboardingSlides, type OnboardingSlide } from "../../data/onboarding-slides";
import { colors, fonts } from "../../theme";

const ONBOARDING_SEEN_KEY = "gopher.onboardingSeen";

const slideIcons: Record<OnboardingSlide["icon"], typeof IconShoppingBag> = {
  "shopping-bag": IconShoppingBag,
  run: IconRun,
  wallet: IconWallet,
};

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);

  const isLastSlide = activeIndex === onboardingSlides.length - 1;

  async function completeOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    router.replace("/login");
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  }

  function handleNext() {
    if (isLastSlide) {
      completeOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: activeIndex + 1 });
  }

  return (
    <View style={styles.container}>
      {!isLastSlide && (
        <Pressable style={styles.skip} onPress={completeOnboarding} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      <FlatList<OnboardingSlide>
        ref={listRef}
        data={onboardingSlides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => {
          const SlideIcon = slideIcons[item.icon];
          return (
            <View style={[styles.slide, { width }]}>
              <View style={styles.iconCircle}>
                <SlideIcon size={36} color={colors.accent} strokeWidth={1.75} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {onboardingSlides.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {isLastSlide ? "Get started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceBase,
  },
  skip: {
    position: "absolute",
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    color: colors.accent,
    opacity: 0.6,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.headingBold,
    color: colors.accent,
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: fonts.bodyRegular,
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonText: {
    color: colors.accent,
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
});