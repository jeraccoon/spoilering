# Repaso completo de Spoilering — 1 de mayo 2026

> Revisión basada en la lectura completa del código de `src/app/`, `src/components/`, `tailwind.config.ts` y `globals.css`. La inspección visual en navegador no fue posible esta sesión por un fallo del puente Chrome, pero el código revela con claridad los problemas que mencionas (ficha destacada con texto descuadrado) y unos cuantos más.

---

## 1. La ficha destacada del hero (lo que ya viste mal)

**Componente:** `src/components/home-sections.tsx`, `FeaturedCard`.

El problema del texto que no se ajusta viene de tres líneas sumadas:

```tsx
<div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-8 md:p-10">
  ...
  <p className="line-clamp-2 max-w-lg text-sm leading-relaxed text-ink/55
                sm:line-clamp-3 sm:max-w-xl sm:text-base">
    {w.overview}
  </p>
```

Tres cosas chocan:

1. **`max-w-lg` / `sm:max-w-xl`** limitan el párrafo a 32rem/36rem, pero el contenedor es `flex-1` con `max-w-6xl` global, así que en desktop el título ocupa todo el ancho de la columna y la descripción se queda corta y descuadrada visualmente respecto al título y al CTA.
2. **`justify-center`** centra todos los hijos verticalmente. Cuando la sinopsis es corta queda flotando en medio sin alinearse con el borde inferior del póster.
3. **`line-clamp-2` sin fade** corta la sinopsis de golpe — no hay degradado ni "…leer más", da impresión de bug.

**Arreglo recomendado** (cambia esas tres líneas):

```tsx
<div className="flex flex-1 flex-col justify-between gap-4 p-6 sm:p-8 md:p-10">
  <div className="flex flex-col gap-3">
    {/* badge + año, título, original_title */}
    ...
    <p className="line-clamp-3 text-sm leading-relaxed text-ink/60
                  sm:line-clamp-4 sm:text-[15px]">
      {w.overview}
    </p>
  </div>
  {/* CTA "Leer ficha" anclado abajo */}
  <span className="...">Leer ficha</span>
</div>
```

Cambios clave: quitar `max-w-lg/xl`, `justify-center` → `justify-between`, separar el bloque de texto del CTA para que el CTA quede pegado a la base de la card y la sinopsis tenga el ancho real disponible. El `text-[15px]` da más respiración que `text-base` (16px) sin parecer pequeño.

**Bonus visual:** ahora mismo la card es `bg-ink/[0.025]` — muy plana. Probaría:

```tsx
className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10
           bg-gradient-to-br from-ember/[0.04] via-paper to-moss/[0.04]
           transition hover:border-ink/20 hover:shadow-xl sm:flex-row"
```

Le da un sutil tinte editorial sin romper la paleta.

---

## 2. Copy del home

Lo que tienes funciona pero juega a la defensiva. Algunas alternativas más punzantes:

| Actual | Sugerencia |
|---|---|
| **H1:** "El resumen que necesitabas" | "Lo viste. Lo olvidaste. Aquí está." · "Para cuando ya no recuerdas qué pasaba" · "Resúmenes con spoilers, sin rodeos" |
| **Subtítulo:** "Para cuando vuelves a algo y necesitas recordar qué pasaba. Spoilers incluidos." | "Refresca la trama de cualquier libro, serie o película antes de seguir leyendo, viendo o leyendo el siguiente." |
| **Característica 1:** "Todo contado, sin filtros" / "Giros, finales y revelaciones. Nada omitido." | "El final también" / "Giros, muertes, revelaciones. Todo lo que importa." |
| **Característica 2:** "Hecho por la comunidad" / "Cualquiera puede añadir fichas y corregir errores." | Bien. Quizá: "Lo escribimos entre todos" |
| **Característica 3:** "Hechos, no opiniones" / "Sin notas ni valoraciones. Tú decides si lo ves." | "Sin notas, sin reseñas" / "Aquí no hay 7,8/10. Solo lo que pasa en la historia." |
| **Botón hero:** "Explorar fichas" + "+ Añadir obra" | El primero podría ser **"Ver el catálogo"** (más coloquial). El secundario está bien. |
| **CTA card destacada:** "Leer ficha" | "Ver el resumen" o "Refrescar la memoria" — más alineado con la promesa. |
| **Beta banner:** "¡Cuéntanos, gracias! →" | El "gracias" antes del CTA chirría. Cámbialo a **"Cuéntanos →"** y mete el "gracias" en el modal de éxito. |

