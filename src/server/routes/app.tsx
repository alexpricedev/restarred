import { home, welcome } from "../controllers/app";
import { callback, github, logout } from "../controllers/auth";
import { createRouteHandler } from "../utils/route-handler";

export const appRoutes = {
  "/": home.index,
  "/welcome": welcome.index,
  "/auth/github": github.index,
  "/auth/callback": callback.index,
  "/auth/logout": createRouteHandler({
    POST: logout.create,
  }),
};
