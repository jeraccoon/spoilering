import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de cookies',
  robots: { index: false },
}

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-black tracking-tight text-ink">Política de cookies</h1>
      <p className="mb-10 text-sm text-ink/40">Última actualización: abril de 2026</p>

      <section className="space-y-8 text-sm leading-relaxed text-ink/70">

        <div>
          <h2 className="mb-2 text-base font-black text-ink">1. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que un sitio web almacena en el navegador del usuario. Permiten
            que el sitio recuerde información entre visitas, como si el usuario ha iniciado sesión.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">2. Cookies que utiliza Spoilering</h2>
          <p>
            Spoilering utiliza exclusivamente <strong className="text-ink">cookies técnicas estrictamente necesarias</strong> para el
            funcionamiento de la sesión de usuario. Estas cookies son establecidas por Supabase (proveedor de
            autenticación) y son imprescindibles para mantener la sesión iniciada mientras se navega por la plataforma.
          </p>
          <p className="mt-2">
            No se utilizan cookies de seguimiento, analítica, publicidad comportamental ni redes sociales.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">3. Detalle de las cookies técnicas</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-ink/10">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink/10 bg-ink/5">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-ink">Nombre</th>
                  <th className="px-4 py-2.5 font-semibold text-ink">Proveedor</th>
                  <th className="px-4 py-2.5 font-semibold text-ink">Finalidad</th>
                  <th className="px-4 py-2.5 font-semibold text-ink">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                <tr>
                  <td className="px-4 py-2.5 font-mono text-ink/60">sb-*-auth-token</td>
                  <td className="px-4 py-2.5">Supabase</td>
                  <td className="px-4 py-2.5">Mantener la sesión de usuario autenticado</td>
                  <td className="px-4 py-2.5">Sesión / 1 semana</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">4. ¿Se necesita un banner de cookies?</h2>
          <p>
            De acuerdo con la normativa española y europea (LSSI y ePrivacy), las cookies técnicas necesarias para el
            funcionamiento del servicio están exentas del requisito de consentimiento. Por este motivo, Spoilering no
            muestra un banner de cookies: no existe ninguna cookie que requiera tu autorización previa.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">5. Cómo desactivar o eliminar las cookies</h2>
          <p>
            Puedes eliminar o bloquear las cookies desde la configuración de tu navegador. Ten en cuenta que si
            eliminas las cookies de sesión, tendrás que volver a iniciar sesión en la plataforma.
          </p>
          <p className="mt-2">
            Instrucciones para los navegadores más comunes:{' '}
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-ember underline underline-offset-2 hover:text-ember/80">Chrome</a>
            {' · '}
            <a href="https://support.mozilla.org/es/kb/Borrar%20cookies" target="_blank" rel="noopener noreferrer" className="text-ember underline underline-offset-2 hover:text-ember/80">Firefox</a>
            {' · '}
            <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-ember underline underline-offset-2 hover:text-ember/80">Safari</a>
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">6. Cambios en esta política</h2>
          <p>
            Si en el futuro se añaden nuevas cookies (por ejemplo, de analítica), esta política se actualizará y, si
            fuera necesario, se solicitará el consentimiento correspondiente.
          </p>
        </div>

      </section>
    </div>
  )
}
