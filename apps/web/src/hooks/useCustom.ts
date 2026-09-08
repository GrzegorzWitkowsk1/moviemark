import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CustomItemResponse,
  CustomMovieRequest,
  CustomSeriesRequest,
  TmdbMediaType,
} from "shared";
import {
  createCustomMovie,
  createCustomSeries,
  getCustomItem,
} from "@/lib/api";
import { collectionKey } from "./useCollection";

export const customItemKey = (id: number, type: TmdbMediaType) => [
  "custom",
  id,
  type,
];

export function useCustomItem(id: number, type: TmdbMediaType) {
  return useQuery({
    queryKey: customItemKey(id, type),
    queryFn: () => getCustomItem(id, type),
    enabled: Number.isFinite(id) && id < 0,
  });
}

export function useCreateCustomItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      mediaType: TmdbMediaType;
      data: CustomMovieRequest | CustomSeriesRequest;
    }) =>
      payload.mediaType === "movie"
        ? createCustomMovie(payload.data as CustomMovieRequest)
        : createCustomSeries(payload.data as CustomSeriesRequest),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: collectionKey });
      const customId =
        (result as CustomItemResponse & { customId: number }).customId;
      queryClient.invalidateQueries({
        queryKey: customItemKey(customId, result.mediaType),
      });
    },
  });
}
