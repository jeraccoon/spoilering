import type { Metadata } from "next";
import Link from "next/link";
import { GeneratedContentForm } from "@/components/generated-content-form";

export const metadata: Metadata = {
  title: "Admin - Generar ficha simulada",
  description:
    "Herramienta interna para simular la generación automática de fichas en Spoilering.",
};

export default function AdminGeneratePage() {
  return (
    <>
      <div className="mx-auto max-w-4xl px-6 pt-12">
        <Link
          className="inline-flex text-sm font-semibold text-ember transition hover:text-ink"
          href="/admin/contenidos"
        >
          Ver contenidos guardados
        </Link>
      </div>
      <GeneratedContentForm />
    </>
  );
}
