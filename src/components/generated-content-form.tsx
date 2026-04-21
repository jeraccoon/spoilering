"use client";

import Image from "next/image";
import { useState } from "react";
import {
  contents,
  getContentTypeLabel,
  type ContentStatus,
  type ContentType,
} from "@/data/contents";
import type {
  GeneratedContent,
  GenerationReference,
} from "@/lib/generate-content";
import type { TmdbSearchResult } from "@/lib/tmdb";

type GenerateResponse = {
  content?: GeneratedContent;
  error?: string;
};

type SaveResponse = {
  content?: {
    slug: string;
    status?: ContentStatus;
    title: string;
  };
  error?: string;
};

type TmdbSearchResponse = {
  results?: TmdbSearchResult[];
  error?: string;
};

type EditableContent = {
  title: string;
  type: ContentType;
  year: string;
  status: ContentStatus;
  shortSummary: string;
  start: string;
  development: string;
  ending: string;
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenizeText(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function findMatchingContents(query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  const queryWords = tokenizeText(query);

  return contents
    .map((content) => {
      const normalizedTitle = normalizeText(content.title);
      const titleWords = tokenizeText(content.title);
      const allWordsMatch = queryWords.every((word) =>
        titleWords.some((titleWord) => titleWord.includes(word)),
      );
      const someWordsMatch = queryWords.some((word) =>
        titleWords.some((titleWord) => titleWord.includes(word)),
      );

      const score =
        normalizedTitle === normalizedQuery
          ? 4
          : normalizedTitle.includes(normalizedQuery)
            ? 3
            : allWordsMatch
              ? 2
              : someWordsMatch
                ? 1
                : 0;

      return { content, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.content.title.localeCompare(right.content.title),
    )
    .map(({ content }) => content);
}

function getSectionText(content: GeneratedContent, sectionTitle: string) {
  return (
    content.longSummary
      .find((section) => section.title === sectionTitle)
      ?.paragraphs.join("\n\n") ?? ""
  );
}

function createEditableContent(content: GeneratedContent): EditableContent {
  return {
    title: content.title,
    type: content.type,
    year: content.year,
    status: "draft",
    shortSummary: content.shortSummary,
    start: getSectionText(content, "Inicio"),
    development: getSectionText(content, "Desarrollo"),
    ending: getSectionText(content, "Final"),
  };
}

function createLocalReference(content: {
  slug: string;
  title: string;
  type: ContentType;
  year: string;
}): GenerationReference {
  return {
    slug: content.slug,
    title: content.title,
    type: content.type,
    year: content.year,
    source: "local",
  };
}

function createTmdbReference(result: TmdbSearchResult): GenerationReference {
  return {
    title: result.title,
    type: result.type,
    year: result.year,
    source: "tmdb",
    tmdbId: result.id,
  };
}

export function GeneratedContentForm() {
  const [title, setTitle] = useState("");
  const [editableContent, setEditableContent] =
    useState<EditableContent | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [tmdbMessage, setTmdbMessage] = useState("");
  const [matchingContents, setMatchingContents] = useState<
    GenerationReference[]
  >([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);

  async function generateContentRequest(reference?: GenerationReference) {
    setError("");
    setEditableContent(null);
    setSaveMessage("");
    setTmdbMessage("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: reference?.title ?? title,
          reference,
        }),
      });
      const data = (await response.json()) as GenerateResponse;

      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "No se pudo generar la ficha.");
      }

      setMatchingContents([]);
      setSelectedSlug("");
      setTmdbResults([]);
      setSelectedTmdbId(null);
      setEditableContent(createEditableContent(data.content));
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "No se pudo generar la ficha.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEditableContent(null);
    setSaveMessage("");
    setTmdbMessage("");
    setTmdbResults([]);
    setSelectedTmdbId(null);

    const matches = findMatchingContents(title).map((content) =>
      createLocalReference(content),
    );

    if (matches.length > 0) {
      setMatchingContents(matches);
      setSelectedSlug(matches[0]?.slug ?? "");
      return;
    }

    await generateContentRequest();
  }

  async function handleSearchTmdb() {
    if (!title.trim()) {
      setError("Escribe un título antes de buscar en TMDb.");
      return;
    }

    setError("");
    setEditableContent(null);
    setSaveMessage("");
    setTmdbMessage("");
    setMatchingContents([]);
    setSelectedSlug("");
    setTmdbResults([]);
    setSelectedTmdbId(null);
    setIsSearchingTmdb(true);

    try {
      const response = await fetch("/api/admin/search-tmdb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });
      const data = (await response.json()) as TmdbSearchResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo buscar en TMDb.");
      }

      const results = data.results ?? [];
      setTmdbResults(results);
      setSelectedTmdbId(results[0]?.id ?? null);

      if (results.length === 0) {
        setTmdbMessage("TMDb no ha devuelto resultados para este título.");
      }
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "No se pudo buscar en TMDb.",
      );
    } finally {
      setIsSearchingTmdb(false);
    }
  }

  function updateEditableContent<K extends keyof EditableContent>(
    field: K,
    value: EditableContent[K],
  ) {
    setEditableContent((currentContent) =>
      currentContent
        ? {
            ...currentContent,
            [field]: value,
          }
        : currentContent,
    );
    setSaveMessage("");
  }

  async function saveWithStatus(status: ContentStatus) {
    if (!editableContent) {
      return;
    }

    const payload: EditableContent = {
      ...editableContent,
      status,
    };

    setEditableContent(payload);
    setError("");
    setSaveMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/save-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as SaveResponse;

      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "No se pudo guardar la ficha.");
      }

      const savedStatus = data.content.status ?? status;
      const statusLabel =
        savedStatus === "draft" ? "guardada como borrador" : "publicada";

      setSaveMessage(
        `Ficha ${statusLabel}: "${data.content.title}". URL: /contenido/${data.content.slug}`,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar la ficha.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const selectedOption =
    matchingContents.find((content) => content.slug === selectedSlug) ?? null;
  const selectedTmdbOption =
    tmdbResults.find((result) => result.id === selectedTmdbId) ?? null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="rounded-lg border border-ember/25 bg-ember/10 px-4 py-3">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-ember">
            Herramienta interna
          </p>
          <p className="mt-2 font-semibold text-ink">
            Herramienta interna para generar fichas de prueba
          </p>
        </div>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-ember">
          OpenAI conectado
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-ink">
          Crear una ficha con IA
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-700">
          Escribe un titulo. Puedes generar directamente, usar una coincidencia
          local o buscar primero en TMDb para desambiguar mejor peliculas y
          series.
        </p>

        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={handleGenerate}
        >
          <label className="sr-only" htmlFor="generated-title">
            Titulo de la obra
          </label>
          <input
            className="min-h-12 flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-4 text-base text-ink outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
            id="generated-title"
            onChange={(event) => {
              setTitle(event.target.value);
              setMatchingContents([]);
              setSelectedSlug("");
              setTmdbResults([]);
              setSelectedTmdbId(null);
              setTmdbMessage("");
              setSaveMessage("");
            }}
            placeholder="Ejemplo: Matrix"
            type="text"
            value={title}
          />
          <button
            className="min-h-12 rounded-lg border border-zinc-300 bg-white px-6 text-base font-semibold text-zinc-800 transition hover:border-ember hover:text-ember focus:outline-none focus:ring-4 focus:ring-ember/25 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
            disabled={isSearchingTmdb || isGenerating}
            onClick={() => void handleSearchTmdb()}
            type="button"
          >
            {isSearchingTmdb ? "Buscando..." : "Buscar en TMDb"}
          </button>
          <button
            className="min-h-12 rounded-lg bg-ink px-6 text-base font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25 disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={isGenerating || isSearchingTmdb}
            type="submit"
          >
            {isGenerating ? "Generando..." : "Generar"}
          </button>
        </form>

        <p className="mt-5 rounded-lg bg-zinc-50 px-4 py-3 text-sm font-semibold leading-6 text-zinc-700">
          Cada generacion consume API y debe usarse solo para pruebas internas.
        </p>
      </section>

      {matchingContents.length > 0 ? (
        <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Desambiguacion local
          </p>
          <h2 className="mt-3 text-2xl font-black text-ink">
            Se han encontrado opciones similares en Spoilering
          </h2>
          <p className="mt-3 leading-7 text-zinc-700">
            Elige la opcion correcta antes de generar la ficha.
          </p>

          <div className="mt-6 space-y-3">
            {matchingContents.map((content) => (
              <label
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition hover:border-ember"
                key={content.slug ?? content.title}
              >
                <input
                  checked={selectedSlug === content.slug}
                  className="mt-1"
                  name="matching-content"
                  onChange={() => setSelectedSlug(content.slug ?? "")}
                  type="radio"
                  value={content.slug}
                />
                <div>
                  <p className="font-semibold text-ink">{content.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {getContentTypeLabel(content.type)} · {content.year} ·{" "}
                    {content.slug}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6">
            <button
              className="min-h-12 rounded-lg bg-ink px-6 text-base font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25 disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={!selectedOption || isGenerating}
              onClick={() =>
                selectedOption ? void generateContentRequest(selectedOption) : null
              }
              type="button"
            >
              {isGenerating ? "Generando..." : "Generar ficha para esta opcion"}
            </button>
          </div>
        </section>
      ) : null}

      {tmdbResults.length > 0 ? (
        <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            TMDb
          </p>
          <h2 className="mt-3 text-2xl font-black text-ink">
            Resultados reales encontrados
          </h2>
          <p className="mt-3 leading-7 text-zinc-700">
            Selecciona una pelicula o serie y usaremos esos datos como base para
            la generacion con IA.
          </p>

          <div className="mt-6 space-y-4">
            {tmdbResults.map((result) => (
              <label
                className="flex cursor-pointer gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition hover:border-ember"
                key={result.id}
              >
                <input
                  checked={selectedTmdbId === result.id}
                  className="mt-1"
                  name="tmdb-result"
                  onChange={() => setSelectedTmdbId(result.id)}
                  type="radio"
                  value={result.id}
                />
                {result.posterUrl ? (
                  <Image
                    alt={`Poster de ${result.title}`}
                    className="h-24 w-16 rounded object-cover"
                    height={96}
                    src={result.posterUrl}
                    unoptimized
                    width={64}
                  />
                ) : (
                  <div className="flex h-24 w-16 items-center justify-center rounded bg-zinc-200 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    Sin poster
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{result.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {getContentTypeLabel(result.type)} · {result.year}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6">
            <button
              className="min-h-12 rounded-lg bg-ink px-6 text-base font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25 disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={!selectedTmdbOption || isGenerating}
              onClick={() =>
                selectedTmdbOption
                  ? void generateContentRequest(
                      createTmdbReference(selectedTmdbOption),
                    )
                  : null
              }
              type="button"
            >
              {isGenerating
                ? "Generando..."
                : "Generar ficha para este resultado"}
            </button>
          </div>
        </section>
      ) : null}

      {tmdbMessage ? (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white px-5 py-4 text-zinc-700 shadow-sm">
          <p className="font-semibold text-ink">Busqueda en TMDb</p>
          <p className="mt-2 text-sm leading-6">{tmdbMessage}</p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          <p className="font-bold">No se pudo completar la accion</p>
          <p className="mt-2 text-sm leading-6">{error}</p>
        </div>
      ) : null}

      {editableContent ? (
        <div className="mt-10 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="border-b border-zinc-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
              Revision manual
            </p>
            <h2 className="mt-3 text-3xl font-black text-ink">
              Editar ficha generada
            </h2>
            <p className="mt-3 leading-7 text-zinc-700">
              Revisa y corrige el contenido antes de guardarlo. Puedes dejar la
              ficha como borrador o publicarla directamente.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Titulo</span>
              <input
                className="min-h-11 rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-base outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
                onChange={(event) =>
                  updateEditableContent("title", event.target.value)
                }
                value={editableContent.title}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Tipo</span>
              <select
                className="min-h-11 rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-base outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
                onChange={(event) =>
                  updateEditableContent(
                    "type",
                    event.target.value as ContentType,
                  )
                }
                value={editableContent.type}
              >
                <option value="libro">Libro</option>
                <option value="serie">Serie</option>
                <option value="pelicula">Pelicula</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-semibold text-ink">Ano</span>
              <input
                className="min-h-11 rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-base outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
                onChange={(event) =>
                  updateEditableContent("year", event.target.value)
                }
                value={editableContent.year}
              />
            </label>
          </div>

          <div className="mt-6 space-y-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Resumen corto</span>
              <textarea
                className="min-h-28 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-3 text-base leading-7 outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
                onChange={(event) =>
                  updateEditableContent("shortSummary", event.target.value)
                }
                value={editableContent.shortSummary}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Inicio</span>
              <textarea
                className="min-h-36 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-3 text-base leading-7 outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
                onChange={(event) =>
                  updateEditableContent("start", event.target.value)
                }
                value={editableContent.start}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Desarrollo</span>
              <textarea
                className="min-h-36 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-3 text-base leading-7 outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
                onChange={(event) =>
                  updateEditableContent("development", event.target.value)
                }
                value={editableContent.development}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Final</span>
              <textarea
                className="min-h-36 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-3 text-base leading-7 outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
                onChange={(event) =>
                  updateEditableContent("ending", event.target.value)
                }
                value={editableContent.ending}
              />
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="min-h-12 rounded-lg border border-zinc-300 bg-white px-6 text-base font-semibold text-zinc-800 transition hover:border-ember hover:text-ember focus:outline-none focus:ring-4 focus:ring-ember/25 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
              disabled={isSaving}
              onClick={() => void saveWithStatus("draft")}
              type="button"
            >
              {isSaving ? "Guardando..." : "Guardar como borrador"}
            </button>
            <button
              className="min-h-12 rounded-lg bg-ink px-6 text-base font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25 disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={isSaving}
              onClick={() => void saveWithStatus("published")}
              type="button"
            >
              {isSaving ? "Guardando..." : "Publicar"}
            </button>
            {saveMessage ? (
              <p className="rounded-lg bg-moss/10 px-4 py-3 text-sm font-semibold text-moss">
                {saveMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
