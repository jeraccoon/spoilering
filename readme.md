# Spoilering

Spoilering es una web pública de resúmenes con spoilers de libros, series y películas.

La idea es simple: entrar, buscar una obra y entender rápido qué ocurre, quién importa y cómo termina.

## Qué incluye ahora

- Proyecto base con Next.js, TypeScript y Tailwind CSS.
- Página de inicio sencilla.
- Header y footer.
- Página 404.
- Configuración inicial de SEO.
- Configuración inicial de Prisma para PostgreSQL.
- Archivo `.env.example` con las variables necesarias.

## Qué no incluye todavía

- Buscador real conectado a base de datos.
- Fichas públicas individuales.
- Panel de administración.
- Inicio de sesión.
- Generación de contenido con IA.

Eso llegará después. Este primer paso solo prepara una base limpia para construir encima.

## Requisitos

Antes de empezar necesitas instalar:

- Node.js.
- PostgreSQL.
- Un editor de código, por ejemplo Visual Studio Code.

Si no sabes si tienes Node.js instalado, abre una terminal y ejecuta:

```bash
node -v
```

Si aparece un número de versión, lo tienes instalado.

## Cómo arrancar el proyecto

1. Instala las dependencias:

```bash
npm install
```

2. Crea el archivo de configuración local:

```bash
copy .env.example .env
```

En Windows PowerShell también puedes usar:

```bash
Copy-Item .env.example .env
```

3. Revisa el archivo `.env`.

La variable más importante es `DATABASE_URL`. Debe apuntar a tu base de datos PostgreSQL.

Ejemplo:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spoilering?schema=public"
```

4. Genera Prisma Client:

```bash
npm run prisma:generate
```

5. Arranca la web:

```bash
npm run dev
```

6. Abre esta dirección en el navegador:

```bash
http://localhost:3000
```

## Comandos útiles

```bash
npm run dev
```

Arranca la web en modo desarrollo.

```bash
npm run build
```

Comprueba si la web compila para producción.

```bash
npm run lint
```

Revisa errores básicos de código.

```bash
npm run prisma:migrate
```

Crea o actualiza las tablas de PostgreSQL usando Prisma.

## Estructura principal

```text
src/app
```

Aquí están las páginas principales de Next.js.

```text
src/components
```

Aquí están componentes reutilizables como el header y el footer.

```text
prisma/schema.prisma
```

Aquí se define la estructura inicial de la base de datos.

## Próximos pasos recomendados

1. Crear la primera ficha pública de una obra.
2. Conectar el listado de obras con PostgreSQL.
3. Añadir una página de detalle por slug.
4. Crear un panel privado sencillo para añadir contenido.
