const featuredWorks = [
  {
    title: "Dune",
    type: "Libro y película",
    summary:
      "La caída de una casa noble, el ascenso de Paul Atreides y el peso terrible de convertirse en mesías.",
  },
  {
    title: "Breaking Bad",
    type: "Serie",
    summary:
      "Walter White transforma una emergencia familiar en una cadena de decisiones cada vez más oscuras.",
  },
  {
    title: "El club de la lucha",
    type: "Película",
    summary:
      "Una crisis de identidad se convierte en un movimiento violento con una verdad final imposible de ignorar.",
  },
];

const categories = ["Libros", "Series", "Películas"];

export default function Home() {
  return (
    <div>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Resúmenes con spoilers
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Entiende cualquier historia sin tener que tragarte todo el viaje.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-700">
            Spoilering reúne resúmenes claros de libros, series y películas:
            qué pasa, quién importa y cómo termina.
          </p>

          <form className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="search">
              Buscar una obra
            </label>
            <input
              id="search"
              name="search"
              type="search"
              placeholder="Busca Dune, Dark, El padrino..."
              className="min-h-12 flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-base text-ink outline-none transition focus:border-ember focus:ring-4 focus:ring-ember/15"
            />
            <button
              type="submit"
              className="min-h-12 rounded-lg bg-ink px-6 text-base font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25"
            >
              Buscar
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="bg-ink px-5 py-4 text-sm font-semibold text-white">
            Ficha preparada para spoilers
          </div>
          <div className="space-y-5 p-5">
            <div>
              <p className="text-sm font-semibold text-ember">30 segundos</p>
              <p className="mt-1 text-zinc-700">
                La versión rápida para recordar la historia sin perderte.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-moss">Historia completa</p>
              <p className="mt-1 text-zinc-700">
                Los giros principales ordenados de forma fácil de leer.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-plum">Final explicado</p>
              <p className="mt-1 text-zinc-700">
                Qué significa el desenlace y por qué cambia la historia.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white/70" id="categorias">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-ink">Empieza por categoría</h2>
          <div className="flex flex-wrap gap-3">
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

      <section className="mx-auto max-w-6xl px-6 py-14" id="proximas-fichas">
        <div className="mb-7 flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            Próximas fichas
          </p>
          <h2 className="text-3xl font-bold text-ink">Historias listas para destripar</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {featuredWorks.map((work) => (
            <article
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
              key={work.title}
            >
              <p className="text-sm font-semibold text-moss">{work.type}</p>
              <h3 className="mt-3 text-xl font-bold text-ink">{work.title}</h3>
              <p className="mt-3 leading-7 text-zinc-700">{work.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
