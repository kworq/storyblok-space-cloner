export const cloneDeep = (obj) => {
    let newObj = obj;
    if (newObj instanceof Object && !(newObj instanceof Array)) {
        newObj = { ...newObj };
        for (const prop in newObj) {
            if (newObj[prop] instanceof Object || newObj[prop] instanceof Array) {
                const item = newObj[prop];
                newObj[prop] = cloneDeep(item);
            }
        }
    }
    else if (newObj instanceof Array) {
        newObj = [...newObj];
        const len = newObj.length;
        for (let i = 0; i < len; i++) {
            const item = newObj[i];
            if (item instanceof Object || item instanceof Array) {
                newObj[i] = cloneDeep(item);
            }
        }
    }
    return newObj;
};
export function findValuesByKey(obj, key) {
    let results = [];
    function search(obj) {
        if (Array.isArray(obj)) {
            obj.forEach((item) => search(item));
        }
        else if (obj !== null && typeof obj === "object") {
            for (const k in obj) {
                if (k === key) {
                    results.push({ ref: obj, key: k }); // Storing references for later replacement
                }
                search(obj[k]);
            }
        }
    }
    search(obj);
    return results;
}
export async function updateValues(obj, key, getNewValue) {
    const items = findValuesByKey(obj, key);
    const promises = items.map((item) => getNewValue(item.ref[item.key]).then((newValue) => {
        item.ref[item.key] = newValue;
    }));
    await Promise.all(promises);
}
//# sourceMappingURL=assetRefFindReplace.js.map