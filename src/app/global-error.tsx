"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <main
          style={{
            alignItems: "center",
            background: "#fbfaf7",
            color: "#18181b",
            display: "flex",
            minHeight: "100vh",
            padding: "24px",
          }}
        >
          <section style={{ margin: "0 auto", maxWidth: "720px" }}>
            <p
              style={{
                color: "#d84f2a",
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Error inesperado
            </p>
            <h1 style={{ fontSize: "40px", margin: "16px 0 0" }}>
              Spoilering no ha podido cargar.
            </h1>
            <p style={{ color: "#52525b", fontSize: "18px", lineHeight: 1.7 }}>
              Recarga la página para volver a intentarlo.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#18181b",
                border: 0,
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
                marginTop: "24px",
                padding: "12px 20px",
              }}
              type="button"
            >
              Recargar
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