---

## 3. Inconsistencias de color entre componentes

Tienes **dos paletas distintas** para los badges de tipo según el componente:

| Componente | Película | Serie | Libro |
|---|---|---|---|
| `home-sections.tsx` (StripCard / FeaturedCard) | `bg-blue-600/90` | `bg-plum/90` ✓ | `bg-moss/90` ✓ |
| `home-cards.tsx` (parece huérfano, no se usa en home) | `bg-blue-600` | `bg-purple-600` ✗ | `bg-amber-600` ✗ |
| `buscar/page.tsx` | `bg-blue-600/90` | `bg-plum/90` ✓ | `bg-moss/90` ✓ |
| `NavSearch.tsx` | `bg-blue-600/90` | `bg-plum/90` ✓ | `bg-moss/90` ✓ |

Dos cosas:

1. `src/components/home-cards.tsx` parece **código muerto** o sin usar en producción (en `page.tsx` solo importas `HomeSections`). Búscalo con grep — si nadie lo usa, bórralo o reescríbelo para alinearlo.
2. **`bg-blue-600` no está en tu paleta.** Tu Tailwind tiene `ink/paper/ember/moss/plum` — la película se sale del sistema. Define un quinto color en `tailwind.config.ts`, p.ej. `tide: "#3a6fb0"` o reutiliza un tono más cálido. Algo como:

   ```ts
   colors: {
     ink: "#18181b",
     paper: "#fbfaf7",
     ember: "#d84f2a",
     moss: "#52715a",
     plum: "#6d4f72",
     tide: "#3a6fb0",  // o "indigo": "#4f46e5"
   }
   ```

   Luego sustituye todos los `bg-blue-600/90` → `bg-tide/90`.

---

## 4. Tipografía — el cambio más rentable visualmente

`tailwind.config.ts`:
```ts
fontFamily: { sans: ["Arial", "Helvetica", "sans-serif"] }
```

Arial deja la web con aspecto **bastante anónimo**, sobre todo en los titulares con `font-black`. Para una web de "resúmenes literarios" pegaría muchísimo una pareja editorial:

- **Headline serif + body sans:** *Fraunces* o *Newsreader* (Google Fonts) para H1/H2 y *Inter* para cuerpo. Es la combinación clásica de revistas digitales.
- **Solo sans pero con personalidad:** *Inter*, *Geist*, *Space Grotesk* o *Sohne* si tienes presupuesto.

Cómo aplicarlo (Next.js 15):

```tsx
// src/app/layout.tsx
import { Inter, Fraunces } from 'next/font/google'
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif' })
// luego en <body className={`${sans.variable} ${serif.variable} antialiased`}>
```

```ts
// tailwind.config.ts
fontFamily: {
  sans: ["var(--font-sans)", "system-ui", "sans-serif"],
  serif: ["var(--font-serif)", "Georgia", "serif"],
},
```

Y aplicas `font-serif` solo a los `<h1>` y al título de la `FeaturedCard`. Es el cambio que más eleva la marca de un día para otro.

---

## 5. Contraste y accesibilidad

Tienes **mucho** texto a opacidad muy baja:

| Clase | Uso | Problema |
|---|---|---|
| `text-ink/30` | Placeholders inputs, "no encontramos…" | WCAG AA: posiblemente fallo |
| `text-ink/25` | Iconos toggle vista, Toggle vista grid/list | Fallo casi seguro |
| `text-ink/40` | Títulos secciones strips ("Recién añadidas"), año, año en strip | Justo en el límite |
| `text-paper/40` | Footer entero | Difícil de leer sobre `bg-ink` |
| `text-ink/50` | Subtítulos hero, contadores | OK |

