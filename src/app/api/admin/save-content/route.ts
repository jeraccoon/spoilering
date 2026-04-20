import { NextResponse } from "next/server";
import { saveContent, type EditableContentPayload } from "@/lib/save-content";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as EditableContentPayload;
    const content = await saveContent(payload);

    return NextResponse.json({ content });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo guardar la ficha.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
