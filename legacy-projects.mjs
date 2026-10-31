// Projects that remain published at their original GitHub Pages addresses.
export const legacyProjects = [
  "3d-f35-v2",
  "africa",
  "bottom_of_the_food_chain",
  "box-puzzle-2",
  "chekhov_hwacha",
  "dropkindnessnotbombs",
  "edgar-birthday",
  "emulator",
  "event-tinder",
  "frazzled-cafe",
  "hugahippo",
  "image_crop_test",
  "island_puzzle",
  "kindness-dev",
  "kindness-prod",
  "kindness-website.com",
  "mental-health-ai",
  "mnookin-two-pager",
  "portfolio",
  "project-origin",
  "react_app",
  "rubyWebsite",
  "shinto-game",
  "siblings_website",
  "space-cadet",
  "too_much_duolingo"
];

export function redirectLegacyProject(location) {
  const project = location.pathname.split("/")[1];
  if (legacyProjects.includes(project)) {
    location.replace("https://maxbye3.github.io" + location.pathname + location.search + location.hash);
  }
}

if (typeof window !== "undefined") redirectLegacyProject(window.location);
