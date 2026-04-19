# Spoilering

## 🧠 Idea del proyecto

Spoilering es una web donde los usuarios pueden leer **resúmenes completos con spoilers** de libros, series, películas, anime y videojuegos.

El objetivo es permitir:

* entender una historia sin consumirla entera
* recordar una historia ya vista o leída
* consultar finales y giros importantes de forma rápida

---

## 🎯 Propuesta de valor

“La forma más rápida de entender cualquier historia, con spoilers incluidos.”

Diferencias respecto a otras plataformas:

* contenido estructurado (no texto caótico tipo wiki)
* lectura rápida y clara
* varios niveles de resumen
* generación asistida por IA
* enfoque práctico (no teorías ni ruido)

---

## 🚀 MVP (Primera versión)

### Funcionalidades

* buscador de obras
* fichas públicas
* resumen corto
* resumen medio
* historia completa
* personajes clave
* final explicado
* panel privado de administración
* generación de fichas con IA

---

## 🧩 Estructura de una ficha

Cada obra tendrá:

1. Resumen corto (30 segundos)
2. Resumen medio
3. Historia completa
4. Personajes
5. Final explicado

---

## 🤖 Uso de IA

La IA se utiliza para:

* convertir texto libre en estructura
* generar resúmenes
* detectar personajes
* ayudar a completar fichas

IMPORTANTE:

* la IA no publica automáticamente
* siempre hay revisión manual

---

## ⚙️ Stack técnico

* Frontend: Next.js
* Backend: Next.js (API routes)
* Base de datos: PostgreSQL
* ORM: Prisma
* Estilos: Tailwind CSS
* IA: OpenAI API
* Hosting: Vercel

---

## 🗺️ Plan de desarrollo

### Fase 1

* proyecto base
* base de datos
* home
* ficha pública

### Fase 2

* panel admin
* CRUD de obras

### Fase 3

* integración IA

### Fase 4

* despliegue

---

## 🧠 Flujo con IA

1. Usuario pega texto
2. IA estructura contenido
3. Se muestra vista previa
4. Usuario revisa
5. Se guarda

---

## 📂 Prompts Codex

Ver carpeta `/prompts`

---

## ✅ Tareas pendientes

* [ ] crear proyecto base
* [ ] configurar base de datos
* [ ] crear fichas públicas
* [ ] panel admin
* [ ] integración IA
* [ ] despliegue
* [ ] contenido inicial

---

## 📌 Notas

* mantener el MVP simple
* priorizar calidad de contenido
* no añadir funcionalidades complejas al inicio
