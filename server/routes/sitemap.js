import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { format } from "date-fns";

// ✅ Static pages
const staticRoutes = [
  "/",
  "/news",
  "/marketplace",
  "/portfolio-predict",
  "/contact",
  "/wallet",
  "/profile",
];

// ✅ Load stock symbols & company names
async function loadStockData() {
  const csvFilePath = path.join(process.cwd(), "util", "NSE.csv");
  const stocks = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on("data", (row) => {
        const symbol = row.tradingsymbol?.trim();
        const companyName = row.name?.trim();
        if (symbol || companyName) stocks.push({ symbol, companyName });
      })
      .on("end", () => resolve(stocks))
      .on("error", reject);
  });
}

async function generateSitemap() {
  const baseUrl = "https://trade-shala-inky.vercel.app";
  const today = format(new Date(), "yyyy-MM-dd");

  const stocks = await loadStockData();
  const urls = [];

  // Static
  staticRoutes.forEach((route) => {
    urls.push(`
      <url>
        <loc>${baseUrl}${route}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
    `);
  });

  // Dynamic
  stocks.forEach(({ symbol, companyName }) => {
    if (symbol) {
      urls.push(`
        <url>
          <loc>${baseUrl}/stock/${encodeURIComponent(symbol)}</loc>
          <lastmod>${today}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
        </url>
        <url>
          <loc>${baseUrl}/technical-analysis/${encodeURIComponent(symbol)}</loc>
          <lastmod>${today}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.7</priority>
        </url>
      `);
    }

    if (companyName) {
      const safeName = companyName.replace(/\s+/g, "-");
      urls.push(`
        <url>
          <loc>${baseUrl}/company/${encodeURIComponent(safeName)}</loc>
          <lastmod>${today}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
      `);
    }
  });

  // Final XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  // ✅ Save into public/sitemap.xml
  const outputPath = path.join(process.cwd(), "..", "client", "public", "sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf8");
  console.log("✅ Sitemap generated at public/sitemap.xml");
}

generateSitemap();
