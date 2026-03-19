import { statsApi } from "../controllers/api";

export const apiRoutes = {
  "/api/stats": statsApi.index,
};
