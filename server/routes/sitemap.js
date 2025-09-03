import express from "express";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { format } from "date-fns";

const router = express.Router();

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

// ✅ Function to load stock symbols & company names
async function loadStockData() {
  const csvFilePath = path.join(process.cwd(), "utils", "NSE.csv"); // <-- path to your file
  const stocks = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on("data", (row) => {
        const symbol = row.tradingsymbol?.trim();
        const companyName = row.name?.trim();

        if (symbol || companyName) {
          stocks.push({ symbol, companyName });
        }
      })
      .on("end", () => resolve(stocks))
      .on("error", (err) => reject(err));
  });
}

router.get("/sitemap.xml", async (req, res) => {
  const baseUrl = "https://trade-shala-inky.vercel.app";
  const today = format(new Date(), "yyyy-MM-dd");

  try {
    const stocks = await loadStockData();

    let urls = "";

    // Add static routes
    staticRoutes.forEach((path) => {
      urls += `
        <url>
          <loc>${baseUrl}${path}</loc>
          <lastmod>${today}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    });

    // Add stock/company/technical-analysis routes from CSV
    stocks.forEach(({ symbol, companyName }) => {
      if (symbol) {
        urls += `
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
        `;
      }

      if (companyName) {
        urls += `
          <url>
            <loc>${baseUrl}/company/${encodeURIComponent(companyName.replace(/\s+/g, "-"))}</loc>
            <lastmod>${today}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>0.7</priority>
          </url>
        `;
      }
    });

    // Final XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls}
      </urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("Error generating sitemap:", err);
    res.status(500).send("Error generating sitemap");
  }
});

export default router;
