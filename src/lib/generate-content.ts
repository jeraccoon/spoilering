import type { ContentType, LongSummarySection } from "@/data/contents";

export type GeneratedContent = {
  title: string;
  type: ContentType;
  year: string;
  shortSummary: string;
  longSummary: LongSummarySection[];
};

export type GenerationReference = {
  title: string;
  type: ContentType;
  year: string;
  slug?: string;
  source?: "local" | "tmdb";
  tmdbId?: number;
};

type OpenAIContentResponse = {
  title: string;
  type: ContentType;
  year: string;
  shortSummary: string;
  longSummary: LongSummarySection[];
};

type OpenAIResponseContentItem = {
  type?: string;
  text?: string;
};

type OpenAIResponseOutputItem = {
  type?: string;
  content?: OpenAIResponseContentItem[];
};

type OpenAIResponseBody = {
  output_text?: unknown;
  output?: OpenAIResponseOutputItem[];
  status?: string;
  error?: {
    message?: string;
  };
  incomplete_details?: {
    reason?: string;
  };
};

const contentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "type", "year", "shortSummary", "longSummary"],
  properties: {
    title: {
      type: "string",
    },
    type: {
      type: "string",
      enum: ["libro", "serie", "pelicula"],
    },
    year: {
      type: "string",
    },
    shortSummary: {
      type: "string",
    },
    longSummary: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "paragraphs"],
        properties: {
          title: {
            type: "string",
            enum: ["Inicio", "Desarrollo", "Final"],
          },
          paragraphs: {
            type: "array",
            minItems: 1,
            maxItems: 2,
            items: {
              type: "string",
            },
          },
        },
      },
    },
  },
} as const;

function extractResponseText(data: OpenAIResponseBody) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const textFromOutput = data.output
    ?.flatMap((item) => item.content ?? [])
    .find(
      (content) =>
        content.type === "output_text" &&
        typeof content.text === "string" &&
        content.text.trim(),
    )?.text;

  return textFromOutput ?? null;
}

export async function generateContent(
  title: string,
  reference?: GenerationReference,
): Promise<GeneratedContent> {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    throw new Error("Escribe un título antes de generar una ficha.");
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY en el archivo .env.");
  }

  const referenceText = reference
    ? `Contexto interno de desambiguación:
- origen: ${reference.source ?? "local"}
- título elegido: ${reference.title}
- tipo: ${reference.type}
- año: ${reference.year}
${reference.slug ? `- slug interno: ${reference.slug}` : ""}
${typeof reference.tmdbId === "number" ? `- id de TMDb: ${reference.tmdbId}` : ""}

Si este contexto existe, úsalo para resolver ambigüedades antes de escribir la ficha.`
    : "No hay contexto adicional de desambiguación.";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      max_output_tokens: 900,
      input: [
        {
          role: "system",
          content:
            "Eres un editor interno de Spoilering. Tu prioridad es la fiabilidad, pero la ficha debe seguir siendo útil. Si reconoces claramente la obra, genera una ficha breve en español con spoilers reales. No inventes autores, fechas, personajes, tramas ni finales. Si no tienes suficiente información o el título es ambiguo, dilo claramente y aun así crea una ficha básica marcada como ESTIMADA o NO VERIFICADA. En ese caso: infiere de forma prudente el tipo más probable entre libro, serie o pelicula; usa year como \"No verificado\" si no sabes el año; no menciones personajes, autores, escenas, fechas o finales concretos que no puedas verificar; usa las secciones Inicio, Desarrollo y Final para explicar una estructura probable de análisis, no hechos concretos. Mantén textos claros, moderados y coherentes. La estructura del esquema siempre debe cumplirse.",
        },
        {
          role: "user",
          content: `Genera una ficha con spoilers para este título: "${cleanTitle}".

${referenceText}

Si identificas la obra con seguridad, resume la obra real. Si no puedes identificarla con seguridad, no te limites a rechazar: crea una ficha básica útil, estimada y no verificada, evitando datos concretos inventados.`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "spoilering_content",
          strict: true,
          schema: contentSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI no pudo generar la ficha (${response.status}). ${errorText}`,
    );
  }

  const data = (await response.json()) as OpenAIResponseBody;

  if (data.status === "incomplete") {
    throw new Error(
      `OpenAI dejó la respuesta incompleta: ${
        data.incomplete_details?.reason ?? "motivo desconocido"
      }.`,
    );
  }

  if (data.error?.message) {
    throw new Error(`OpenAI devolvió un error: ${data.error.message}`);
  }

  const outputText = extractResponseText(data);

  if (!outputText) {
    console.error(
      "OpenAI response without readable output text:",
      JSON.stringify(data, null, 2),
    );
    throw new Error("OpenAI no devolvió una respuesta de texto válida.");
  }

  let parsed: OpenAIContentResponse;

  try {
    parsed = JSON.parse(outputText) as OpenAIContentResponse;
  } catch {
    console.error("OpenAI output was not valid JSON:", outputText);
    throw new Error("OpenAI devolvió texto, pero no era JSON válido.");
  }

  return {
    title: parsed.title,
    type: parsed.type,
    year: parsed.year,
    shortSummary: parsed.shortSummary,
    longSummary: parsed.longSummary,
  };
}
