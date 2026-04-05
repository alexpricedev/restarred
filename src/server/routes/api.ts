import { starsStatusApi, statsApi, webhookApi } from "../controllers/api";
import { createRouteHandler } from "../utils/route-handler";

export const apiRoutes = {
  "/api/stats": statsApi.index,
  "/api/stars/status": starsStatusApi.index,
  "/api/webhooks/resend": createRouteHandler({ POST: webhookApi.receive }),
};
