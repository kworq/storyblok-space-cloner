import "dotenv/config";
import type StoryblokClient from "storyblok-js-client";
import { findValuesByKey, updateValues } from "../utils/objectReplace";

const { SOURCE_SPACE_ID, TARGET_SPACE_ID } = process.env;

export async function copyStories(
  sourceClient: StoryblokClient,
  targetClient: StoryblokClient,
  source_story_folders = new Map(),
  created_count = 0,
  updated_count = 0,
  page = 1
) {
  const f_response = (
    page === 1
      ? await copyStoryFolders(sourceClient, targetClient, source_story_folders)
      : { source_story_folders }
  ) as any;
  ({ source_story_folders } = f_response);
  if ("from_total" in f_response && f_response.from_total !== undefined) {
    delete f_response.source_story_folders;
    console.log(f_response);
  }
  const pageLimit = 100;
  const per_page = 25;
  const s_response = await sourceClient.get(
    `/spaces/${SOURCE_SPACE_ID}/stories/`,
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
      `/spaces/${SOURCE_SPACE_ID}/stories/${s.id}/`,
      {
        story_only: true,
      }
    );
    source_stories.set(s.id, s_response?.data?.story);
    const filenames = findValuesByKey(
      s_response?.data?.story?.content,
      "filename"
    );
    if (filenames.length > 0) {
      for await (const { ref, key } of filenames) {
        await updateValues(ref, key, async (value: string) => {
          const filename = value.split("/").pop();
          const t_response = await targetClient.get(
            `/spaces/${TARGET_SPACE_ID}/assets/`,
            {
              search: `${filename}`,
            }
          );
          console.log("Filename replaced: ", filename);
          const t_asset = t_response.data.assets[0];
          return t_asset.filename;
        });
      }
    }

    const t_existing_response = await targetClient.get(
      `/spaces/${TARGET_SPACE_ID}/stories/`,
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
          `/spaces/${TARGET_SPACE_ID}/stories/`,
          { story }
        );
        created_count++;
        console.log("Created Story", t_response.data.story.full_slug);
      } else {
        t_response = await targetClient.put(
          `/spaces/${TARGET_SPACE_ID}/stories/${target_story_id}/`,
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
      sourceClient,
      targetClient,
      source_story_folders,
      created_count,
      updated_count,
      ++page
    );
  }

  return {
    clone_type: "stories",
    created_count,
    updated_count,
    from_total: total,
  };
}

export async function copyStoryFolders(
  sourceClient: StoryblokClient,
  targetClient: StoryblokClient,
  source_story_folders: Map<string | number, any>,
  created_count = 0,
  updated_count = 0,
  failed_count = 0
) {
  const sourceStoryFolders = await getStoryFolders(
    sourceClient,
    SOURCE_SPACE_ID
  );

  const targetStoryFolders = await getStoryFolders(
    targetClient,
    TARGET_SPACE_ID
  );

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
          `/spaces/${TARGET_SPACE_ID}/stories/${tf.id}/`,
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
            `/spaces/${TARGET_SPACE_ID}/stories/`,
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
    sourceClient,
    targetClient,
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
  sourceClient: StoryblokClient,
  targetClient: StoryblokClient,
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
        `/spaces/${TARGET_SPACE_ID}/stories/`,
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
      sourceClient,
      targetClient,
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
  SPACE_ID: string,
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
