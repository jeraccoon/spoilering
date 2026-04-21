import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getContentBySlug,
  getContentTypeLabel,
  getPublishedContents,
  isPublishedContent,
} from "@/data/contents";

type ContentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getPublishedContents().map((content) => ({
    slug: content.slug,
  }));
}

export async function generateMetadata({
  params,
}: ContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = getContentBySlug(slug);

  if (!content || !isPublishedContent(content)) {
    return {
      title: "Contenido no encontrado",
    };
  }

  return {
    title: content.title,
    description: content.shortSummary,
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { slug } = await params;
  const content = getContentBySlug(slug);

  if (!content || !isPublishedContent(content)) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          className="inline-flex text-sm font-semibold text-ember transition hover:text-ink"
          href="/#recientes"
        >
          Volver a contenidos recientes
        </Link>

        <header className="mt-8 rounded-lg border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
            {getContentTypeLabel(content.type)} · {content.year}
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-6 border-l-4 border-ember pl-5 text-lg leading-8 text-zinc-700 sm:text-xl sm:leading-9">
            {content.shortSummary}
          </p>
        </header>
      </div>

      <div className="mx-auto mt-12 max-w-3xl space-y-8">
        {content.longSummary.map((section, index) => (
          <section
            className="rounded-lg border border-zinc-200 bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-9"
            key={section.title}
          >
            <div className="flex items-center gap-4 border-b border-zinc-200 pb-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
                {index + 1}
              </span>
              <h2 className="text-2xl font-bold leading-tight text-ink">
                {section.title}
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              {section.paragraphs.map((paragraph) => (
                <p
                  className="text-[1.05rem] leading-8 text-zinc-700"
                  key={paragraph}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
