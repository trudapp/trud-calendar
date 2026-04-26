import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const SITE_URL = "https://trud-calendar-docs.vercel.app";
const DESCRIPTION =
  "The most complete open-source React calendar component library. Drag & drop, recurrence (RFC 5545), resource views, year view, iCal export, RTL, dark mode, headless core. Drop-in replacement for react-big-calendar.";
const OG_IMAGE = `${SITE_URL}/og/default.png`;
const OG_IMAGE_SQUARE = `${SITE_URL}/og/default-square.png`;

export default defineConfig({
  site: SITE_URL,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", es: "es" },
      },
    }),
    starlight({
      title: "trud-calendar",
      description: DESCRIPTION,
      favicon: "/favicon.ico",
      head: [
        { tag: "link", attrs: { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" } },
        { tag: "link", attrs: { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" } },
        { tag: "meta", attrs: { property: "og:type", content: "website" } },
        { tag: "meta", attrs: { property: "og:site_name", content: "trud-calendar" } },
        { tag: "meta", attrs: { property: "og:title", content: "trud-calendar — React calendar component library" } },
        { tag: "meta", attrs: { property: "og:description", content: DESCRIPTION } },
        { tag: "meta", attrs: { property: "og:image", content: OG_IMAGE } },
        { tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
        { tag: "meta", attrs: { property: "og:image:height", content: "630" } },
        { tag: "meta", attrs: { property: "og:image:alt", content: "trud-calendar — React calendar component library" } },
        { tag: "meta", attrs: { property: "og:image", content: OG_IMAGE_SQUARE } },
        { tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
        { tag: "meta", attrs: { property: "og:image:height", content: "1200" } },
        { tag: "meta", attrs: { property: "og:url", content: SITE_URL } },
        { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" } },
        { tag: "meta", attrs: { name: "twitter:title", content: "trud-calendar — React calendar component library" } },
        { tag: "meta", attrs: { name: "twitter:description", content: DESCRIPTION } },
        { tag: "meta", attrs: { name: "twitter:image", content: OG_IMAGE } },
        { tag: "meta", attrs: { name: "twitter:image:alt", content: "trud-calendar — React calendar component library" } },
        { tag: "link", attrs: { rel: "alternate", type: "text/plain", href: "/llms.txt", title: "llms.txt" } },
        { tag: "link", attrs: { rel: "alternate", type: "text/plain", href: "/llms-full.txt", title: "llms-full.txt" } },
      ],
      customCss: ["./src/styles/custom.css"],
      locales: {
        root: { label: "English", lang: "en" },
        es: { label: "Español", lang: "es" },
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
            {
              slug: "migration",
              label: "Migrating from react-big-calendar",
              translations: { es: "Migracion desde react-big-calendar" },
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
              slug: "timezones",
              label: "Timezones",
              translations: { es: "Zonas horarias" },
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
            {
              slug: "resource-views",
              label: "Resource Views",
              translations: { es: "Vistas de Recursos" },
            },
            {
              slug: "resource-timeline",
              label: "Resource Timeline",
              translations: { es: "Timeline de Recursos" },
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
