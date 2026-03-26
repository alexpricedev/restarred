import { confetti } from "@client/confetti";

export function init() {
  const heading = document.querySelector(".unstar-heading");
  if (heading?.textContent === "UNSTARRED") {
    confetti("burst");
  }
}
