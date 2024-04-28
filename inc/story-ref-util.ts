import "dotenv/config";
import type StoryblokClient from "storyblok-js-client";
import {
  findUUIDs,
  getFullSlugUUIDs,
  replaceUUIDs,
} from "../utils/story-ref-update";

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

    const uuids_to_be_replaced = findUUIDs(s_response?.data?.story?.content);
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
      continue;
    }

    replaceUUIDs(s_response?.data?.story?.content, uuidMapping);

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
      parent_id: t_existing_response?.data?.stories?.[0]?.parent_id ?? null,
      // group_id,
      first_published_at: s_story.first_published_at,
    };
    let t_response;
    const target_story_id = t_existing_response?.data?.stories?.[0]?.id;
    try {
      if (target_story_id) {
        t_response = await targetClient.put(
          `/spaces/${TARGET_SPACE_ID}/stories/${target_story_id}/`,
          { story: { ...story, id: target_story_id } }
        );
        updated_count++;
        console.log("Updated Story", t_response.data.story.full_slug);
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
    clone_type: "stories",
    created_count,
    updated_count,
    from_total: total,
  };
}
