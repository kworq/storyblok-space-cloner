import FormData from "form-data";
import type StoryblokClient from "storyblok-js-client";

export async function copyAssets(
  clients: {
    source: { client: StoryblokClient; spaceId: string };
    target: { client: StoryblokClient; spaceId: string };
  },
  created_count = 0,
  skipped_count = 0,
  page = 1,
  unique_assets = new Map()
) {
  const { source, target } = clients;
  const f_response = await copyAssetFolders(clients);
  // console.log(f_response);
  // return;
  const pageLimit = 100;
  const per_page = 25;
  const s_response = await source.client.get(
    `/spaces/${source.spaceId}/assets/`,
    {
      per_page,
      page,
    }
  );
  const total = s_response.total;
  const sourceAssets = s_response.data.assets ?? [s_response.data];

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

    //return;
    //console.log(asset);
    const t_response = await target.client.get(
      `/spaces/${target.spaceId}/assets/`,
      {
        search: `/${filename}`,
      }
    );
    if (t_response.data.assets.length) {
      console.log(
        `Status: ${200} Skipped asset filename: ${filename} already exists`
      );
      skipped_count++;
      continue;
    }
    uploadPromises.push(
      uploadFile(target, sourceFilename, {
        filename,
        size,
        alt,
        title,
        asset_folder_id,
        is_private,
        copyright,
        source,
      })
    );
  }
  try {
    const a_response = await Promise.all(uploadPromises);
    //console.log(a_response);
    created_count += a_response.length;
    for (const [sourceFilename, targetAsset] of a_response) {
      unique_assets.set(sourceFilename, targetAsset);
    }
  } catch (error) {
    console.error("Error:", error);
  }
  if (total > page * per_page && page <= pageLimit) {
    console.log("Copying more assets...");
    return await copyAssets(
      clients,
      created_count,
      skipped_count,
      page + 1,
      unique_assets
    );
  } else {
    return {
      clone_type: "assets",
      created_count,
      skipped_count,
      from_total: total,
    };
  }
}

export async function uploadFile(
  target: { client: StoryblokClient; spaceId: string },
  sourceFilename: string,
  fileOptions: Record<string, any>
): Promise<[string, any]> {
  const uploadRes = await target.client.post(
    `/spaces/${target.spaceId}/assets/`,
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
        const response = await target.client.get(
          `spaces/${target.spaceId}/assets/${signed_response_object.id}/finish_upload`
        );
        //console.log(response);
        console.log(
          `Status: ${200} Created asset id: ${response.data.id} filename: ${
            response.data.filename
          }`
        );
        resolve([sourceFilename, response.data]);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function fetchAssetBuffer(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch the file");
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function copyAssetFolders(clients: {
  source: { client: StoryblokClient; spaceId: string };
  target: { client: StoryblokClient; spaceId: string };
}) {
  const { source, target } = clients;
  const s_response = await source.client.get(
    `/spaces/${source.spaceId}/asset_folders/`,
    {}
  );
  const sourceAssetFolders = s_response.data.asset_folders;
  const asset_parent_folders = sourceAssetFolders.filter(
    (folder: typeof sourceAssetFolders) => folder.parent_id === 0
  );

  const asset_folders = sourceAssetFolders.filter(
    (folder: typeof sourceAssetFolders) => folder.parent_id !== 0
  );

  const t_response = await target.client.get(
    `/spaces/${target.spaceId}/asset_folders/`,
    {}
  );
  const targetAssetFolders = t_response.data.asset_folders;

  const unique_parent_folders = new Map();
  for (const folder of asset_parent_folders) {
    const f = targetAssetFolders.find(
      (f: typeof targetAssetFolders) => f.name === folder.name
    );
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
    const res = await target.client.post(
      `/spaces/${target.spaceId}/asset_folders/`,
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
      (f: typeof targetAssetFolders) =>
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
    const res = await target.client.post(
      `/spaces/${target.spaceId}/asset_folders/`,
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
