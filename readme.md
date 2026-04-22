# Spoilering

Spoilering es una web publica de resumenes con spoilers de libros, series y peliculas.

La idea es simple: entrar, buscar una obra y entender rapido que ocurre, quien importa y como termina.

## Que incluye ahora

- Proyecto base con Next.js, TypeScript y Tailwind CSS.
- Pagina de inicio sencilla.
- Header y footer.
- Pagina 404.
- Configuracion inicial de SEO.
- Archivo `.env.example` con las variables necesarias.

## Que no incluye todavia

- Buscador real conectado a base de datos.
- Fichas publicas individuales.
- Panel de administracion.
- Inicio de sesion.
- Generacion de contenido con IA.

Eso llegara despues. Este primer paso solo prepara una base limpia para construir encima.

## Requisitos

Antes de empezar necesitas instalar:

- Node.js.
- Un editor de codigo, por ejemplo Visual Studio Code.

Si no sabes si tienes Node.js instalado, abre una terminal y ejecuta:

```bash
node -v
```

Si aparece un numero de version, lo tienes instalado.

## Como arrancar el proyecto

1. Instala las dependencias:

```bash
npm install
```

2. Crea el archivo de configuracion local:

```bash
copy .env.example .env
```

En Windows PowerShell tambien puedes usar:

```bash
Copy-Item .env.example .env
```

3. Revisa el archivo `.env`.

4. Arranca la web:

```bash
npm run dev
```

5. Abre esta direccion en el navegador:

```bash
http://localhost:3000
```

## Comandos utiles

```bash
npm run dev
```

Arranca la web en modo desarrollo.

```bash
npm run build
```

Comprueba si la web compila para produccion.

```bash
npm run lint
```

Revisa errores basicos de codigo.

## Estructura principal

```text
src/app
```

Aqui estan las paginas principales de Next.js.

```text
src/components
```

Aqui estan componentes reutilizables como el header y el footer.

## Proximos pasos recomendados

1. Crear la primera ficha publica de una obra.
2. Conectar el listado de obras con una base de datos.
3. Anadir una pagina de detalle por slug.
4. Crear un panel privado sencillo para anadir contenido.
