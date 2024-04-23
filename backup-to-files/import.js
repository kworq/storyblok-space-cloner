import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://api-us.storyblok.com/v1";
const SPACE_ID = process.env.STORYBLOK_IMPORT_SPACE_ID;
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const COMPONENTS_DIR = path.join(__dirname, "components");

fs.readdir(COMPONENTS_DIR, async (err, files) => {
  if (err) {
    console.error("Error reading components directory:", err);
    return;
  }

  for await (const file of files) {
    const componentPath = path.join(COMPONENTS_DIR, file);
    const componentData = JSON.parse(fs.readFileSync(componentPath, "utf8"));
    const name = componentData.name;
    const id = componentData.id;
    console.log(`Component Name/ID: ${name}/`, id);
    // Remove or modify any properties that should not be directly copied (e.g., "id", "space_id")
    delete componentData.id;
    delete componentData.space_id;
    // console.log(componentData);
    try {
      const response = await axios.post(
        `${BASE_URL}/spaces/${SPACE_ID}/components`,
        { component: componentData },
        { headers: { Authorization: MANAGEMENT_TOKEN } }
      );
      console.log(`Component Name/ID: ${name}/`, id, ` imported successfully.`);
    } catch (error) {
      console.error(`Error importing component ${name}/`, id);
    }
  }
});

// files.forEach((file) => {
//   const componentPath = path.join(COMPONENTS_DIR, file);
//   const componentData = JSON.parse(fs.readFileSync(componentPath, "utf8"));

//   // Remove or modify any properties that should not be directly copied (e.g., "id", "space_id")
//   delete componentData.id;
//   delete componentData.space_id;
//   // console.log(componentData);
//   axios
//     .post(
//       `${BASE_URL}/spaces/${SPACE_ID}/components`,
//       {
//         component: componentData,
//       },
//       {
//         headers: { Authorization: MANAGEMENT_TOKEN },
//       }
//     )
//     .then((response) => {
//       console.log(`Component ${componentData.name} imported successfully.`);
//     })
//     .catch((error) => {
//       console.error(
//         `Error importing component ${componentData.name}:`,
//         error
//       );
//     });
// });
