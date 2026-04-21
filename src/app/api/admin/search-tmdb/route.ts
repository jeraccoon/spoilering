import { NextResponse } from "next/server";
import { searchTmdb } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: unknown;
    };
    const title = typeof body.title === "string" ? body.title : "";
    const results = await searchTmdb(title);

    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo buscar en TMDb.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
