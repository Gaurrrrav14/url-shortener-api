export async function fetchMetadata(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; URLShortenerBot/1.0; +https://yourdomain.com)",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch URL: ${res.status}`);
    }

    const html = await res.text();

    // Extract <title>
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract meta description
    // const metaMatch = html.match(
    //   /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
    // );
    // const description = metaMatch ? metaMatch[1].trim() : "";

    let description = "";

// Try standard meta description
    const metaMatch = html.match(
    /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
    );

    if (metaMatch) {
        description = metaMatch[1].trim();
    } else {
    // Fallback to Open Graph description
    const ogMatch = html.match(
        /<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i
    );
    if (ogMatch) {
        description = ogMatch[1].trim();
    }
    }

    return {
      title,
      description,
    };
  } catch (err) {
    console.error("Metadata fetch failed:", err.message);

    // Important: do NOT throw
    // We don't want the whole pipeline to fail because of bad metadata
    return {
      title: "",
      description: "",
    };
  }
}