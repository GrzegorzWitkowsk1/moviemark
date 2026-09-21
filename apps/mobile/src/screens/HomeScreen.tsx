import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import {
  useNewContent,
  useTrendingContent,
  useUpcomingMovies,
} from "core";
import { Screen } from "@/components/Screen";
import { CarouselSection } from "@/components/CarouselSection";
import { movieToItem, tvToItem } from "@/utils/media";

export default function HomeScreen() {
  const { t } = useTranslation();
  const newContent = useNewContent();
  const upcoming = useUpcomingMovies();
  const trending = useTrendingContent();

  const loading =
    newContent.isLoading || upcoming.isLoading || trending.isLoading;

  return (
    <Screen>
      <Text variant="headlineSmall" style={styles.hero}>
        {t("home.heroTitle")}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {t("home.heroSubtitle")}
      </Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <View style={styles.sections}>
          <CarouselSection
            title={t("home.newReleases")}
            movies={(newContent.data?.movies ?? []).map(movieToItem)}
            series={(newContent.data?.series ?? []).map(tvToItem)}
          />
          <CarouselSection
            title={t("home.upcoming")}
            movies={(upcoming.data ?? []).map(movieToItem)}
          />
          <CarouselSection
            title={t("home.trending")}
            movies={(trending.data?.movies ?? []).map(movieToItem)}
            series={(trending.data?.series ?? []).map(tvToItem)}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 20,
  },
  loader: {
    marginTop: 48,
  },
  sections: {
    gap: 28,
  },
});
