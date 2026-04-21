import type { ContentType } from "@/data/contents";

type TmdbMediaType = "movie" | "tv";

type TmdbMultiSearchResult = {
  id: number;
  media_type: TmdbMediaType | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
};

type TmdbMultiSearchResponse = {
  results?: TmdbMultiSearchResult[];
};

export type TmdbSearchResult = {
  id: number;
  title: string;
  type: ContentType;
  year: string;
  posterPath: string | null;
  posterUrl: string | null;
};

function mapTmdbType(mediaType: TmdbMediaType): ContentType {
  return mediaType === "movie" ? "pelicula" : "serie";
}

function getYear(result: TmdbMultiSearchResult) {
  const rawDate =
    result.media_type === "movie" ? result.release_date : result.first_air_date;

  return rawDate?.slice(0, 4) || "No verificado";
}

export async function searchTmdb(query: string): Promise<TmdbSearchResult[]> {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    throw new Error("Escribe un título antes de buscar en TMDb.");
  }

  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("Falta configurar TMDB_API_KEY en el archivo .env.");
  }

  const url = new URL("https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", cleanQuery);
  url.searchParams.set("language", "es-ES");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `TMDb no pudo completar la búsqueda (${response.status}). ${errorText}`,
    );
  }

  const data = (await response.json()) as TmdbMultiSearchResponse;

  return (data.results ?? [])
    .filter(
      (result): result is TmdbMultiSearchResult & { media_type: TmdbMediaType } =>
        result.media_type === "movie" || result.media_type === "tv",
    )
    .map((result) => {
      const posterPath = result.poster_path ?? null;

      return {
        id: result.id,
        title:
          (result.media_type === "movie" ? result.title : result.name) ??
          "Título no disponible",
        type: mapTmdbType(result.media_type),
        year: getYear(result),
        posterPath,
        posterUrl: posterPath
          ? `https://image.tmdb.org/t/p/w154${posterPath}`
          : null,
      };
    });
}
