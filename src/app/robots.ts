import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/es/admin",
        "/en/admin",
        "/perfil",
        "/es/perfil",
        "/en/perfil",
        "/api",
        "/auth",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
