import { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useFutureList } from "core";
import { MediaCard } from "@/components/MediaCard";
import { futureToItem, type MediaItem } from "@/utils/media";

export default function WantToWatchScreen() {
  const { t } = useTranslation();
  const { data, isLoading } = useFutureList();

  const items = useMemo<MediaItem[]>(() => {
    const movies = (data?.movies ?? []).map(futureToItem);
    const series = (data?.series ?? []).map(futureToItem);
    return [...movies, ...series];
  }, [data]);

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        {t("nav.wantToWatch")}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {t("wantToWatch.description")}
      </Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            {t("wantToWatch.empty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => `${item.mediaType}-${item.id}`}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <MediaCard item={item} width={150} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  loader: {
    marginTop: 48,
  },
  list: {
    paddingVertical: 16,
  },
  column: {
    justifyContent: "space-between",
  },
  empty: {
    alignItems: "center",
    paddingTop: 64,
  },
  emptyText: {
    opacity: 0.6,
  },
});
