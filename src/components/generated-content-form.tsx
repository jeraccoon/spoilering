"use client";

import { FormEvent, useState } from "react";
import type { ContentType } from "@/data/contents";
import type { GeneratedContent } from "@/lib/generate-content";

type GenerateResponse = {
  content?: GeneratedContent;
  error?: string;
};

type SaveResponse = {
  content?: {
    slug: string;
    title: string;
  };
  error?: string;
};

type EditableContent = {
  title: string;
  type: ContentType;
  year: string;
  shortSummary: string;
  start: string;
  development: string;
  ending: string;
};

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
    shortSummary: content.shortSummary,
    start: getSectionText(content, "Inicio"),
    development: getSectionText(content, "Desarrollo"),
    ending: getSectionText(content, "Final"),
  };
}

export function GeneratedContentForm() {
  const [title, setTitle] = useState("");
  const [editableContent, setEditableContent] =
    useState<EditableContent | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEditableContent(null);
    setSaveMessage("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });
      const data = (await response.json()) as GenerateResponse;

      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "No se pudo generar la ficha.");
      }

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

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editableContent) {
      return;
    }

    setError("");
    setSaveMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/save-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editableContent),
      });
      const data = (await response.json()) as SaveResponse;

      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "No se pudo guardar la ficha.");
      }

      setSaveMessage(
        `Ficha guardada: "${data.content.title}". URL: /contenido/${data.content.slug}`,
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
          Escribe un título y Spoilering generará una ficha breve desde servidor.
          Después podrás editarla antes de guardarla.
        </p>

        <form className="mt-8 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="generated-title">
            Título de la obra
          </label>
          <input
            className="min-h-12 flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-4 text-base text-ink outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
            id="generated-title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ejemplo: Matrix"
            type="text"
            value={title}
          />
          <button
            className="min-h-12 rounded-lg bg-ink px-6 text-base font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25 disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={isGenerating}
            type="submit"
          >
            {isGenerating ? "Generando..." : "Generar"}
          </button>
        </form>

        <p className="mt-5 rounded-lg bg-zinc-50 px-4 py-3 text-sm font-semibold leading-6 text-zinc-700">
          Cada generación consume API y debe usarse solo para pruebas internas.
        </p>
      </section>

      {error ? (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          <p className="font-bold">No se pudo completar la acción</p>
          <p className="mt-2 text-sm leading-6">{error}</p>
        </div>
      ) : null}

      {editableContent ? (
        <form
          className="mt-10 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSave}
        >
          <div className="border-b border-zinc-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
              Revisión manual
            </p>
            <h2 className="mt-3 text-3xl font-black text-ink">
              Editar ficha generada
            </h2>
            <p className="mt-3 leading-7 text-zinc-700">
              Revisa y corrige el contenido antes de guardarlo. El guardado usa
              estos datos editados.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink">Título</span>
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
                <option value="pelicula">Película</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-semibold text-ink">Año</span>
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
              className="min-h-12 rounded-lg bg-ink px-6 text-base font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25 disabled:cursor-not-allowed disabled:bg-zinc-400"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Guardando..." : "Guardar ficha"}
            </button>
            {saveMessage ? (
              <p className="rounded-lg bg-moss/10 px-4 py-3 text-sm font-semibold text-moss">
                {saveMessage}
              </p>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
