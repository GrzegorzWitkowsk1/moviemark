import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { ActivityIndicator, Searchbar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useDebounce, useSearch } from "core";
import { MediaCard } from "@/components/MediaCard";
import { searchResultToItem } from "@/utils/media";

export default function SearchScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 400);
  const { data, isLoading } = useSearch(debounced);

  const hasQuery = debounced.trim().length > 0;
  const results = data ?? [];

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t("search.placeholder")}
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
      />

      {hasQuery && (
        <Text variant="bodySmall" style={styles.status}>
          {isLoading
            ? t("search.searching")
            : t("search.resultsFound", { count: results.length })}
        </Text>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : hasQuery && results.length > 0 ? (
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MediaCard item={searchResultToItem(item)} width={150} />
          )}
        />
      ) : hasQuery ? (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            {t("search.noResults")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchbar: {
    marginTop: 12,
  },
  status: {
    marginTop: 12,
    opacity: 0.7,
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
