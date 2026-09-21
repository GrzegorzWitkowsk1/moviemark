import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SegmentedButtons, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import type { TmdbMediaType } from "shared";
import { MediaCard } from "./MediaCard";
import type { MediaItem } from "@/utils/media";

interface CarouselSectionProps {
  title: string;
  movies: MediaItem[];
  series?: MediaItem[];
}

export function CarouselSection({
  title,
  movies,
  series = [],
}: CarouselSectionProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<TmdbMediaType>(() =>
    movies.length > 0 ? "movie" : "tv"
  );

  const hasToggle = movies.length > 0 && series.length > 0;
  const viewMode = hasToggle
    ? selected
    : movies.length > 0
      ? "movie"
      : "tv";
  const items = viewMode === "movie" ? movies : series;

  if (movies.length === 0 && series.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          {title}
        </Text>
        {hasToggle && (
          <SegmentedButtons
            density="small"
            value={viewMode}
            onValueChange={(value) => setSelected(value as TmdbMediaType)}
            style={styles.toggle}
            buttons={[
              { value: "movie", label: t("common.movies") },
              { value: "tv", label: t("common.series") },
            ]}
          />
        )}
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => `${item.mediaType}-${item.id}`}
        renderItem={({ item }) => <MediaCard item={item} />}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontWeight: "700",
    flexShrink: 1,
  },
  toggle: {
    flexShrink: 0,
  },
});
