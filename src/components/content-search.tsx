"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getContentTypeLabel,
  type SpoileringContent,
} from "@/data/contents";

type ContentSearchProps = {
  contents: SpoileringContent[];
};

export function ContentSearch({ contents }: ContentSearchProps) {
  const [query, setQuery] = useState("");

  const filteredContents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return contents;
    }

    return contents.filter((content) =>
      content.title.toLowerCase().includes(normalizedQuery),
    );
  }, [contents, query]);

  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-12" id="buscar">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Búsqueda
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">
            Encuentra una historia y ve directo al spoiler.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-zinc-700">
            Filtra las fichas por título y abre el resumen completo con spoilers.
          </p>
        </div>

        <div className="mx-auto mt-8 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
          <label className="sr-only" htmlFor="search">
            Buscar una obra
          </label>
          <input
            id="search"
            name="search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca Harry Potter, Breaking Bad, El club de la lucha..."
            type="search"
            value={query}
            className="min-h-12 w-full rounded-lg border border-transparent bg-zinc-50 px-4 text-base text-ink outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14" id="recientes">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Contenidos recientes
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">
            Fichas listas para leer con todos los spoilers
          </h2>
        </div>

        {filteredContents.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-3">
            {filteredContents.map((content) => (
              <article
                className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                key={content.slug}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-moss">
                    {getContentTypeLabel(content.type)}
                  </p>
                  <p className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                    {content.year}
                  </p>
                </div>
                <h3 className="mt-4 text-xl font-bold text-ink">{content.title}</h3>
                <p className="mt-3 leading-7 text-zinc-700">
                  {content.shortSummary}
                </p>
                <Link
                  className="mt-5 inline-flex font-semibold text-ember transition hover:text-ink"
                  href={`/contenido/${content.slug}`}
                >
                  Leer ficha
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-ink">
              No se encontraron resultados
            </p>
            <p className="mt-2 text-zinc-600">
              Prueba con otro título o borra la búsqueda.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
