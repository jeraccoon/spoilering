import { NextResponse } from "next/server";
import { updateContent, type EditableContentPayload } from "@/lib/save-content";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const payload = (await request.json()) as EditableContentPayload;
    const content = await updateContent(slug, payload);

    return NextResponse.json({
      content: {
        slug: content.slug,
        status: content.status,
        title: content.title,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar la ficha.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
