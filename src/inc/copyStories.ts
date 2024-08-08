import type StoryblokClient from "storyblok-js-client";
import { findValuesByKey, updateValues } from "../utils/assetRefFindReplace";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function copyStories(
  clients: {
    source: { client: StoryblokClient; spaceId: string };
    target: { client: StoryblokClient; spaceId: string };
  },
  NOW: string,
  toDisk = false,
  source_story_folders = new Map(),
  created_count = 0,
  updated_count = 0,
  page = 1
) {
  const { client: sourceClient, spaceId: sourceSpaceId } = clients.source;
  const { client: targetClient, spaceId: targetSpaceId } = clients.target;
  if (!toDisk) {
    const f_response = (
      page === 1
        ? await copyStoryFolders(clients, source_story_folders)
        : { source_story_folders }
    ) as any;
    ({ source_story_folders } = f_response);
    if ("from_total" in f_response && f_response.from_total !== undefined) {
      delete f_response.source_story_folders;
      console.log(f_response);
    }
  }
  const pageLimit = 100;
  const per_page = 25;
  const s_response = await sourceClient.get(
    `/spaces/${sourceSpaceId}/stories/`,
    {
      per_page,
      page,
    }
  );
  const total = s_response.total;
  const source_stories = new Map();
  const sourceStories = s_response.data?.stories ?? [s_response.data.story];

  for await (const s of sourceStories) {
    const s_response = await sourceClient.get(
      `/spaces/${sourceSpaceId}/stories/${s.id}/`,
      {
        story_only: true,
      }
    );

    if (toDisk) {
      const __newdirname = path.join(__dirname, "../backups", NOW, "stories");
      fs.mkdirSync(__newdirname, { recursive: true });
      const story = s_response.data.story;
      const jsonString = JSON.stringify(story, null, 2);
      const fileName = `${story.name}_${story.id}.json`;
      const filePath = path.join(__newdirname, fileName);

      try {
        await fs.promises.writeFile(filePath, jsonString);
        created_count++;
        console.log("Successfully wrote Story JSON to file:", fileName);
      } catch (e) {
        console.error("Error writing file:", e);
      }
      continue;
    }

    source_stories.set(s.id, s_response?.data?.story);
    const filenames = findValuesByKey(
      s_response?.data?.story?.content,
      "filename"
    );
    if (filenames.length > 0) {
      for await (const { ref, key } of filenames) {
        try {
          await updateValues(ref, key, async (value: string) => {
            const filename = value.split("/").pop();
            if (!filename || filename === "") {
              return value;
            }
            const t_response = await targetClient.get(
              `/spaces/${targetSpaceId}/assets/`,
              {
                search: `/${filename}`,
              }
            );

            const assets = t_response.data.assets;
            const t_asset =
              assets.find((asset: typeof assets) => {
                return asset.filename === filename;
              }) ?? assets[0];

            const filename_parts = t_asset.filename.split("/f/");
            const api_url = "https://" + filename_parts[0].split("/").pop();
            const asset_filename = filename_parts[1];
            const image_service_filename = api_url + "/f/" + asset_filename;

            console.log(
              "Filename - found/replaced: ",
              filename,
              " / ",
              image_service_filename
            );

            return image_service_filename;
          });
        } catch (e) {
          // console.error(e);
          console.log(`Target asset not found: ${ref[key]}`);
          continue;
        }
      }
    }

    const t_existing_response = await targetClient.get(
      `/spaces/${targetSpaceId}/stories/`,
      {
        starts_with: s_response?.data?.story.full_slug,
      }
    );
    const s_story = s_response.data.story;
    const story = {
      name: s_story.name,
      slug: s_story.slug,
      path: s_story.path,
      content: s_story.content,
      position: s_story.position,
      is_startpage: s_story.is_startpage,
      is_folder: s_story.is_folder,
      default_root: s_story.default_root,
      disable_fe_editor: s_story.disable_fe_editor,
      parent_id:
        source_story_folders?.get(s_story.parent_id)?.target_id ?? null,
      // group_id,
      first_published_at: s_story.first_published_at,
    };
    let t_response;
    const target_story_id = t_existing_response?.data?.stories?.[0]?.id;
    try {
      if (!target_story_id) {
        t_response = await targetClient.post(
          `/spaces/${targetSpaceId}/stories/`,
          { story }
        );
        created_count++;
        console.log("Created Story", t_response.data.story.full_slug);
      } else {
        t_response = await targetClient.put(
          `/spaces/${targetSpaceId}/stories/${target_story_id}/`,
          { story: { ...story, id: target_story_id } }
        );
        updated_count++;
        console.log("Updated Story", t_response.data.story.full_slug);
      }

      if ("full_slug" in story)
        source_stories.set(story.full_slug, t_response.data.story);
    } catch (e) {
      console.error(e);
    }
  }

  if (total > page * per_page && page <= pageLimit) {
    return await copyStories(
      clients,
      NOW,
      toDisk,
      source_story_folders,
      created_count,
      updated_count,
      ++page
    );
  }

  if (toDisk) {
    return {
      clone_type: "stories",
      files_created: created_count,
      from_total: total,
    };
  }
  return {
    clone_type: "stories",
    created_count,
    updated_count,
    from_total: total,
  };
}

