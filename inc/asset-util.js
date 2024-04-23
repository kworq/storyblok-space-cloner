import "dotenv/config";
import FormData from "form-data";

const { SOURCE_SPACE_ID, TARGET_SPACE_ID } = process.env;

export async function uploadFile(targetClient, fileOptions, sourceFilename) {
  const uploadRes = await targetClient.post(
    `/spaces/${TARGET_SPACE_ID}/assets/`,
    fileOptions
  );
  const signed_response_object = uploadRes.data;
  let form = new FormData();
  for (let key in signed_response_object.fields) {
    form.append(key, signed_response_object.fields[key]);
  }
  const buffer = await fetchAssetBuffer(sourceFilename);
  form.append("file", buffer);

  return new Promise((resolve, reject) => {
    form.submit(signed_response_object.post_url, async (err, res) => {
      if (err) throw err;
      try {
        const response = await targetClient.get(
          `spaces/${TARGET_SPACE_ID}/assets/${signed_response_object.id}/finish_upload`
        );

        resolve([sourceFilename, response.data]);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function fetchAssetBuffer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch the file");
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function copyAssets(
  sourceClient,
  targetClient,
  page = 1,
  unique_assets = new Map()
) {
  const f_response = await copyAssetFolders(sourceClient, targetClient);
  // console.log(f_response);
  // return;
  const per_page = 1;
  const a_response = await sourceClient.get(
    `/spaces/${SOURCE_SPACE_ID}/assets/`,
    {
      per_page,
      page,
    }
  );
  const total = a_response.total;
  const sourceAssets = a_response.data.assets ?? [a_response.data];

  // console.log(sourceAssets);
  // return;
  const uploadPromises = [];
  for await (const asset of sourceAssets) {
    const sourceFilename = asset.filename;
    const alt = asset.alt;
    const title = asset.title;
    const fileParts = sourceFilename.split("/");
    const filename = fileParts[fileParts.length - 1];
    const size = fileParts[fileParts.length - 3];
    const asset_folder_id =
      f_response?.get(asset.asset_folder_id)?.target_id ?? 0;
    const is_private = asset.is_private;
    const copyright = asset.copyright;
    const source = asset.source;

    //console.log(asset);
    uploadPromises.push(
      uploadFile(
        targetClient,
        {
          filename,
          size,
          alt,
          title,
          asset_folder_id,
          is_private,
          copyright,
          source,
        },
        sourceFilename
      )
    );
  }
  try {
    const a_response = await Promise.all(uploadPromises);
    console.log(a_response);
    // for (const [sourceFilename, targetAsset] of a_response) {
    //   unique_assets.set(sourceFilename, targetAsset);
    // }
  } catch (error) {
    console.error("Error:", error);
  }
  if (total > page * per_page) {
    console.log("Copying more assets...");
    await copyAssets(sourceClient, targetClient, page + 1, unique_assets);
  }
}

export async function copyAssetFolders(sourceClient, targetClient) {
  const s_response = await sourceClient.get(
    `/spaces/${SOURCE_SPACE_ID}/asset_folders/`,
    {}
  );
  const asset_parent_folders = s_response.data.asset_folders.filter(
    (folder) => folder.parent_id === 0
  );
  const asset_folders = s_response.data.asset_folders.filter(
    (folder) => folder.parent_id !== 0
  );

  const t_response = await targetClient.get(
    `/spaces/${TARGET_SPACE_ID}/asset_folders/`,
    {}
  );
  const targetAssetFolders = t_response.data.asset_folders;

  const unique_parent_folders = new Map();
  for (const folder of asset_parent_folders) {
    const f = targetAssetFolders.find((f) => f.name === folder.name);
    if (f) {
      unique_parent_folders.set(folder.id, {
        ...folder,
        target_id: f.id,
      });
    } else {
      unique_parent_folders.set(folder.id, folder);
    }
  }
  for await (const [key, folder] of unique_parent_folders) {
    if (folder.target_id) continue;
    const res = await targetClient.post(
      `/spaces/${TARGET_SPACE_ID}/asset_folders/`,
      {
        asset_folder: {
          name: folder.name,
          parent_id: folder.parent_id,
        },
      }
    );
    unique_parent_folders.set(folder.id, {
      ...folder,
      target_id: res.data.asset_folder.id,
    });
  }

  const unique_folders = new Map();
  for (const folder of asset_folders) {
    // TODO: Delete folder if it is orphaned. Maybe.
    const f = targetAssetFolders.find(
      (f) =>
        f.name === folder.name &&
        f.parent_id === unique_parent_folders.get(folder.parent_id).target_id
    );
    if (f) {
      unique_folders.set(folder.id, {
        ...folder,
        target_id: f.id,
        target_parent_id: f.parent_id,
      });
    } else {
      unique_folders.set(folder.id, folder);
    }
  }

  for await (const [key, folder] of unique_folders) {
    if (folder.target_id) continue;
    const res = await targetClient.post(
      `/spaces/${TARGET_SPACE_ID}/asset_folders/`,
      {
        asset_folder: {
          name: folder.name,
          parent_id: unique_parent_folders.get(folder.parent_id).target_id,
        },
      }
    );
    unique_folders.set(folder.id, {
      ...folder,
      target_id: res.data.asset_folder.id,
      target_parent_id: res.data.asset_folder.parent_id,
    });
  }

  for (const [key, folder] of unique_parent_folders) {
    unique_folders.set(key, folder);
  }
  return unique_folders;
}
