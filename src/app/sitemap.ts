import { MetadataRoute } from "next";

const siteUrl = (
  process.env.NEXT_PUBLIC_NOT_FRONTEND_URL || "https://www.cronosmd.com"
).replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/legal/privacidad",
    "/legal/terminos",
    "/legal/nom-024",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}
