import "dotenv/config";
import type StoryblokClient from "storyblok-js-client";
import {
  findUUIDs,
  getFullSlugUUIDs,
  replaceUUIDs,
} from "../utils/storyRefFindReplace";

const { SOURCE_SPACE_ID, TARGET_SPACE_ID } = process.env;

export async function copyRefStories(
  sourceClient: StoryblokClient,
  targetClient: StoryblokClient,
  source_story_folders = new Map(),
  created_count = 0,
  updated_count = 0,
  page = 1,
  uuidMapping = {}
) {
  const pageLimit = 100;
  const per_page = 25;
  const t_response = await targetClient.get(
    `/spaces/${TARGET_SPACE_ID}/stories/`,
    {
      per_page,
      page,
    }
  );
  const total = t_response.total;
  const sourceStories = t_response.data?.stories ?? [t_response.data.story];

  for await (const s of sourceStories) {
    const t_response = await targetClient.get(
      `/spaces/${TARGET_SPACE_ID}/stories/${s.id}/`,
      {
        story_only: true,
      }
    );
    const t_story = t_response.data.story;
    console.log("Processing Story", t_story.full_slug);
    const uuids_to_be_replaced = findUUIDs(t_response?.data?.story?.content);
    if (!uuids_to_be_replaced.length) {
      continue;
    }

    const { mappingChanged } = await getFullSlugUUIDs(
      uuids_to_be_replaced,
      uuidMapping,
      async (uuid: string) => {
        const response = await sourceClient.get(
          `/spaces/${SOURCE_SPACE_ID}/stories/`,
          {
            by_uuids: uuid,
          }
        );

        return response.data.stories?.[0]?.full_slug;
      },
      async (fullSlug: string) => {
        const response = await targetClient.get(
          `/spaces/${TARGET_SPACE_ID}/stories/`,
          {
            starts_with: fullSlug,
          }
        );
        return response.data.stories?.[0]?.uuid;
      }
    );

    if (!mappingChanged) {
      console.log("No new UUIDs found");
    }

    replaceUUIDs(t_story.content, uuidMapping);

    const story = {
      name: t_story.name,
      slug: t_story.slug,
      path: t_story.path,
      content: t_story.content,
      position: t_story.position,
      is_startpage: t_story.is_startpage,
      is_folder: t_story.is_folder,
      default_root: t_story.default_root,
      disable_fe_editor: t_story.disable_fe_editor,
      parent_id: t_story.parent_id ?? null,
      // group_id,
      first_published_at: t_story.first_published_at,
    };
    let t_updated_response;
    const target_story_id = t_story.id;
    try {
      if (target_story_id) {
        t_updated_response = await targetClient.put(
          `/spaces/${TARGET_SPACE_ID}/stories/${target_story_id}/`,
          { story: { ...story, id: target_story_id } }
        );
        updated_count++;
        console.log("Updated Story", t_updated_response.data.story.full_slug);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (total > page * per_page && page <= pageLimit) {
    return await copyRefStories(
      sourceClient,
      targetClient,
      source_story_folders,
      created_count,
      updated_count,
      ++page,
      uuidMapping
    );
  }

  console.log("UUID Mapping: ", uuidMapping);

  return {
    clone_type: "story refs",
    created_count,
    updated_count,
    from_total: total,
  };
}
