import { NextResponse } from "next/server";
import { generateContent } from "@/lib/generate-content";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: unknown };
    const title = typeof body.title === "string" ? body.title : "";
    const content = await generateContent(title);

    return NextResponse.json({ content });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo generar la ficha.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
