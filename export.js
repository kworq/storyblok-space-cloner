import axios from "axios";
import fs from "fs";
import { get } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://api-us.storyblok.com/v1";
const SPACE_ID = process.env.STORYBLOK_EXPORT_SPACE_ID;
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const NOW = new Date().toISOString().replace(/:/g, "-");

async function getItems(END_TYPE, id = "", searchParams = {}) {
  const kvs = Object.entries(searchParams).map(([k, v]) => `${k}=${v}`);
  const response = await axios.get(
    `${BASE_URL}/spaces/${SPACE_ID}/${END_TYPE}${id ? `/${id}` : ""}${
      kvs.length ? `?${kvs.join("&")}` : ""
    }`,
    {
      headers: { Authorization: MANAGEMENT_TOKEN },
    }
  );
  if (!response.statusText === "OK") {
    throw new Error(
      `HTTP error! Status: ${response.status} - ${response.statusText}`
    );
  }
  const items =
    response.data?.[END_TYPE === "stories" && id !== "" ? "story" : END_TYPE];
  const __newdirname = path.join(__dirname, "backups", NOW, END_TYPE);

  fs.mkdirSync(__newdirname, { recursive: true }, (err) => {
    if (err) throw err;
  });
  if (END_TYPE === "components" || (END_TYPE === "stories" && id !== "")) {
    [...(items instanceof Array ? items : [items])].forEach(async (item) => {
      const jsonString = JSON.stringify(item, null, 2);

      const filePath = path.join(__newdirname, `${item.name}.json`);

      fs.writeFile(filePath, jsonString, (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          console.log("Successfully wrote JSON to file:", filePath);
        }
      });
    });
  } else if (END_TYPE === "stories" && id === "") {
    await getStories(END_TYPE, items);
  } else if (END_TYPE === "assets") {
    const filePath = path.join(__newdirname, `assets.json`);
    const _items = items.map((item) => {
      return {
        filename: item.filename.replace("s3.amazonaws.com/", ""),
        alt: item.alt,
        title: item.title,
      };
    });
    const jsonString = JSON.stringify(_items, null, 2);
    fs.writeFile(filePath, jsonString, (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log("Successfully wrote JSON to file:", filePath);
      }
    });
  }

  return `id: ${id} - ${END_TYPE}`;
}

async function* generateGetItems(END_TYPE, items) {
  let i = 0;
  while (i < items.length) {
    yield await getItems(END_TYPE, items[i++].id);
  }
}

async function getStories(END_TYPE, items) {
  for await (const story of generateGetItems(END_TYPE, items)) {
    console.log("story", story);
  }
}
(async () => {
  await getItems("stories", "", { per_page: 100 });
  await getItems("components");
  await getItems("assets", "", { per_page: 500 });
})();
