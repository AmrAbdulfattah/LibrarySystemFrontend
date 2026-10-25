import { bootstrapApplication } from "@angular/platform-browser";
import { App } from "./app/app";
import { appConfig } from "./app/app.config";
fetch("/config.json")
  .then(async (response) => {
    if (!response.ok) throw new Error("Configuration unavailable");
    const config = await response.json();
    const url = new URL(config.apiBaseUrl);
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("Invalid API URL");
    await bootstrapApplication(App, appConfig(url.href.replace(/\/$/, "")));
  })
  .catch(() => {
    document.body.textContent =
      "The library could not start. Check config.json and reload.";
  });
