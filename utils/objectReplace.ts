export const cloneDeep = <T>(obj: T): T | T[] => {
  let newObj: T | T[] = obj;
  if (newObj instanceof Object && !(newObj instanceof Array)) {
    newObj = { ...newObj };
    for (const prop in newObj) {
      if (newObj[prop] instanceof Object || newObj[prop] instanceof Array) {
        const item = newObj[prop];
        type K = typeof item;
        newObj[prop] = cloneDeep<K>(item) as K;
      }
    }
  } else if (newObj instanceof Array) {
    newObj = [...newObj];
    const len = newObj.length;
    for (let i = 0; i < len; i++) {
      const item = newObj[i];
      type K = typeof item;
      if ((item as any) instanceof Object || (item as any) instanceof Array) {
        newObj[i] = cloneDeep<K>(item) as K;
      }
    }
  }
  return newObj;
};

export function findValuesByKey(obj: Record<string, any>, key: string) {
  let results: { ref: Record<string, any>; key: string }[] = [];
  function search(obj: Record<string, any> | string | any[] | null) {
    if (Array.isArray(obj)) {
      obj.forEach((item) => search(item));
    } else if (obj !== null && typeof obj === "object") {
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

export async function updateValues(
  obj: Record<string, any>,
  key: string,
  getNewValue: (value: string) => Promise<any>
) {
  const items = findValuesByKey(obj, key);
  const promises = items.map((item) =>
    getNewValue(item.ref[item.key]).then((newValue) => {
      item.ref[item.key] = newValue;
    })
  );
  await Promise.all(promises);
}
