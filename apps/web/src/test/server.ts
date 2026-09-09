import { setupServer } from "msw/node";
import { apiHandlers } from "./handlers/apiHandlers";
import { tmdbHandlers } from "./handlers/tmdbHandlers";

export const server = setupServer(...apiHandlers, ...tmdbHandlers);
