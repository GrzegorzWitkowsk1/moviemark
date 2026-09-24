import { useQuery } from "@tanstack/react-query";
import { getStatistics } from "@/lib/api";

export const statisticsKey = ["statistics"] as const;

export function useStatistics() {
  return useQuery({
    queryKey: statisticsKey,
    queryFn: getStatistics,
  });
}