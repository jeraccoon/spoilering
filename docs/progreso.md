\# Spoilering - Progreso del Proyecto



\## 🧠 Estado actual



El proyecto Spoilering ha alcanzado un MVP funcional con las siguientes capacidades:



\* Generación de fichas mediante IA (OpenAI)

\* Herramienta interna en `/admin/generar`

\* Edición manual de contenido antes de guardar

\* Sistema de guardado funcional en `contents.ts`

\* Visualización pública de fichas

\* Buscador y filtros por tipo (libro, serie, película)

\* Sistema dinámico de rutas (`/contenido/\[slug]`)



\---



\## ⚙️ Arquitectura actual



\### Generación de contenido



\* Uso de OpenAI API desde servidor

\* Prompt controlado para evitar contenido inventado

\* Sistema de control:



&#x20; \* “NO VERIFICADO” cuando no hay certeza

&#x20; \* Generación estimada cuando falta contexto



\### Flujo de creación



1\. Introducir título en `/admin/generar`

2\. Generar contenido con IA

3\. Revisar resultado

4\. Editar campos manualmente

5\. Guardar ficha



\### Persistencia



\* Sistema actual basado en:



&#x20; \* `src/data/contents.ts`

\* No se usa base de datos todavía



\---



\## 🧩 Decisiones clave



\* ❗ IA solo disponible en entorno admin (control de coste)

\* ❗ No generación automática para usuarios

\* ❗ Revisión manual obligatoria antes de guardar

\* ❗ No uso de base de datos en fase inicial

\* ❗ Prioridad: simplicidad y velocidad de desarrollo



\---



\## 💸 Control de costes IA



\* Uso manual (1 generación = 1 acción consciente)

\* Sin reintentos automáticos

\* Sin generación en frontend

\* Límite configurado en OpenAI

\* Uso en entorno controlado (/admin)



\---



\## 🐞 Problemas resueltos



\* Error `insufficient\_quota` → configuración de facturación

\* Error parsing respuesta OpenAI → adaptación a nueva API

\* Errores de caché Next.js → limpieza de `.next`

\* Internal Server Error al guardar → ajuste de lógica de escritura

\* Generación de contenido incorrecto → mejora de prompt



\---



\## ⚠️ Limitaciones actuales



\* No hay base de datos (persistencia limitada)

\* No hay sistema de usuarios

\* No hay estado de contenido (todo se publica directamente)

\* Contenido IA aún genérico en algunos casos

\* No hay validación externa de contenido (APIs externas)



\---



\## 🚀 Próximos pasos



\### Prioridad alta



\* Sistema de estado:



&#x20; \* borrador

&#x20; \* publicado

\* Mejorar calidad del contenido generado (prompt engineering)



\### Prioridad media



\* Migración a base de datos (Prisma)

\* Panel admin más completo

\* Edición de fichas ya guardadas



\### Prioridad futura



\* Sistema de usuarios

\* Validación externa (Google Books, TMDB…)

\* Optimización SEO

\* Mejora UX/UI



\---



\## 🎯 Visión del producto



Spoilering no es solo una web de resúmenes.



Es un sistema de:



👉 generación asistida por IA

👉 validación humana

👉 publicación estructurada



Enfocado a crear contenido rápido, fiable y escalable.



\---



\## 📌 Estado del proyecto



👉 MVP funcional completado (v0.1)



\* Flujo completo operativo

\* IA integrada

\* Contenido generable y persistente



\---



\## 🧭 Nota final



El foco actual debe ser:



\* mejorar calidad del contenido

\* controlar qué se publica

\* validar utilidad real del producto



No añadir complejidad innecesaria antes de tiempo.

## Último avance

- Integración con TMDb para desambiguación
- Selección de contenido real antes de generar
- Base para uso de imágenes y metadatos



