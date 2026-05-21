import { fetchMetadata } from "./src/utils/metadata.js";

const test = async () => {
  const urls = [
    "https://docs.docker.com/network/",
    "https://redis.io/docs/getting-started/",
  ];

  for (const url of urls) {
    console.log(`\nTesting: ${url}`);

    const data = await fetchMetadata(url);

    console.log("Title:", data.title);
    console.log("Description:", data.description);
  }
};

test();