Recomendación: **subir un escalón todo lo que esté a `/30` y `/40`**:
- `/30 → /45`
- `/40 → /55`
- `text-paper/40` (footer) → `text-paper/60`

Visualmente apenas se nota pero gana muchísimo en lectura para cualquiera con ojos cansados.

---

## 6. Footer

`src/components/footer.tsx`:

```tsx
<footer className="border-t border-ink/10 bg-ink">
  <div className="... py-6">
    <p className="text-xs text-paper/40">© 2026 Spoilering</p>
    <nav className="... text-xs text-paper/40">
      ...
    </nav>
  </div>
</footer>
```

Tres mejoras pequeñas:

1. **Sube el contraste** del texto: `text-paper/60`.
2. **Falta personalidad.** Una web colaborativa debería invitar. Añade en una columna izquierda una frase tipo "Hecho con cariño por la comunidad. Únete." con link a `/registro`.
3. **Considera dos filas:** una con marca + tagline + CTA, otra con los enlaces legales más pequeños.

Versión compacta sugerida:

```tsx
<footer className="border-t border-ink/10 bg-ink">
  <div className="mx-auto max-w-5xl px-4 py-10 text-paper">
    <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <p className="text-sm font-bold">Spoilering</p>
        <p className="mt-1 text-xs text-paper/55">Resúmenes con spoilers, escritos por la comunidad.</p>
      </div>
      <Link href="/registro" className="rounded-lg bg-ember px-4 py-2 text-xs font-semibold transition hover:bg-ember/90">
        Únete
      </Link>
    </div>
    <nav className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-paper/10 pt-5 text-xs text-paper/55">
      <Link href="/faq">FAQ</Link>
      <ContactModal />
      <Link href="/aviso-legal">Aviso legal</Link>
      <Link href="/privacidad">Privacidad</Link>
      <Link href="/cookies">Cookies</Link>
      <span className="text-paper/35">© 2026</span>
    </nav>
  </div>
</footer>
```

---

## 7. Responsive móvil — puntos críticos

He revisado los breakpoints y los puntos de fricción reales en pantallas pequeñas (≤390px) son:

1. **Hero H1:** `text-4xl` (36px) en móvil con `tracking-tight` puede romper el subtítulo en líneas raras según el dispositivo. Pruébalo en iPhone SE (375px). Si rompe, usa `text-[28px] sm:text-4xl md:text-5xl`.
2. **NavSearch desplegable:** `w-80` fijo (320px) puede sobresalir cuando se abre desde la derecha en pantallas estrechas. Cámbialo a `w-[min(20rem,calc(100vw-2rem))]`.
3. **NavSearch "+ Añadir obra"** está oculto en móvil (`hidden sm:block`). En móvil el usuario logueado no tiene acceso rápido a crear ficha desde la barra superior. Mete el "+" en el `UserMenu` o como FAB flotante.
4. **Strip horizontal** (`-mx-4 ... px-4`) está bien planteado pero `pb-1` recorta sombras hover. Cambia a `pb-2` o `py-1`.
5. **Header dos banners apilados** (pendientes de revisión + mensajes sin leer): si los dos están activos y eres admin, ocupan ~80px arriba. En móvil con la status bar te comes media pantalla. Considera fusionarlos en un solo banner `plum` con dos contadores, o uno tipo dropdown.
6. **`text-justify` con hyphens en `<p>`** del contenido (`card-content.tsx`): en columnas estrechas puede dejar huecos enormes entre palabras. Limítalo: `sm:text-justify` ya lo tienes, **bien hecho**.
7. **Filtros en `home-cards.tsx`** son scroll horizontal pero no avisas con sombra/fade lateral. Añade un `mask-image: linear-gradient(...)` para indicar que hay más.

---

## 8. Hero — elementos visuales que suman mucho

Tu home actual: H1 + sub + 2 CTAs + 3 features + ficha destacada + strips. **Falta una capa de "credibilidad".** Sugerencias en orden de coste:

