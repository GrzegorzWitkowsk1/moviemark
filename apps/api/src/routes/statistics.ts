import type { FastifyInstance } from "fastify";
import { userId } from "../lib/request";
import type { StatisticsResponse } from "shared";
import { getStatistics } from "../services/statistics";

export async function statisticsRoutes(app: FastifyInstance) {
  app.get<{
    Reply: StatisticsResponse;
  }>(
    "/statistics",
    { preHandler: app.authenticate },
    async (request) => getStatistics(userId(request))
  );
}