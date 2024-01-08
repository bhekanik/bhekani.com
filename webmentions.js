import fs from "fs";
import https from "https";

const DOMAIN = "example.com"; // Change this!

const webmentions = await fetchWebmentions();
webmentions.forEach(writeWebMention);

function fetchWebmentions() {
  const url =
    "https://webmention.io/api/mentions.jf2" +
    `?domain=${DOMAIN}` +
    `&token=${process.env.WEBMENTION_API_KEY}` +
    "&per-page=999";

  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let body = "";

      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode !== 200) reject(body);
          resolve(response.children);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => reject(error));
  });
}

function writeWebMention(webmention) {
  // Each post will have its own webmentions json file, named after the slug
  const slug = webmention["wm-target"]
    .replace(`https://${DOMAIN}/`, "")
    .replace(/\/$/, "")
    .replace("/", "--");
  const filename = `./data/webmentions/${slug || "home"}.json`;

  // Create the file if it doesn't exist
  if (!fs.existsSync(filename)) {
    fs.writeFileSync(filename, JSON.stringify([webmention], null, 2));
    return;
  }

  // If the file already exists, append the new webmention while also deduping
  const entries = JSON.parse(fs.readFileSync(filename))
    .filter((wm) => wm["wm-id"] !== webmention["wm-id"])
    .concat([webmention]);
  entries.sort((a, b) => a["wm-id"] - b["wm-id"]);
  fs.writeFileSync(filename, JSON.stringify(entries, null, 2));
}