1. **Stat strip bajo el hero** (1 línea, muy barato):

   ```tsx
   <p className="mt-3 text-xs uppercase tracking-widest text-ink/40">
     {totalCount} fichas · {seriesCount} series · {moviesCount} películas · {booksCount} libros
   </p>
   ```

   Da sensación de tamaño y credibilidad. Hazlo discreto, no gritado.

2. **Mosaico de pósters detrás del hero** (medio coste): un `<div absolute>` con 8-10 pósters reales en grid difuminado al 15-20% de opacidad como fondo del hero. Es el truco clásico de IMDb/Letterboxd. Funciona muy bien.

3. **Sección "Cómo funciona" minimal** entre features y catálogo: 3 steps numerados en una línea. *Busca → Lee con calma → Sigue tu vida.*

4. **Last contributor** en el footer del hero: "Última ficha añadida: **Severance** por @marta hace 4h" — humaniza la web.

---

## 9. Página de ficha pública — pequeñas mejoras

`src/app/ficha/[slug]/page.tsx`:

- **Cabecera de obra:** el póster está `hidden sm:block` — en móvil **no se ve el póster nada**. Es una pena: pósteres venden. En móvil ponlo arriba a tamaño reducido (h-40 w-28) flotando junto al título.
- **Badge "⚠ Contiene spoilers"** está al final de la cabecera, casi escondido. Ponlo justo al lado del año o como banda fina superior. La advertencia luego se vuelve a mostrar en `SpoilerGate` así que no es crítica, pero refuerza la promesa de marca.
- **`SuggestBar`** dice solo "Sugerir corrección" pero al pulsarlo solo edita la **primera sección**, no toda la ficha. Es confuso. O lo nombras "Sugerir corrección a esta sección" o lo mueves debajo de cada acordeón (creo que ya tienes uno por sección abajo — confirma y elimina la `SuggestBar` global).
- **Acordeones cerrados todos por defecto excepto el primero:** OK, pero podrías tener un botón "Expandir todo" arriba.
- **Créditos abajo:** muy escondidos. Si la idea es valorar al colaborador, súbelos a la cabecera junto al título: *por @marta, contribuyen @juan y @luis*.

---

## 10. SpoilerGate — el momento de la verdad

`src/components/spoiler-gate.tsx` está bien planteado. Dos retoques:

- **Copy:**
  - "Mostrar de todas formas" → "**Sí, ya la he visto**" (o "Sí, mostrar")
  - "Volver al inicio" → "**No, llévame al inicio**"
  Le da personalidad y rima con el aviso.

- **Visual:** el blur 6px es suficiente, pero el `maxHeight: 32rem` corta de golpe. Añade un fade desde abajo para que no se vea el corte:

  ```tsx
  style={{
    filter: 'blur(8px)',
    maxHeight: '32rem',
    maskImage: 'linear-gradient(180deg, #000 60%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(180deg, #000 60%, transparent 100%)',
  }}
  ```

- **Storage:** usas `localStorage.getItem('spoiler-accepted:${slug}')` — un usuario "acepta spoilers" para una obra y eso queda **para siempre**. Bien para esa obra concreta. Considera un toggle global en perfil "Saltar advertencia de spoilers" para usuarios que quieran ahorrarse el clic siempre.

---

## 11. Códigos muertos y deuda técnica que vi

- `src/components/home-cards.tsx` parece sin usar en `/` (verifica con grep). Si está sin uso, bórralo. Si se usa en alguna ruta admin, alinea la paleta de tipos con el resto.
- En `home-sections.tsx`, `TYPE_BADGE` y `TYPE_LABELS` están duplicados también en `card-content.tsx`, `NavSearch`, `buscar/page.tsx`, `home-cards.tsx`. **Saca un `src/lib/work-types.ts`** con las constantes y reutilízalo.
- `src/components/note-widget.tsx` y `src/components/invite-widget.tsx` aparecen en el listado — confirma que se usan o limpia.

---

## 12. Ideas nuevas (priorizadas, las 5 más jugosas)

