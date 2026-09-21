import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getPosterUrl, useResolveGenres } from "core";
import type { RootStackParamList } from "@/navigation/types";
import type { MediaItem } from "@/utils/media";

interface MediaCardProps {
  item: MediaItem;
  width?: number;
}

export function MediaCard({ item, width = 120 }: MediaCardProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const genreNames = useResolveGenres(item.mediaType, item.genreIds ?? []);
  const posterUrl = getPosterUrl(item.posterPath);
  const year = item.year ? item.year.slice(0, 4) : null;

  return (
    <Pressable
      style={[styles.card, { width }]}
      onPress={() =>
        navigation.navigate("Details", {
          id: item.id,
          mediaType: item.mediaType,
        })
      }
    >
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.placeholder]}>
          <Text style={styles.placeholderText} numberOfLines={3}>
            {item.title}
          </Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      {year || genreNames.length > 0 ? (
        <Text style={styles.meta} numberOfLines={1}>
          {[year, genreNames.slice(0, 2).join(", ")]
            .filter(Boolean)
            .join(" • ")}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 12,
  },
  poster: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 12,
    backgroundColor: "#1f1f1f",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  placeholderText: {
    color: "#bbb",
    fontSize: 12,
    textAlign: "center",
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    opacity: 0.6,
  },
});
