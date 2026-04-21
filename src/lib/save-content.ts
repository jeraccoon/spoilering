import { promises as fs } from "node:fs";
import path from "node:path";
import {
  contents,
  type ContentStatus,
  type ContentType,
  type SpoileringContent,
} from "@/data/contents";

export type EditableContentPayload = {
  title: string;
  type: ContentType;
  year: string;
  status: ContentStatus;
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

function createUniqueSlug(title: string, currentSlug?: string) {
  const baseSlug = createSlug(title) || "contenido";
  const existingSlugs = new Set(
    contents
      .filter((content) => content.slug !== currentSlug)
      .map((content) => content.slug),
  );

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

function toContent(
  payload: EditableContentPayload,
  currentSlug?: string,
): SpoileringContent {
  const title = payload.title.trim();

  if (!title) {
    throw new Error("La ficha necesita un título antes de guardarse.");
  }

  return {
    title,
    slug: createUniqueSlug(title, currentSlug),
    type: payload.type,
    year: payload.year.trim() || "No verificado",
    status: payload.status,
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
export type ContentStatus = "draft" | "published";

export type LongSummarySection = {
  title: string;
  paragraphs: string[];
};

export type SpoileringContent = {
  title: string;
  slug: string;
  type: ContentType;
  year: string;
  status?: ContentStatus;
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

export function getContentStatus(content: SpoileringContent): ContentStatus {
  return content.status ?? "published";
}

export function isPublishedContent(content: SpoileringContent) {
  return getContentStatus(content) === "published";
}

export function getPublishedContents() {
  return contents.filter(isPublishedContent);
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

async function writeContents(nextContents: SpoileringContent[]) {
  const filePath = path.join(process.cwd(), "src", "data", "contents.ts");
  await fs.writeFile(filePath, serializeContents(nextContents), "utf8");
}

export function getEditableContentBySlug(slug: string) {
  const content = contents.find((item) => item.slug === slug);

  if (!content) {
    return null;
  }

  return {
    title: content.title,
    type: content.type,
    year: content.year,
    status: content.status ?? "published",
    shortSummary: content.shortSummary,
    start:
      content.longSummary.find((section) => section.title === "Inicio")?.paragraphs.join("\n\n") ??
      "",
    development:
      content.longSummary
        .find((section) => section.title === "Desarrollo")
        ?.paragraphs.join("\n\n") ?? "",
    ending:
      content.longSummary.find((section) => section.title === "Final")?.paragraphs.join("\n\n") ??
      "",
  };
}

export async function saveContent(payload: EditableContentPayload) {
  const newContent = toContent(payload);
  const nextContents = [...contents, newContent];

  await writeContents(nextContents);

  return newContent;
}

export async function updateContent(
  slug: string,
  payload: EditableContentPayload,
) {
  const existingIndex = contents.findIndex((content) => content.slug === slug);

  if (existingIndex === -1) {
    throw new Error("No se encontró la ficha que quieres editar.");
  }

  const updatedContent = toContent(payload, slug);
  const nextContents = [...contents];
  nextContents[existingIndex] = updatedContent;

  await writeContents(nextContents);

  return updatedContent;
}
