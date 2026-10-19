import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiOrigin = new URL(
    loadEnv(mode, process.cwd(), "PUBLIC_").PUBLIC_API_BASE_URL,
  ).origin;

  return {
    envPrefix: ["VITE_", "PUBLIC_"],
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": { target: apiOrigin, changeOrigin: true },
      },
    },
  };
});
