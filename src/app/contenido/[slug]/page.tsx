import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contents, getContentBySlug } from "@/data/contents";

type ContentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return contents.map((content) => ({
    slug: content.slug,
  }));
}

export async function generateMetadata({
  params,
}: ContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = getContentBySlug(slug);

  if (!content) {
    return {
      title: "Contenido no encontrado",
    };
  }

  return {
    title: content.title,
    description: `Resumen completo con spoilers de ${content.title}.`,
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { slug } = await params;
  const content = getContentBySlug(slug);

  if (!content) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      <Link
        className="inline-flex font-semibold text-ember transition hover:text-ink"
        href="/#recientes"
      >
        Volver a contenidos recientes
      </Link>

      <header className="mt-8 border-b border-zinc-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
          {content.type} · {content.year}
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-zinc-700">
          {content.description}
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {content.sections.map((section) => (
          <section
            className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
            key={section.title}
          >
            <h2 className="text-2xl font-bold text-ink">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p className="mt-4 leading-8 text-zinc-700" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
