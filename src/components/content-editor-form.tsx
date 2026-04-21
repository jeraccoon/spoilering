"use client";

import { useState } from "react";
import type { ContentStatus, ContentType } from "@/data/contents";
import type { EditableContentPayload } from "@/lib/save-content";

type SaveResponse = {
  content?: {
    slug: string;
    status?: ContentStatus;
    title: string;
  };
  error?: string;
};

type ContentEditorFormProps = {
  initialContent: EditableContentPayload;
  saveUrl: string;
};

export function ContentEditorForm({
  initialContent,
  saveUrl,
}: ContentEditorFormProps) {
  const [editableContent, setEditableContent] =
    useState<EditableContentPayload>(initialContent);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  function updateEditableContent<K extends keyof EditableContentPayload>(
    field: K,
    value: EditableContentPayload[K],
  ) {
    setEditableContent((currentContent) => ({
      ...currentContent,
      [field]: value,
    }));
    setSaveMessage("");
  }

  async function handleSave() {
    setError("");
    setSaveMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(saveUrl, {
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

      const savedStatus = data.content.status ?? editableContent.status;
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

  return (
    <>
      {error ? (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          <p className="font-bold">No se pudo completar la acción</p>
          <p className="mt-2 text-sm leading-6">{error}</p>
        </div>
      ) : null}

      <div className="mt-10 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="border-b border-zinc-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Revisión manual
          </p>
          <h2 className="mt-3 text-3xl font-black text-ink">Editar ficha</h2>
          <p className="mt-3 leading-7 text-zinc-700">
            Revisa y corrige el contenido antes de guardarlo.
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
                updateEditableContent("type", event.target.value as ContentType)
              }
              value={editableContent.type}
            >
              <option value="libro">Libro</option>
              <option value="serie">Serie</option>
              <option value="pelicula">Película</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-ink">Año</span>
            <input
              className="min-h-11 rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-base outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
              onChange={(event) =>
                updateEditableContent("year", event.target.value)
              }
              value={editableContent.year}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-ink">Status</span>
            <select
              className="min-h-11 rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-base outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
              onChange={(event) =>
                updateEditableContent(
                  "status",
                  event.target.value as ContentStatus,
                )
              }
              value={editableContent.status}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
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
            onClick={() => void handleSave()}
            type="button"
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
          {saveMessage ? (
            <p className="rounded-lg bg-moss/10 px-4 py-3 text-sm font-semibold text-moss">
              {saveMessage}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
