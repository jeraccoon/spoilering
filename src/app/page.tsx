import { ContentSearch } from "@/components/content-search";
import { contents } from "@/data/contents";

const contentList = Array.isArray(contents) ? contents : [];
const categories = ["Libros", "Series", "Películas"];

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

      <ContentSearch contents={contentList} />

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
    </div>
  );
}
