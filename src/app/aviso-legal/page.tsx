import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso legal',
  robots: { index: false },
}

export default function AvisoLegalPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-black tracking-tight text-ink">Aviso legal</h1>
      <p className="mb-10 text-sm text-ink/40">Última actualización: abril de 2026</p>

      <section className="space-y-8 text-sm leading-relaxed text-ink/70">

        <div>
          <h2 className="mb-2 text-base font-black text-ink">1. Titular del sitio</h2>
          <p>
            El presente sitio web, accesible en <strong className="text-ink">www.spoilering.com</strong>, es un proyecto
            personal, en adelante «el titular».
          </p>
          <p className="mt-2">
            Contacto: <strong className="text-ink">spoilering@outlook.com</strong>
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">2. Descripción del servicio</h2>
          <p>
            Spoilering es una plataforma colaborativa de resúmenes con spoilers de series, películas y libros. Su
            finalidad es permitir a los usuarios refrescar la memoria sobre obras que ya han consumido, mediante fichas
            estructuradas con el argumento completo, incluyendo finales y giros argumentales.
          </p>
          <p className="mt-2">
            El contenido puede ser generado por inteligencia artificial y revisado o ampliado por los propios usuarios
            registrados.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">3. Propiedad intelectual</h2>
          <p>
            Los resúmenes publicados en Spoilering son elaboraciones propias que sintetizan el argumento de obras
            ajenas. No reproducen textos literales de las obras originales ni sustituyen el consumo de las mismas.
          </p>
          <p className="mt-2">
            Los derechos de las obras originales (películas, series, libros) corresponden a sus respectivos titulares.
            Spoilering no reclama ningún derecho sobre dichas obras.
          </p>
          <p className="mt-2">
            El código fuente, el diseño y la estructura de la plataforma son propiedad del titular. Los contenidos
            aportados por usuarios colaboradores se publican bajo su propia responsabilidad.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">4. Exención de responsabilidad</h2>
          <p>
            El titular no garantiza la exactitud, exhaustividad o actualidad de los contenidos publicados, ya sean
            generados por inteligencia artificial o aportados por usuarios. Los resúmenes pueden contener errores,
            omisiones o interpretaciones subjetivas.
          </p>
          <p className="mt-2">
            El titular no se hace responsable del uso que los usuarios hagan de la información publicada ni de los
            contenidos que estos aporten a la plataforma. Cada usuario es responsable de los textos que envíe o sugiera.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-base font-black text-ink">5. Legislación aplicable</h2>
          <p>
            Este aviso legal se rige por la legislación española. Para cualquier controversia derivada del uso del
            sitio, las partes se someten a los juzgados y tribunales del domicilio del titular, salvo que la normativa
            aplicable establezca otro fuero.
          </p>
        </div>

      </section>
    </div>
  )
}
