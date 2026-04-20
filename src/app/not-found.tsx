import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
        Error 404
      </p>
      <h1 className="mt-4 text-4xl font-bold text-ink">Esta historia no está en el archivo.</h1>
      <p className="mt-4 text-lg leading-8 text-zinc-700">
        Puede que la ficha todavía no exista o que el enlace haya cambiado.
      </p>
      <Link
        className="mt-8 rounded-lg bg-ink px-5 py-3 font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25"
        href="/"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
