import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    starlight({
      title: "trud-calendar",
      customCss: ["./src/styles/custom.css"],
      locales: {
        root: { label: "English", lang: "en" },
        es: { label: "Espanol", lang: "es" },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/trudapp/trud-calendar",
        },
      ],
      sidebar: [
        {
          label: "Playground",
          link: "/playground",
          translations: { es: "Playground" },
        },
        {
          label: "Getting Started",
          translations: { es: "Primeros pasos" },
          items: [
            {
              slug: "getting-started",
              label: "Introduction",
              translations: { es: "Introduccion" },
            },
            {
              slug: "installation",
              label: "Installation",
              translations: { es: "Instalacion" },
            },
          ],
        },
        {
          label: "Guide",
          translations: { es: "Guia" },
          items: [
            {
              slug: "views",
              label: "Views",
              translations: { es: "Vistas" },
            },
            {
              slug: "drag-and-drop",
              label: "Drag & Drop",
            },
            {
              slug: "recurrence",
              label: "Recurrence",
              translations: { es: "Recurrencia" },
            },
            {
              slug: "keyboard-navigation",
              label: "Keyboard Navigation",
              translations: { es: "Navegacion por Teclado" },
            },
            {
              slug: "i18n",
              label: "Locale & i18n",
              translations: { es: "Idiomas e i18n" },
            },
            {
              slug: "theming",
              label: "Theming",
              translations: { es: "Temas" },
            },
            {
              slug: "slots",
              label: "Slots API",
            },
          ],
        },
        {
          label: "API Reference",
          translations: { es: "Referencia API" },
          items: [
            {
              slug: "props",
              label: "Props",
            },
            {
              slug: "hooks",
              label: "Hooks",
            },
            {
              slug: "headless-core",
              label: "Headless Core",
            },
          ],
        },
      ],
    }),
  ],
});