1. **Fila "Continuar leyendo"** en home para usuarios logueados: las últimas 3 fichas que han abierto pero no marcado como visto/leído. Aprovechas `user_content` que ya tienes.

2. **"Listas" / Colecciones temáticas:** "Las 10 series con peor final", "Libros que tienes que releer antes de la peli". Curatedas por ti o por usuarios. Aumenta el tiempo en el sitio y la profundidad SEO.

3. **Modo "Spoiler progresivo":** botones "Hasta el episodio X" o "Hasta el capítulo X" que ocultan secciones más allá. Útil para series mientras se ven, no solo para refrescar.

4. **Compartir tarjeta visual:** botón "Generar imagen" que produce una tarjeta cuadrada con póster + título + frase del usuario para compartir en RR.SS. Tracción gratis. Lo puedes generar con `next/og` (Vercel OG image API).

5. **"Si te gustó X, también te puede sonar Y":** sección al final de la ficha con 3 obras del mismo género/tipo. Ya tienes `genres` en works, basta con un query simple. Cierra el loop sin meter recomendaciones algorítmicas pesadas.

---

## 13. Tres microbugs a vigilar

- **`home-sections.tsx`:** el `priority` en el póster de la `FeaturedCard` está bien (es above-the-fold), pero el `priority` y `fill` con `aspect-[3/2]` en móvil y `sm:aspect-[2/3]` desktop puede generar layout shift. Mide CLS en Lighthouse.
- **`NavSearch.tsx`:** tiene `useEffect` con `query` sin incluir `open` ni cancelación cuando se cierra. Si el usuario cierra el dropdown justo cuando la query está volando, se pinta resultado fantasma. Añade un `if (!open) return` al inicio del setTimeout.
- **`UserContentPanel.tsx`:** el `setTimeout` de notas (1200ms) y fecha (600ms) no se cancelan en `unmount`. Si el usuario cambia de página rápido se queda colgado. Añade un `useEffect` cleanup.

---

## 14. Sobre los 3 diseños que me pasaste

El link que me pasaste (`claude.ai/design/p/...?file=Spoilering+Rediseño.html&via=share`) requiere tu sesión de Claude.ai para abrirse — yo no puedo verlo desde aquí. Para que pueda evaluarlos:

- **Opción A:** descarga el HTML y guárdalo en `C:\Proyectos\spoilering\spoilering\notes\rediseno-A.html`, `rediseno-B.html`, `rediseno-C.html`. Yo los leo del filesystem.
- **Opción B:** pásame 1 captura de pantalla por diseño (puedes pegarlas directamente aquí).
- **Opción C:** dime los 3 conceptos en una frase cada uno y los discutimos.

Cualquiera me sirve. Te diré para cada uno qué partes encajan con la dirección actual de Spoilering (paleta editorial, prioridad a tipografía, sin ruido visual) y qué piezas quitaría.

---

## TL;DR — qué tocar primero (por impacto/esfuerzo)

| Prioridad | Cambio | Esfuerzo |
|---|---|---|
| 🔴 1 | Arreglar `FeaturedCard` (sección 1) | 5 min |
| 🔴 2 | Cambiar tipografía a Inter + Fraunces (sección 4) | 15 min |
| 🟠 3 | Subir contrastes `text-ink/30` y `/40` (sección 5) | 20 min |
| 🟠 4 | Centralizar paleta de tipos en `lib/work-types.ts` y arreglar inconsistencias (sección 3) | 30 min |
| 🟠 5 | Reescribir copy del hero y CTAs (sección 2) | 30 min |
| 🟡 6 | Footer rediseñado (sección 6) | 20 min |
| 🟡 7 | Stat strip bajo el hero + última ficha añadida (sección 8) | 1h |
| 🟢 8 | Mosaico de pósters al fondo del hero | 2h |
| 🟢 9 | Fila "Continuar leyendo" en home (sección 12) | 2h |
| 🟢 10 | Listas/Colecciones temáticas | 1 día |

Empezaría por las 5 primeras: con eso solo Spoilering ya se va a ver bastante mejor.
