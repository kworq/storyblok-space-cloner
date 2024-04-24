import "dotenv/config";

const { SOURCE_SPACE_ID, TARGET_SPACE_ID } = process.env;

const pageLimit = 2;
const per_page = 5;

export async function copyComponents(
  sourceClient,
  targetClient,
  create_count = 0,
  update_count = 0
) {
  const s_response = await sourceClient.get(
    `/spaces/${SOURCE_SPACE_ID}/components/`,
    {}
  );
  const source_components = new Map();
  const sourceComponents = s_response.data?.components ?? [s_response.data];
  // console.log(sourceComponents);
  // return;
  sourceComponents?.forEach((component) => {
    source_components.set(component.name, component);
  });

  const t_response = await targetClient.get(
    `/spaces/${TARGET_SPACE_ID}/components/`,
    {}
  );
  const target_components = new Map();
  const targetComponents = t_response.data.components ?? [t_response.data];
  targetComponents?.forEach((component) => {
    target_components.set(component.name, component);
  });
  for await (const [key, _component] of source_components) {
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
    const endpoint = `/spaces/${TARGET_SPACE_ID}/components/`;
    const component_id = target_components.get(key)?.id;
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
    clone_type: "components",
    created: create_count,
    updated: update_count,
    from_total: sourceComponents.length,
  };
}
