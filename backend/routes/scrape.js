import express from "express";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";


const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("Received request to scrape:", req.body);
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();

    // You can process docs further or just return them
    res.json({ documents: docs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to scrape website" });
  }
});

export default router;
