import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  robots: { index: false },
}

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-black tracking-tight text-ink">Política de privacidad</h1>
      <p className="mb-10 text-sm text-ink/40">Última actualización: abril de 2026</p>

      <section className="space-y-8 text-sm leading-relaxed text-ink/70">

        <div>
          <h2 className="mb-2 text-base font-black text-ink">1. Responsable del tratamiento</h2>
          <p>
            <strong className="text-ink">[NOMBRE COMPLETO]</strong>, titular del sitio web{' '}
            <strong className="text-ink">www.spoilering.com</strong>.
          </p>
          <p className="mt-2">
            Contacto para cuestiones de privacidad: <strong className="text-ink">[EMAIL DE CONTACTO]</strong>
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">2. Datos que se recogen</h2>
          <p>Al crear una cuenta en Spoilering se recogen los siguientes datos:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong className="text-ink">Dirección de correo electrónico</strong> — necesaria para la autenticación y el envío del email de confirmación de cuenta.</li>
            <li><strong className="text-ink">Nombre de usuario</strong> — elegido por el usuario durante el registro, visible en su perfil público.</li>
          </ul>
          <p className="mt-2">
            No se recogen datos de navegación, dirección IP con carácter identificativo ni ningún otro dato personal más
            allá de los indicados.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">3. Finalidad del tratamiento</h2>
          <p>Los datos recogidos se utilizan exclusivamente para:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Gestionar el acceso a la cuenta de usuario (autenticación).</li>
            <li>Identificar al usuario en las contribuciones que realice en la plataforma.</li>
            <li>Enviar el correo de confirmación de cuenta y, en su caso, de recuperación de contraseña.</li>
          </ul>
          <p className="mt-2">No se utilizan los datos para enviar comunicaciones comerciales ni boletines.</p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">4. Cesión de datos a terceros</h2>
          <p>
            Los datos no se ceden ni venden a terceros con fines comerciales. No obstante, para el funcionamiento
            técnico de la plataforma se utilizan los siguientes proveedores de confianza:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-ink">Supabase</strong> (supabase.com) — proveedor de base de datos y
              autenticación. Los datos se almacenan en servidores de Supabase (región EU West).
            </li>
            <li>
              <strong className="text-ink">Vercel</strong> (vercel.com) — proveedor de alojamiento y despliegue de la
              aplicación web.
            </li>
          </ul>
          <p className="mt-2">
            Ambos proveedores cuentan con sus propias políticas de privacidad y medidas de seguridad adecuadas.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">5. Plazo de conservación</h2>
          <p>
            Los datos se conservan mientras la cuenta permanezca activa. Si el usuario solicita la eliminación de su
            cuenta, los datos personales (email y nombre de usuario) se borrarán de los sistemas en un plazo razonable.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">6. Derechos del usuario</h2>
          <p>El usuario puede ejercer en cualquier momento los siguientes derechos:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong className="text-ink">Acceso</strong> — conocer qué datos se tienen sobre él.</li>
            <li><strong className="text-ink">Rectificación</strong> — corregir datos incorrectos.</li>
            <li><strong className="text-ink">Supresión</strong> — solicitar la eliminación de su cuenta y datos asociados.</li>
          </ul>
          <p className="mt-2">
            Para ejercer estos derechos, el usuario puede contactar en:{' '}
            <strong className="text-ink">[EMAIL DE CONTACTO]</strong>
          </p>
          <p className="mt-2">
            También puede eliminar su cuenta directamente desde la sección de perfil de la plataforma, en cuanto
            dicha funcionalidad esté disponible.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">7. Seguridad</h2>
          <p>
            Las contraseñas se almacenan de forma cifrada y nunca en texto plano. La comunicación entre el navegador y
            los servidores se realiza siempre mediante HTTPS.
          </p>
        </div>

      </section>
    </div>
  )
}
