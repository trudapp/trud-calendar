import { rewrite, next } from "@vercel/edge";

/**
 * Vercel Edge Middleware: Markdown for Agents.
 *
 * When a request includes `Accept: text/markdown`, internally rewrite the
 * URL to its `.md` counterpart (generated at build time by Astro). The
 * agent stays on the original URL but receives the markdown body.
 *
 * Browsers send `Accept: text/html,...` so this is a no-op for them.
 */
export default function middleware(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("text/markdown")) return next();

  const url = new URL(request.url);

  // Skip URLs whose last path segment already has a file extension —
  // matches `/timezones.md`, `/_astro/foo.css`, `/favicon.ico`, etc.
  // Avoids both infinite rewrite loops and breaking static assets.
  const segments = url.pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "";
  if (lastSegment.includes(".")) return next();

  // Skip the agent-skills well-known endpoint — it serves JSON and the
  // SKILL.md should be requested explicitly, not through negotiation.
  if (url.pathname.startsWith("/.well-known/")) return next();

  const stripped = url.pathname.replace(/\/$/, "");
  const target = stripped === "" ? "/index.md" : `${stripped}.md`;

  return rewrite(new URL(target, url.origin));
}
