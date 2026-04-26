import { getCollection, type CollectionEntry } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";

type DocEntry = CollectionEntry<"docs">;

const slugForEntry = (entry: DocEntry): string => (entry.id === "" ? "index" : entry.id);

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection("docs");
  return docs.map((entry) => ({
    params: { slug: slugForEntry(entry) },
    props: { entry },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: DocEntry };
  const { title, description } = entry.data;

  const rawBody = (entry.body ?? "").replace(/^\s*import\s+.+\s+from\s+["'].+["'];?\s*$/gm, "").trim();

  const front = ["---"];
  if (title) front.push(`title: ${JSON.stringify(title)}`);
  if (description) front.push(`description: ${JSON.stringify(description)}`);
  front.push("---", "");

  return new Response(`${front.join("\n")}\n${rawBody}\n`, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      "Vary": "Accept",
    },
  });
};
