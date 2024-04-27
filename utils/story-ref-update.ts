// Helper function to find UUIDs in a nested object
// export function findUUIDs(obj: Record<string, any> | string | any[] | null) {
//   const uuidRegex =
//     /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
//   const uuids: string[] = [];

//   function search(obj: Record<string, any> | string | any[] | null) {
//     if (Array.isArray(obj)) {
//       obj.forEach((item) => search(item));
//     } else if (obj !== null && typeof obj === "object") {
//       Object.entries(obj).forEach(([key, value]) => {
//         if (
//           typeof value === "string" &&
//           uuidRegex.test(value) &&
//           key !== "_uid"
//         ) {
//           uuids.push(value);
//         } else if (typeof value === "object") {
//           search(value);
//         }
//       });
//     }
//   }

//   search(obj);
//   return uuids;
// }

export function findUUIDs(obj: Record<string, any> | string | any[] | null) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let uuids: string[] = [];

  function search(
    obj: Record<string, any> | string | any[] | null,
    parentKey = ""
  ) {
    if (Array.isArray(obj)) {
      // Process each item in the array
      obj.forEach((item) => {
        if (
          typeof item === "string" &&
          uuidRegex.test(item) &&
          parentKey !== "_uid"
        ) {
          console.log("parentKey", parentKey);
          uuids.push(item);
        } else if (typeof item === "object") {
          search(item, parentKey);
        }
      });
    } else if (obj !== null && typeof obj === "object") {
      Object.entries(obj).forEach(([key, value]) => {
        if (
          typeof value === "string" &&
          uuidRegex.test(value) &&
          key !== "_uid"
        ) {
          console.log("key", key);
          uuids.push(value);
        } else if (typeof value === "object") {
          search(value, key);
        }
      });
    }
  }

  search(obj);
  return uuids;
}

// // Simulated function to fetch data by UUID
// async function fetchDataByUUID(uuid: string) {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve({ full_slug: `path/to/resource/${uuid}` });
//     }, 1000);
//   });
// }

// // Simulated function to fetch another UUID by full_slug
// async function fetchAnotherUUIDByFullSlug(fullSlug) {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       const newUUID = "new-" + fullSlug.split("/").pop();
//       resolve(newUUID);
//     }, 1000);
//   });
// }

// Function to get a map of old UUIDs to new UUIDs
export async function getFullSlugUUIDs(
  uuids: string[],
  fetchFullSlugByUUID: (uuid: string) => Promise<string>,
  fetchUUIDByFullSlug: (fullSlug: string) => Promise<string>
) {
  const uuidMapping: Record<string, string> = {};
  for await (const uuid of uuids) {
    //const data = await fetchFullSlugByUUID(uuid);
    const newUUID = await fetchUUIDByFullSlug(await fetchFullSlugByUUID(uuid));
    uuidMapping[uuid] = newUUID;
  }
  return uuidMapping;
}

// Function to replace UUIDs in the nested object
// export function replaceUUIDs(
//   obj: Record<string, any> | string | any[] | null,
//   uuidMapping: Record<string, string>
// ) {
//   function replace(obj: Record<string, any> | string | any[] | null) {
//     if (Array.isArray(obj)) {
//       obj.forEach((item) => replace(item));
//     } else if (obj !== null && typeof obj === "object") {
//       Object.keys(obj).forEach((key) => {
//         if (typeof obj[key] === "string" && uuidMapping[obj[key]]) {
//           obj[key] = uuidMapping[obj[key]];
//         } else if (typeof obj[key] === "object") {
//           replace(obj[key]);
//         }
//       });
//     }
//   }
//   replace(obj);
// }

export function replaceUUIDs(
  obj: Record<string, any> | string | any[] | null,
  uuidMapping: Record<string, string>
) {
  function replace(obj: Record<string, any> | string | any[] | null) {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === "string" && uuidMapping[item]) {
          obj[index] = uuidMapping[item];
        } else if (typeof item === "object") {
          replace(item);
        }
      });
    } else if (obj !== null && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === "string" && uuidMapping[obj[key]]) {
          obj[key] = uuidMapping[obj[key]];
        } else if (typeof obj[key] === "object") {
          replace(obj[key]);
        }
      });
    }
  }
  replace(obj);
}

// Main function to update UUIDs in a nested object
// async function updateNestedObjectUUIDs(obj) {
//   const uuids = findUUIDs(obj);
//   console.log("Original UUIDs found:", uuids);

//   const uuidMapping = await getFullSlugUUIDs(uuids);
//   console.log("UUID mapping:", uuidMapping);

//   replaceUUIDs(obj, uuidMapping);
//   console.log("Updated object:", JSON.stringify(obj));
// }
