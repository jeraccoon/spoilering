import { NextResponse } from "next/server";
import { generateContent, type GenerationReference } from "@/lib/generate-content";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: unknown;
      reference?: unknown;
    };
    const title = typeof body.title === "string" ? body.title : "";
    const reference =
      typeof body.reference === "object" && body.reference !== null
        ? (body.reference as GenerationReference)
        : undefined;
    const content = await generateContent(title, reference);

    return NextResponse.json({ content });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo generar la ficha.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
