import { starsStatusApi, statsApi } from "../controllers/api";

export const apiRoutes = {
  "/api/stats": statsApi.index,
  "/api/stars/status": starsStatusApi.index,
};
