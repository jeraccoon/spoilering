import Link from "next/link";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/#proximas-fichas", label: "Fichas" },
];

export function Header() {
  return (
    <header className="border-b border-zinc-200 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link className="text-xl font-black tracking-tight text-ink" href="/">
          Spoilering
        </Link>
        <nav aria-label="Navegación principal" className="hidden items-center gap-5 sm:flex">
          {navItems.map((item) => (
            <Link
              className="text-sm font-semibold text-zinc-700 transition hover:text-ember"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
