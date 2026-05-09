"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
        Algo ha fallado
      </p>
      <h1 className="mt-4 text-4xl font-bold text-ink">
        No se ha podido cargar esta página.
      </h1>
      <p className="mt-4 text-lg leading-8 text-zinc-700">
        Prueba a recargar. Si vuelve a pasar, revisaremos el error con calma.
      </p>
      <button
        className="mt-8 rounded-lg bg-ink px-5 py-3 font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25"
        onClick={reset}
        type="button"
      >
        Intentar de nuevo
      </button>
    </section>
  );
}
