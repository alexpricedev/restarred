import { initializePage, registerPage } from "@client/page-lifecycle";
import { init as initHome } from "@client/pages/home";
import { init as initWelcome } from "@client/pages/welcome";

registerPage("home", { init: initHome });
registerPage("welcome", { init: initWelcome });

initializePage(document.body.dataset.page);
