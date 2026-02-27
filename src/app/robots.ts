import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/profile"],
      },
    ],
    sitemap: "https://gotek.vercel.app/sitemap.xml",
  };
}
