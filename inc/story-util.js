import "dotenv/config";

const { SOURCE_SPACE_ID, TARGET_SPACE_ID } = process.env;

export async function copyStories(
  sourceClient,
  targetClient,
  created_count = 0,
  updated_count = 0,
  page = 1
) {
  const pageLimit = 2;
  const per_page = 5;
  const s_response = await sourceClient.get(
    `/spaces/${SOURCE_SPACE_ID}/stories/`,
    {
      per_page,
      page,
      starts_with: "work",
    }
  );
  const source_stories = new Map();
  const sourceStories = s_response.data?.stories ?? [s_response.data];
  console.log(sourceStories);
  return;
  sourceStories?.forEach((component) => {
    source_stories.set(component.name, component);
  });

  const t_response = await targetClient.get(
    `/spaces/${TARGET_SPACE_ID}/stories/`,
    {}
  );
  const target_stories = new Map();
  const targetStories = t_response.data.stories ?? [t_response.data];
  targetStories?.forEach((component) => {
    target_stories.set(component.name, component);
  });
  let create_count = 0;
  let update_count = 0;
  for await (const [key, _component] of source_stories) {
    const { name, display_name, schema, image, is_root, is_nestable } =
      _component;
    const component = {
      name,
      display_name,
      schema,
      image,
      is_root,
      is_nestable,
    };
    const endpoint = `/spaces/${TARGET_SPACE_ID}/stories/`;
    const component_id = target_stories.get(key)?.id;
    if (component_id) {
      try {
        const res = await targetClient.put(`${endpoint}${component_id}`, {
          component: { ...component, id: component_id },
        });
        const { id, name } = res.data.component;
        console.log(
          `Status: ${res.status} Updated component id: ${id} name: ${name}`
        );
        update_count++;
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const res = await targetClient.post(endpoint, {
          component,
        });
        const { id, name } = res.data.component;
        console.log(
          `Status: ${res.status} Created component id: ${id} name: ${name}`
        );
        create_count++;
      } catch (e) {
        console.error(e);
      }
    }
  }

  return {
    clone_type: "stories",
    created: create_count,
    updated: update_count,
    from_total: sourceStories.length,
  };
}
