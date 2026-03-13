import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "trud-calendar",
      defaultLocale: "en",
      locales: {
        en: { label: "English", lang: "en" },
        es: { label: "Espanol", lang: "es" },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/trudcalendar/trud-calendar",
        },
      ],
      sidebar: [
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
