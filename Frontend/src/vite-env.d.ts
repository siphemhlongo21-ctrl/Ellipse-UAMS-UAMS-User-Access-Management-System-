/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEV_AD_USERNAME?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  /** `ad` | `entra` | `both` (Entra + manual AD). */
  readonly VITE_AUTH_MODE?: string;
  readonly VITE_AZURE_TENANT_ID?: string;
  readonly VITE_AZURE_CLIENT_ID?: string;
  readonly VITE_AZURE_API_SCOPE?: string;
  readonly VITE_AZURE_REDIRECT_URI?: string;
  /** When true, show seeded DEV\\ellipse.* quick-login chips on the login page. */
  readonly VITE_SHOW_DEV_LOGIN_HINTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
