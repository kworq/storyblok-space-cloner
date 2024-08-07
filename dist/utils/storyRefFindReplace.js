export function findUUIDs(obj) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let uuids = [];
    function search(obj, parentKey = "") {
        if (Array.isArray(obj)) {
            // Process each item in the array
            obj.forEach((item) => {
                if (typeof item === "string" &&
                    uuidRegex.test(item) &&
                    parentKey !== "_uid") {
                    console.log("found key[]", parentKey);
                    uuids.push(item);
                }
                else if (typeof item === "object") {
                    search(item, parentKey);
                }
            });
        }
        else if (obj !== null && typeof obj === "object") {
            Object.entries(obj).forEach(([key, value]) => {
                if (typeof value === "string" &&
                    uuidRegex.test(value) &&
                    key !== "_uid") {
                    console.log("found key", key);
                    uuids.push(value);
                }
                else if (typeof value === "object") {
                    search(value, key);
                }
            });
        }
    }
    search(obj);
    return uuids;
}
// Function to get a map of old UUIDs to new UUIDs
export async function getFullSlugUUIDs(uuids, uuidMapping, fetchFullSlugByUUID, fetchUUIDByFullSlug) {
    let mappingChanged = false;
    for await (const uuid of uuids) {
        //const data = await fetchFullSlugByUUID(uuid);
        if (!uuidMapping[uuid]) {
            const newUUID = await fetchUUIDByFullSlug(await fetchFullSlugByUUID(uuid));
            uuidMapping[uuid] = newUUID;
            mappingChanged = true;
        }
        else {
            console.log("UUID already exists in mapping:", uuid);
        }
    }
    return { uuidMapping, mappingChanged };
}
export function replaceUUIDs(obj, uuidMapping) {
    function replace(obj) {
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                if (typeof item === "string" && uuidMapping[item]) {
                    obj[index] = uuidMapping[item];
                }
                else if (typeof item === "object") {
                    replace(item);
                }
            });
        }
        else if (obj !== null && typeof obj === "object") {
            Object.keys(obj).forEach((key) => {
                if (typeof obj[key] === "string" && uuidMapping[obj[key]]) {
                    obj[key] = uuidMapping[obj[key]];
                }
                else if (typeof obj[key] === "object") {
                    replace(obj[key]);
                }
            });
        }
    }
    replace(obj);
}
//# sourceMappingURL=storyRefFindReplace.js.map