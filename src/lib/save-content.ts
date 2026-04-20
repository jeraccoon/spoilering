import { promises as fs } from "node:fs";
import path from "node:path";
import { contents, type ContentType, type SpoileringContent } from "@/data/contents";

export type EditableContentPayload = {
  title: string;
  type: ContentType;
  year: string;
  shortSummary: string;
  start: string;
  development: string;
  ending: string;
};

function createSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createUniqueSlug(title: string) {
  const baseSlug = createSlug(title) || "contenido";
  const existingSlugs = new Set(contents.map((content) => content.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let slug = `${baseSlug}-${counter}`;

  while (existingSlugs.has(slug)) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function toContent(payload: EditableContentPayload): SpoileringContent {
  const title = payload.title.trim();

  if (!title) {
    throw new Error("La ficha necesita un título antes de guardarse.");
  }

  return {
    title,
    slug: createUniqueSlug(title),
    type: payload.type,
    year: payload.year.trim() || "No verificado",
    shortSummary: payload.shortSummary.trim(),
    longSummary: [
      {
        title: "Inicio",
        paragraphs: splitParagraphs(payload.start),
      },
      {
        title: "Desarrollo",
        paragraphs: splitParagraphs(payload.development),
      },
      {
        title: "Final",
        paragraphs: splitParagraphs(payload.ending),
      },
    ],
  };
}

function serializeContents(nextContents: SpoileringContent[]) {
  return `export type ContentType = "libro" | "serie" | "pelicula";

export type LongSummarySection = {
  title: string;
  paragraphs: string[];
};

export type SpoileringContent = {
  title: string;
  slug: string;
  type: ContentType;
  year: string;
  shortSummary: string;
  longSummary: LongSummarySection[];
};

export const contents: SpoileringContent[] = ${JSON.stringify(
    nextContents,
    null,
    2,
  )};

export function getContentBySlug(slug: string) {
  return contents.find((content) => content.slug === slug);
}

export function getContentTypeLabel(type: ContentType) {
  const labels: Record<ContentType, string> = {
    libro: "Libro",
    serie: "Serie",
    pelicula: "Película",
  };

  return labels[type];
}
`;
}

export async function saveContent(payload: EditableContentPayload) {
  const newContent = toContent(payload);
  const nextContents = [...contents, newContent];
  const filePath = path.join(process.cwd(), "src", "data", "contents.ts");

  await fs.writeFile(filePath, serializeContents(nextContents), "utf8");

  return newContent;
}
