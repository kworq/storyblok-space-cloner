import "dotenv/config";
import { get } from "http";
import { start } from "repl";

const { SOURCE_SPACE_ID, TARGET_SPACE_ID } = process.env;

export async function copyStories(
  sourceClient,
  targetClient,
  created_count = 0,
  updated_count = 0,
  page = 1
) {
  const f_response = await copyStoryFolders(sourceClient, targetClient);
  console.log(f_response);
  return;
  const pageLimit = 2;
  const per_page = 5;
  const s_response = await sourceClient.get(
    `/spaces/${SOURCE_SPACE_ID}/stories/`,
    {
      per_page,
      page,
      //starts_with: "home",
    }
  );
  const source_stories = new Map();
  const sourceStories = s_response.data?.stories ?? [s_response.data.story];

  for await (const s of sourceStories) {
    const s_response = await sourceClient.get(
      `/spaces/${SOURCE_SPACE_ID}/stories/${s.id}/`,
      {}
    );
    source_stories.set(s.full_slug, s_response?.data?.story);
    console.log("SOURCE STORY", s_response.data.story);
    const {
      name,
      slug,
      path,
      content,
      position,
      is_startpage,
      is_folder,
      default_root,
      disable_fe_editor,
      //   parent_id,
      //   group_id,
      first_published_at,
    } = s_response.data.story;
    const story = {
      name,
      slug,
      path,
      content,
      position,
      is_startpage,
      is_folder,
      default_root,
      disable_fe_editor,
      //   parent_id,
      //   group_id,
      first_published_at,
    };

    const t_response = await targetClient.post(
      `/spaces/${TARGET_SPACE_ID}/stories/`,
      { story }
    );
    console.log("TARGET STORY", t_response);
    // source_stories.set(story.full_slug, t_response.data.story);
  }

  return {
    clone_type: "stories",
    created: created_count,
    updated: updated_count,
    from_total: sourceStories.length,
  };
}

export async function copyStoryFolders(
  sourceClient,
  targetClient,
  created_count = 0,
  updated_count = 0,
  failed_count = 0,
  source_story_folders = new Map()
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

    const tf = targetStoryFolders.find((f) => f.name === sf.name);
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
  };
}

export async function createStoryFolders(
  sourceClient,
  targetClient,
  source_story_folders,
  created_count,
  updated_count,
  failed_count,
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
  client,
  SPACE_ID,
  storyFolders = [],
  page = 1
) {
  console.log("copyStoryFolders page:", page);
  const pageLimit = 100;
  const per_page = 2;
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
