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
  source_story_folders = new Map(),
  sourceStoryFolders = [],
  page = 1
) {
  console.log("copyStoryFolders page:", page);
  const pageLimit = 100;
  const per_page = 2;
  const s_response = await sourceClient.get(
    `/spaces/${SOURCE_SPACE_ID}/stories/`,
    {
      per_page,
      page,
      folder_only: true,
    }
  );

  sourceStoryFolders = [
    ...sourceStoryFolders,
    ...(s_response.data?.stories ?? [s_response.data?.story]),
  ];

  const total = s_response.total;

  if (total > page * per_page && page <= pageLimit) {
    return await copyStoryFolders(
      sourceClient,
      targetClient,
      source_story_folders,
      sourceStoryFolders,
      ++page
    );
  }

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
    if (!sf.parent_id) {
      try {
        const t_response = await targetClient.post(
          `/spaces/${TARGET_SPACE_ID}/stories/`,
          {
            story,
          }
        );
        sf.target_id = t_response.data.story.id;
      } catch (e) {
        console.error(e);
      }
    }
    source_story_folders.set(sf.id, sf);
  }
  console.log("source_story_folders", source_story_folders);
  source_story_folders = await getStoryFolders(
    sourceClient,
    targetClient,
    source_story_folders
  );

  return {
    clone_type: "story_folders",
    from_total: source_story_folders.size,
  };

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

export async function getStoryFolders(
  sourceClient,
  targetClient,
  source_story_folders,
  skipped_story_folder_ids = new Set(),
  failed_count = 0,
  page = 1
) {
  const max_skips = 10;
  for await (const [key, sf] of source_story_folders) {
    // console.log("parent_id", sf.parent_id === 0);
    // return;
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
    }
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
    if (skipped_story_folder_ids.has(sf.id)) {
      skipped_story_folder_ids.delete(sf.id);
    }
  }
  //   if (skipped_story_folder_ids.size > 0) {
  //     return await getStoryFolders(
  //       sourceClient,
  //       targetClient,
  //       source_story_folders,
  //       skipped_story_folder_ids,
  //       failed_count,
  //       ++page
  //     );
  //   } else {
  return source_story_folders;
  //}
}
