import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentEditorForm } from "@/components/content-editor-form";
import { getEditableContentBySlug } from "@/lib/save-content";

type AdminContentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminContentPage({
  params,
}: AdminContentPageProps) {
  const { slug } = await params;
  const editableContent = getEditableContentBySlug(slug);

  if (!editableContent) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        className="inline-flex text-sm font-semibold text-ember transition hover:text-ink"
        href="/admin/contenidos"
      >
        Volver al listado de contenidos
      </Link>

      <ContentEditorForm
        initialContent={editableContent}
        saveUrl={`/api/admin/update-content/${slug}`}
      />
    </div>
  );
}
