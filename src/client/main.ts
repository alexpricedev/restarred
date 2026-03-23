import { initializePage, registerPage } from "@client/page-lifecycle";
import { init as initAccount } from "@client/pages/account";
import { init as initFirst } from "@client/pages/first";
import { init as initHome } from "@client/pages/home";
import { init as initUnstar } from "@client/pages/unstar";
import { init as initWelcome } from "@client/pages/welcome";

registerPage("account", { init: initAccount });
registerPage("first", { init: initFirst });
registerPage("home", { init: initHome });
registerPage("unstar", { init: initUnstar });
registerPage("welcome", { init: initWelcome });

initializePage(document.body.dataset.page);
