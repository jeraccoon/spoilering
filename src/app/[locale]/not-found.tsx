import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ember">
        {t("tag")}
      </p>
      <h1 className="mt-4 text-4xl font-bold text-ink">{t("title")}</h1>
      <p className="mt-4 text-lg leading-8 text-zinc-700">
        {t("body")}
      </p>
      <Link
        className="mt-8 rounded-lg bg-ink px-5 py-3 font-semibold text-white transition hover:bg-ember focus:outline-none focus:ring-4 focus:ring-ember/25"
        href="/"
      >
        {t("back")}
      </Link>
    </section>
  );
}
