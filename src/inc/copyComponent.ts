import type StoryblokClient from "storyblok-js-client";
import path from "path";
import fs from "fs";

export async function copyComponents(
  clients: {
    source: { client: StoryblokClient; spaceId: string };
    target: { client: StoryblokClient; spaceId: string };
  },
  NOW: string,
  toDisk = false,
  toDiskPath: string,
  fromDisk: { path: string } | undefined,
  created_count = 0,
  updated_count = 0
) {
  const { client: sourceClient, spaceId: sourceSpaceId } = clients.source;
  const { client: targetClient, spaceId: targetSpaceId } = clients.target;

  let sourceComponents: { name: string }[] = [];
  let sourceGroups: { name: string }[] = [];

  if (!fromDisk) {
    const s_response = await sourceClient.get(
      `/spaces/${sourceSpaceId}/components/`,
      {}
    );

    sourceComponents = s_response.data?.components ?? [s_response.data];
    sourceGroups = s_response.data?.component_groups ?? [s_response.data];

    if (toDisk) {
      for await (const type of Object.keys(s_response.data)) {
        const __newdirname = path.join(toDiskPath, NOW, type);
        fs.mkdirSync(__newdirname, { recursive: true });
        s_response.data[type].forEach(async (item: typeof s_response.data) => {
          const jsonString = JSON.stringify(item, null, 2);
          const fileName = `${item.name}.json`;
          const filePath = path.join(__newdirname, fileName);

          try {
            await fs.promises.writeFile(filePath, jsonString);
            console.log("Successfully wrote Component JSON to file:", fileName);
          } catch (e) {
            console.error("Error writing file:", e);
          }
        });
      }

      return {
        clone_type: "components",
        files_created: created_count,
        components_copied: sourceComponents.length,
        component_groups_copied: sourceGroups.length,
      };
    }
  } else {
    const fromDiskPath = fromDisk.path;
    sourceComponents = fs
      .readdirSync(`${fromDiskPath}/components`)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const filePath = path.join(fromDiskPath, "components", file);
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      });
    sourceGroups = fs
      .readdirSync(`${fromDiskPath}/component_groups`)
      .map((file) => {
        const filePath = path.join(fromDiskPath, "component_groups", file);
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      });
  }

  const source_components = new Map();
  const source_component_groups = new Map();
  sourceComponents?.forEach((component) => {
    source_components.set(component.name, component);
  });
  sourceGroups?.forEach((component) => {
    source_component_groups.set(component.name, component);
  });

  const t_response = await targetClient.get(
    `/spaces/${targetSpaceId}/components/`,
    {}
  );
  const target_components = new Map();
  const target_component_groups = new Map();
  const targetComponents = t_response.data.components ?? [t_response.data];
  const targetGroups = t_response.data.component_groups ?? [t_response.data];
  targetComponents?.forEach((component: typeof targetComponents) => {
    target_components.set(component.name, component);
  });
  targetGroups?.forEach((component: typeof targetGroups) => {
    target_component_groups.set(component.name, component);
  });

  for await (const [key, _component_group] of source_component_groups) {
    const { name } = _component_group;
    const component_group = { name };
    const endpoint = `/spaces/${targetSpaceId}/component_groups/`;
    const t_group = target_component_groups.get(key);
    const component_group_id = t_group?.id;
    if (component_group_id) {
      try {
        const res = await targetClient.put(`${endpoint}${component_group_id}`, {
          component_group: {
            ...component_group,
            id: component_group_id,
            parent_id: t_group.parent_id,
          },
        });
        const { id, name } = res.data.component_group;
        console.log(
          `Status: ${res.status} Updated component group id: ${id} name: ${name}`
        );
        target_component_groups.set(name, res.data.component_group);
        updated_count++;
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const res = await targetClient.post(endpoint, {
          component_group: {
            ...component_group,
          },
        });
        const { id, name } = res.data.component_group;
        console.log(
          `Status: ${res.status} Created component group id: ${id} name: ${name}`
        );
        target_component_groups.set(name, res.data.component_group);
        created_count++;
      } catch (e) {
        console.error(e);
      }
    }
  }

  // Update parent_id for component groups
  for await (const [key, component_group] of source_component_groups) {
    const endpoint = `/spaces/${targetSpaceId}/component_groups/`;
    const component_group_id = target_component_groups.get(key)?.id;
    const component_group_parent_id =
      source_component_groups.get(key)?.parent_id;

    if (!component_group_parent_id) {
      continue;
    }

    const sourceGroupArray = Array.from(source_component_groups);

    const componentGroupParentName = sourceGroupArray.find(([name, group]) => {
      return group.id === component_group_parent_id;
    })?.[0];

    const targetComponentGroupParentId = target_component_groups.get(
      componentGroupParentName
    )?.id;
    try {
      const res = await targetClient.put(`${endpoint}${component_group_id}`, {
        component_group: {
          ...component_group,
          parent_id: targetComponentGroupParentId,
        },
      });
      target_component_groups.set(key, res.data.component_group);
      const { id, name } = res.data.component_group;

      console.log(
        `Status: ${res.status} Updated parent_id ${targetComponentGroupParentId} for component group id: ${id} name: ${name}`
      );
      //updated_count++;
    } catch (e) {
      console.error(e);
    }
  }

  // Create or update components
  for await (const [key, _component] of source_components) {
    const { name, display_name, schema, image, is_root, is_nestable } =
      _component;

    const sourceComponentGroupParentName = Array.from(
      source_component_groups
    ).find(([name, group]) => {
      return group.uuid === _component.component_group_uuid;
    })?.[0];
    const component_group_uuid = target_component_groups.get(
      sourceComponentGroupParentName
    )?.uuid;

    const component = {
      ..._component,
      component_group_uuid,
      created_at: undefined,
      updated_at: undefined,
    };
    const endpoint = `/spaces/${targetSpaceId}/components/`;
    const component_id = target_components.get(key)?.id;
    if (component_id) {
      try {
        const res = await targetClient.put(`${endpoint}${component_id}`, {
          component: { ...component, id: component_id },
        });
        const { id, name } = res.data.component;
        target_components.set(name, res.data.component);
        console.log(
          `Status: ${res.status} Updated component id: ${id} name: ${name}`
        );
        updated_count++;
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const res = await targetClient.post(endpoint, {
          component,
        });
        const { id, name } = res.data.component;
        target_components.set(name, res.data.component);
        console.log(
          `Status: ${res.status} Created component id: ${id} name: ${name}`
        );
        created_count++;
      } catch (e) {
        console.error(e);
      }
    }
  }

  return {
    clone_type: "components / component_groups",
    created: created_count,
    updated: updated_count,
    from_total: sourceComponents.length + sourceGroups.length,
  };
}
