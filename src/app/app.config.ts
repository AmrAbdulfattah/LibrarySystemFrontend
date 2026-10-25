import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
} from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { API_BASE_URL } from "./core/api";
import { AuthService, authInterceptor } from "./core/auth";
import { routes } from "./app.routes";
export function appConfig(apiBaseUrl: string): ApplicationConfig {
  return {
    providers: [
      provideAppInitializer(() => {
        inject(AuthService);
      }),
      provideRouter(
        routes,
        withInMemoryScrolling({ scrollPositionRestoration: "enabled" }),
      ),
      provideHttpClient(withInterceptors([authInterceptor])),
      { provide: API_BASE_URL, useValue: apiBaseUrl },
    ],
  };
}
