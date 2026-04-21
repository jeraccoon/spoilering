import Link from "next/link";
import {
  contents,
  getContentStatus,
  getContentTypeLabel,
  type SpoileringContent,
} from "@/data/contents";

function ContentGroup({
  contentsList,
  description,
  title,
}: {
  contentsList: SpoileringContent[];
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="border-b border-zinc-200 pb-5">
        <h2 className="text-2xl font-black text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
      </div>

      {contentsList.length > 0 ? (
        <div className="mt-6 space-y-4">
          {contentsList.map((content) => {
            const status = getContentStatus(content);

            return (
              <article
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-5"
                key={content.slug}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-ink">{content.title}</h3>
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
                          status === "draft"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-moss/10 text-moss"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600">
                      <div>
                        <dt className="font-semibold text-zinc-800">Tipo</dt>
                        <dd>{getContentTypeLabel(content.type)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-zinc-800">Año</dt>
                        <dd>{content.year}</dd>
                      </div>
                      <div className="min-w-full">
                        <dt className="font-semibold text-zinc-800">Slug</dt>
                        <dd className="break-all">{content.slug}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-3">
                    <Link
                      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-ember hover:text-ember"
                      href={`/admin/contenidos/${content.slug}`}
                    >
                      Editar
                    </Link>
                    {status === "published" ? (
                      <Link
                        className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember"
                        href={`/contenido/${content.slug}`}
                      >
                        Ver ficha pública
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
          No hay contenidos en este bloque todavía.
        </p>
      )}
    </section>
  );
}

export default function AdminContentsPage() {
  const draftContents = contents.filter(
    (content) => getContentStatus(content) === "draft",
  );
  const publishedContents = contents.filter(
    (content) => getContentStatus(content) === "published",
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
          Admin
        </p>
        <h1 className="mt-3 text-4xl font-black text-ink">Contenidos</h1>
        <p className="mt-4 max-w-3xl leading-7 text-zinc-700">
          Gestiona las fichas existentes y revisa rápidamente qué está en
          borrador y qué ya está publicado.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Borradores
            </p>
            <p className="mt-2 text-3xl font-black text-ink">
              {draftContents.length}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Publicados
            </p>
            <p className="mt-2 text-3xl font-black text-ink">
              {publishedContents.length}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-8">
        <ContentGroup
          contentsList={draftContents}
          description="Fichas pendientes de revisión o todavía no visibles en la web pública."
          title="Borradores"
        />
        <ContentGroup
          contentsList={publishedContents}
          description="Fichas ya visibles en la home, en el buscador y en sus URLs públicas."
          title="Publicados"
        />
      </div>
    </div>
  );
}
