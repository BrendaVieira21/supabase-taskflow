import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Força o framework a gerar páginas estáticas index.html puro para o GitHub Pages
    deploymentTarget: "static", 
  },
  vite: {
    base: "/supabase-taskflow/",
  },
});