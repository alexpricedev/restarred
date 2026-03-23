import {
  account,
  deleteAccount,
  feedback,
  first,
  home,
  unsubscribe,
  welcome,
} from "../controllers/app";
import { callback, github, logout } from "../controllers/auth";
import { createRouteHandler } from "../utils/route-handler";

export const appRoutes = {
  "/": home.index,
  "/feedback": feedback.index,
  "/welcome": welcome.index,
  "/first": first.index,
  "/first/send": createRouteHandler({ POST: first.send }),
  "/first/skip": createRouteHandler({ POST: first.skip }),
  "/auth/github": github.index,
  "/auth/callback": callback.index,
  "/account": createRouteHandler({
    GET: account.index,
    POST: account.update,
  }),
  "/account/test-email": createRouteHandler({
    POST: account.testEmail,
  }),
  "/account/delete": createRouteHandler({
    GET: deleteAccount.index,
    POST: deleteAccount.destroy,
  }),
  "/auth/logout": createRouteHandler({
    POST: logout.create,
  }),
  "/unsubscribe": createRouteHandler({
    GET: unsubscribe.index,
    POST: unsubscribe.confirm,
  }),
};
