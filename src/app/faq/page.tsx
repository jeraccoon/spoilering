'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Question {
  q: string
  a: string
}

interface Section {
  title: string
  questions: Question[]
}

const SECTIONS: Section[] = [
  {
    title: 'Sobre Spoilering',
    questions: [
      {
        q: '¿Qué es Spoilering?',
        a: 'Spoilering es una biblioteca colaborativa de resúmenes completos con spoilers de series, películas y libros. Está pensada para cuando vuelves a algo después de un tiempo y necesitas recordar qué pasaba antes de continuar. No encontrarás valoraciones ni críticas — solo los hechos de la historia.',
      },
      {
        q: '¿Es gratis?',
        a: 'Sí, Spoilering es completamente gratuito. Crear una cuenta no tiene ningún coste.',
      },
      {
        q: '¿Necesito registrarme para leer las fichas?',
        a: 'No. Puedes leer todas las fichas publicadas sin necesidad de crear una cuenta. El registro solo es necesario si quieres contribuir creando o corrigiendo fichas.',
      },
    ],
  },
  {
    title: 'Las fichas',
    questions: [
      {
        q: '¿Qué es una ficha?',
        a: 'Una ficha es el resumen completo de una obra. Está dividida en secciones: Inicio, Nudo, Desenlace y Subtramas. Cada sección cubre una parte de la historia con todos los detalles y spoilers importantes.',
      },
      {
        q: '¿Las fichas tienen spoilers?',
        a: 'Sí, todas las fichas contienen spoilers completos. Esa es precisamente su utilidad: poder refrescar la memoria sin tener que volver a ver o leer la obra entera. Te avisamos antes de mostrar el contenido para que puedas decidir.',
      },
      {
        q: '¿Quién escribe las fichas?',
        a: 'Las fichas las escribe la comunidad. Cualquier usuario registrado puede crear una ficha nueva o proponer correcciones a las existentes. También usamos inteligencia artificial como punto de partida, pero el contenido siempre es revisado y mejorado por personas.',
      },
      {
        q: '¿Puedo confiar en que la información es correcta?',
        a: 'Hacemos todo lo posible para que el contenido sea preciso, pero al ser una web colaborativa pueden existir errores. Si encuentras algo incorrecto, puedes sugerir una corrección directamente desde la ficha.',
      },
    ],
  },
  {
    title: 'Contribuir',
    questions: [
      {
        q: '¿Cómo puedo añadir una ficha?',
        a: 'Crea una cuenta gratuita, inicia sesión y usa el botón "+ Añadir obra" que aparece en la barra superior. Puedes buscar la obra en nuestra base de datos o introducir los datos manualmente. Los nuevos usuarios pueden crear hasta 3 fichas, que quedan pendientes de revisión antes de publicarse.',
      },
      {
        q: '¿Cómo puedo corregir un error en una ficha?',
        a: 'En cada sección de la ficha encontrarás un botón "Sugerir corrección". Escribe cómo debería quedar el texto y lo revisaremos. No necesitas ser el autor original de la ficha para sugerir cambios.',
      },
      {
        q: '¿Qué pasa con mis fichas tras enviarlas?',
        a: 'Las fichas nuevas de usuarios registrados quedan en estado "Pendiente de revisión" hasta que un editor o administrador las aprueba. Puedes ver el estado de tus fichas en tu perfil.',
      },
    ],
  },
  {
    title: 'Cuenta',
    questions: [
      {
        q: '¿Cómo cambio mi contraseña?',
        a: 'Ve a tu perfil (enlace en la barra superior) y en la sección "Mi cuenta" encontrarás la opción de cambiar tu contraseña.',
      },
      {
        q: '¿Puedo eliminar mi cuenta?',
        a: 'Sí. En tu perfil, sección "Mi cuenta", encontrarás la opción de eliminar tu cuenta. Esta acción es irreversible y eliminará todos tus datos.',
      },
      {
        q: '¿Qué hacéis con mis datos?',
        a: 'Solo guardamos tu email y nombre de usuario para gestionar tu cuenta. No vendemos ni cedemos tus datos a terceros. Puedes consultar nuestra política de privacidad para más detalles.',
      },
    ],
  },
]

function AccordionItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-ink/10 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-0 py-4 text-left"
      >
        <span className="font-semibold text-ink">{q}</span>
        <span
          className={`flex-shrink-0 text-ink/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-sm leading-relaxed text-ink/70">{a}</p>
      </div>
    </div>
  )
}

export default function FaqPage() {
  const [openKey, setOpenKey] = useState<string | null>(null)

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Cabecera */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black tracking-tight text-ink">Preguntas frecuentes</h1>
        <p className="mt-2 text-base text-ink/50">Todo lo que necesitas saber sobre Spoilering</p>
      </div>

      {/* Secciones */}
      <div className="flex flex-col gap-10">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink/40">
              {section.title}
            </h2>
            <div className="rounded-lg border border-ink/10 bg-paper px-5 shadow-sm">
              {section.questions.map((item) => {
                const key = `${section.title}::${item.q}`
                return (
                  <AccordionItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    isOpen={openKey === key}
                    onToggle={() => toggle(key)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Contacto */}
      <div className="mt-12 rounded-lg border border-ink/10 bg-ink/[0.02] px-6 py-5 text-center">
        <p className="text-sm text-ink/60">
          ¿Tienes más preguntas?{' '}
          <Link
            href="mailto:hola@spoilering.com"
            className="font-semibold text-ember hover:underline"
          >
            Escríbenos a hola@spoilering.com
          </Link>
        </p>
      </div>
    </div>
  )
}
