import Link from "next/link";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/#buscar", label: "Buscar" },
  { href: "/#recientes", label: "Recientes" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link className="flex items-center gap-3 font-black tracking-tight text-ink" href="/">
          <span className="flex size-9 items-center justify-center rounded-lg bg-ink text-sm text-white">
            S
          </span>
          <span className="text-xl">Spoilering</span>
        </Link>
        <nav aria-label="Navegación principal" className="hidden items-center gap-6 sm:flex">
          {navItems.map((item) => (
            <Link
              className="text-sm font-semibold text-zinc-700 transition hover:text-ember"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25"
            href="/#recientes"
          >
            Explorar
          </Link>
        </nav>
      </div>
    </header>
  );
}
