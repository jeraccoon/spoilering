import Link from "next/link";
import { contents } from "@/data/contents";

const categories = ["Libros", "Series", "Películas"];
const recentWorks = contents.slice(0, 4);

export default function Home() {
  return (
    <div className="pb-16">
      <section
        className="relative overflow-hidden border-b border-zinc-200 bg-ink"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(24,24,27,0.88), rgba(24,24,27,0.58)), url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=80')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto flex min-h-[520px] max-w-6xl flex-col justify-center px-6 py-16 text-white">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
            Finales explicados y resúmenes directos
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-tight sm:text-6xl">
            Spoilering
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-zinc-100">
            Resúmenes con spoilers para recordar lo que ya has visto o leído
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-ember px-6 text-base font-semibold text-white transition hover:bg-white hover:text-ink focus:outline-none focus:ring-4 focus:ring-white/30"
              href="#recientes"
            >
              Explorar
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/55 px-6 text-base font-semibold text-white transition hover:border-white hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/25"
              href="#buscar"
            >
              Buscar una obra
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12" id="buscar">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Búsqueda
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">
            Encuentra una historia y ve directo al spoiler.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-zinc-700">
            El buscador todavía es visual, pero esta será la entrada principal
            para localizar libros, series y películas.
          </p>
        </div>

        <form className="mx-auto mt-8 flex w-full flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row">
          <label className="sr-only" htmlFor="search">
            Buscar una obra
          </label>
          <input
            id="search"
            name="search"
            type="search"
            placeholder="Busca Harry Potter, Dune, Dark, El padrino..."
            className="min-h-12 flex-1 rounded-lg border border-transparent bg-zinc-50 px-4 text-base text-ink outline-none transition focus:border-ember focus:bg-white focus:ring-4 focus:ring-ember/15"
          />
          <button
            type="submit"
            className="min-h-12 rounded-lg bg-ink px-6 text-base font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25"
          >
            Buscar
          </button>
        </form>
      </section>

      <section className="border-y border-zinc-200 bg-white/75">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
              Categorías
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Elige qué quieres destripar</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <span
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"
                key={category}
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14" id="recientes">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Contenidos recientes
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink">
            Resúmenes listos para leer con todos los spoilers
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {recentWorks.map((work) => (
            <article
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              key={work.slug}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-moss">{work.type}</p>
                <p className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                  {work.readTime}
                </p>
              </div>
              <h3 className="mt-4 text-xl font-bold text-ink">{work.title}</h3>
              <p className="mt-3 leading-7 text-zinc-700">{work.description}</p>
              <Link
                className="mt-5 inline-flex font-semibold text-ember transition hover:text-ink"
                href={`/contenido/${work.slug}`}
              >
                Leer resumen
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
