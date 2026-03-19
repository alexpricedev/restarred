import { home, welcome } from "../controllers/app";
import { callback, github, login, logout } from "../controllers/auth";
import { createRouteHandler } from "../utils/route-handler";

export const appRoutes = {
  "/": home.index,
  "/welcome": welcome.index,
  "/login": login.index,
  "/auth/github": github.index,
  "/auth/callback": callback.index,
  "/auth/logout": createRouteHandler({
    POST: logout.create,
  }),
};
