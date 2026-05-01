import Link from 'next/link'
import { ContactModal } from '@/components/contact-modal'

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-paper">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Fila superior: marca + tagline + CTA */}
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="max-w-md">
            <p className="font-serif text-lg font-black tracking-tight">Spoilering</p>
            <p className="mt-1.5 text-sm leading-relaxed text-paper/70">
              No es un agregador de reseñas ni un sustituto de la obra.
              Es un archivo de resúmenes escrito por la comunidad.
            </p>
          </div>
          <Link
            href="/registro"
            className="shrink-0 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember/90"
          >
            Únete
          </Link>
        </div>

        {/* Fila inferior: enlaces legales + copyright */}
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-paper/10 pt-5 text-xs text-paper/55 sm:justify-between">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link href="/faq" className="transition hover:text-paper">FAQ</Link>
            <ContactModal />
            <Link href="/aviso-legal" className="transition hover:text-paper">Aviso legal</Link>
            <Link href="/privacidad" className="transition hover:text-paper">Privacidad</Link>
            <Link href="/cookies" className="transition hover:text-paper">Cookies</Link>
          </div>
          <p className="text-paper/45">© 2026 Spoilering</p>
        </nav>
      </div>
    </footer>
  )
}
