import { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_NOT_FRONTEND_URL || "https://www.cronosmd.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/dashboard", "/shared"],
      },
    ],
    sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
