import { initializePage, registerPage } from "@client/page-lifecycle";
import { init as initHome } from "@client/pages/home";

registerPage("home", { init: initHome });

initializePage(document.body.dataset.page);
