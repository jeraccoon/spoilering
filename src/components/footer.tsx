import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-6 sm:flex-row sm:justify-between">
        <p className="text-xs text-paper/40">© 2026 Spoilering</p>
        <nav className="flex gap-4 text-xs text-paper/40">
          <Link href="/faq" className="transition hover:text-paper/70">FAQ</Link>
          <Link href="/aviso-legal" className="transition hover:text-paper/70">Aviso legal</Link>
          <Link href="/privacidad" className="transition hover:text-paper/70">Privacidad</Link>
          <Link href="/cookies" className="transition hover:text-paper/70">Cookies</Link>
        </nav>
      </div>
    </footer>
  )
}