export async function copyStoryFolders(
  clients: {
    source: { client: StoryblokClient; spaceId: string };
    target: { client: StoryblokClient; spaceId: string };
  },
  source_story_folders: Map<string | number, any>,
  created_count = 0,
  updated_count = 0,
  failed_count = 0
) {
  const { client: sourceClient, spaceId: sourceSpaceId } = clients.source;
  const { client: targetClient, spaceId: targetSpaceId } = clients.target;
  const sourceStoryFolders = await getStoryFolders(sourceClient, sourceSpaceId);

  const targetStoryFolders = await getStoryFolders(targetClient, targetSpaceId);

  // Create Top Most Story Folders
  for await (const sf of sourceStoryFolders) {
    const story = {
      name: sf.name,
      slug: sf.slug,
      path: sf.path,
      content: sf.content,
      position: sf.position,
      is_startpage: sf.is_startpage,
      is_folder: sf.is_folder,
      default_root: sf.default_root,
      disable_fe_editor: sf.disable_fe_editor,
      // TODO: group_id
    };

    const tf = targetStoryFolders.find(
      (f: typeof targetStoryFolders) => f.name === sf.name
    );
    if (tf) {
      sf.target_id = tf.id;
      try {
        const t_response = await targetClient.put(
          `/spaces/${targetSpaceId}/stories/${tf.id}/`,
          {
            story: {
              ...story,
              id: tf.id,
            },
          }
        );
        sf.target_id = t_response.data.story.id;
        updated_count++;
      } catch (e) {
        console.error(e);
      }
    } else {
      if (!sf.parent_id) {
        try {
          const t_response = await targetClient.post(
            `/spaces/${targetSpaceId}/stories/`,
            {
              story,
            }
          );
          sf.target_id = t_response.data.story.id;
          created_count++;
        } catch (e) {
          console.error(e);
        }
      }
    }
    source_story_folders.set(sf.id, sf);
  }

  const stories = await createStoryFolders(
    targetClient,
    targetSpaceId,
    source_story_folders,
    created_count,
    updated_count,
    failed_count
  );

  return {
    clone_type: "story_folders",
    created_count: stories.created_count,
    updated_count: stories.updated_count,
    failed_count: stories.failed_count,
    from_total: stories.source_story_folders.size,
    source_story_folders: stories.source_story_folders,
  };
}

export async function createStoryFolders(
  targetClient: StoryblokClient,
  targetSpaceId: string,
  source_story_folders: Map<string | number, any>,
  created_count: number,
  updated_count: number,
  failed_count: number,
  skipped_story_folder_ids = new Set(),
  page = 1
) {
  const max_skips = 10;
  for await (const [key, sf] of source_story_folders) {
    if (!sf.parent_id) continue;
    const target_parent_id = source_story_folders.get(sf.parent_id)?.target_id;
    if (!target_parent_id) {
      const thisStory = { ...(source_story_folders.get(sf.id) ?? {}) };
      const skipped_count = thisStory?.skipped_count ?? 0;
      thisStory.skipped_count = skipped_count + 1;
      source_story_folders.set(sf.id, thisStory);

      if (skipped_count >= max_skips) {
        failed_count++;
        skipped_story_folder_ids.delete(sf.id);
        console.log("FAILED", sf.id, sf.name, failed_count);
        continue;
      }
      skipped_story_folder_ids.add(sf.id);
      console.log("SKIPPED", sf.id, sf.name, skipped_count);
      continue;
    } else if (!source_story_folders.get(sf.id)?.target_id) {
      const story = {
        name: sf.name,
        slug: sf.slug,
        path: sf.path,
        content: sf.content,
        position: sf.position,
        is_startpage: sf.is_startpage,
        is_folder: sf.is_folder,
        default_root: sf.default_root,
        disable_fe_editor: sf.disable_fe_editor,
        parent_id: target_parent_id,
        // TODO: group_id
      };
      const t_response = await targetClient.post(
        `/spaces/${targetSpaceId}/stories/`,
        {
          story: {
            ...story,
            parent_id: target_parent_id,
          },
        }
      );
      sf.target_id = t_response.data.story.id;
      source_story_folders.set(sf.id, sf);
      created_count++;
      if (skipped_story_folder_ids.has(sf.id)) {
        skipped_story_folder_ids.delete(sf.id);
      }
    }
  }
  if (skipped_story_folder_ids.size > 0) {
    return await createStoryFolders(
      targetClient,
      targetSpaceId,
      source_story_folders,
      created_count,
      updated_count,
      failed_count,
      skipped_story_folder_ids,
      ++page
    );
  } else {
    return { source_story_folders, created_count, updated_count, failed_count };
  }
}

export async function getStoryFolders(
  client: StoryblokClient,
  SPACE_ID: string | undefined,
  storyFolders: any = [],
  page = 1
) {
  //console.log("copyStoryFolders page:", page);
  const pageLimit = 100;
  const per_page = 25;
  const response = await client.get(`/spaces/${SPACE_ID}/stories/`, {
    per_page,
    page,
    folder_only: true,
  });

  storyFolders = [
    ...storyFolders,
    ...(response.data?.stories ?? [response.data?.story]),
  ];

  const total = response.total;

  if (total > page * per_page && page <= pageLimit) {
    return await getStoryFolders(client, SPACE_ID, storyFolders, ++page);
  }
  return storyFolders;
}
