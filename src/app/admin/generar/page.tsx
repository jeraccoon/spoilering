import type { Metadata } from "next";
import { GeneratedContentForm } from "@/components/generated-content-form";

export const metadata: Metadata = {
  title: "Admin - Generar ficha simulada",
  description:
    "Herramienta interna para simular la generación automática de fichas en Spoilering.",
};

export default function AdminGeneratePage() {
  return <GeneratedContentForm />;
}
