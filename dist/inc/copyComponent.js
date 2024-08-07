import "dotenv/config";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const { SOURCE_SPACE_ID, TARGET_SPACE_ID } = process.env;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function copyComponents(sourceClient, targetClient, NOW, toDisk = false, created_count = 0, updated_count = 0) {
    const s_response = await sourceClient.get(`/spaces/${SOURCE_SPACE_ID}/components/`, {});
    const source_components = new Map();
    const source_component_groups = new Map();
    const sourceComponents = s_response.data?.components ?? [s_response.data];
    const sourceGroups = s_response.data?.component_groups ?? [s_response.data];
    if (toDisk) {
        for await (const type of Object.keys(s_response.data)) {
            const __newdirname = path.join(__dirname, "../backups", NOW, type);
            fs.mkdirSync(__newdirname, { recursive: true });
            s_response.data[type].forEach(async (item) => {
                const jsonString = JSON.stringify(item, null, 2);
                const fileName = `${item.name}.json`;
                const filePath = path.join(__newdirname, fileName);
                try {
                    await fs.promises.writeFile(filePath, jsonString);
                    console.log("Successfully wrote Component JSON to file:", fileName);
                }
                catch (e) {
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
    sourceComponents?.forEach((component) => {
        source_components.set(component.name, component);
    });
    sourceGroups?.forEach((component) => {
        source_component_groups.set(component.name, component);
    });
    const t_response = await targetClient.get(`/spaces/${TARGET_SPACE_ID}/components/`, {});
    const target_components = new Map();
    const target_component_groups = new Map();
    const targetComponents = t_response.data.components ?? [t_response.data];
    const targetGroups = t_response.data.component_groups ?? [t_response.data];
    targetComponents?.forEach((component) => {
        target_components.set(component.name, component);
    });
    targetGroups?.forEach((component) => {
        target_component_groups.set(component.name, component);
    });
    for await (const [key, _component_group] of source_component_groups) {
        const { name } = _component_group;
        const component_group = { name };
        const endpoint = `/spaces/${TARGET_SPACE_ID}/component_groups/`;
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
                console.log(`Status: ${res.status} Updated component group id: ${id} name: ${name}`);
                target_component_groups.set(name, res.data.component_group);
                updated_count++;
            }
            catch (e) {
                console.error(e);
            }
        }
        else {
            try {
                const res = await targetClient.post(endpoint, {
                    component_group: {
                        ...component_group,
                    },
                });
                const { id, name } = res.data.component_group;
                console.log(`Status: ${res.status} Created component group id: ${id} name: ${name}`);
                target_component_groups.set(name, res.data.component_group);
                created_count++;
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    // Update parent_id for component groups
    for await (const [key, component_group] of source_component_groups) {
        const endpoint = `/spaces/${TARGET_SPACE_ID}/component_groups/`;
        const component_group_id = target_component_groups.get(key)?.id;
        const component_group_parent_id = source_component_groups.get(key)?.parent_id;
        if (!component_group_parent_id) {
            continue;
        }
        const sourceGroupArray = Array.from(source_component_groups);
        const componentGroupParentName = sourceGroupArray.find(([name, group]) => {
            return group.id === component_group_parent_id;
        })?.[0];
        const targetComponentGroupParentId = target_component_groups.get(componentGroupParentName)?.id;
        try {
            const res = await targetClient.put(`${endpoint}${component_group_id}`, {
                component_group: {
                    ...component_group,
                    parent_id: targetComponentGroupParentId,
                },
            });
            target_component_groups.set(key, res.data.component_group);
            const { id, name } = res.data.component_group;
            console.log(`Status: ${res.status} Updated parent_id ${targetComponentGroupParentId} for component group id: ${id} name: ${name}`);
            //updated_count++;
        }
        catch (e) {
            console.error(e);
        }
    }
    // Create or update components
    for await (const [key, _component] of source_components) {
        const { name, display_name, schema, image, is_root, is_nestable } = _component;
        const sourceComponentGroupParentName = Array.from(source_component_groups).find(([name, group]) => {
            return group.uuid === _component.component_group_uuid;
        })?.[0];
        const component_group_uuid = target_component_groups.get(sourceComponentGroupParentName)?.uuid;
        const component = {
            name,
            display_name,
            schema,
            image,
            is_root,
            is_nestable,
            component_group_uuid,
        };
        const endpoint = `/spaces/${TARGET_SPACE_ID}/components/`;
        const component_id = target_components.get(key)?.id;
        if (component_id) {
            try {
                const res = await targetClient.put(`${endpoint}${component_id}`, {
                    component: { ...component, id: component_id },
                });
                const { id, name } = res.data.component;
                target_components.set(name, res.data.component);
                console.log(`Status: ${res.status} Updated component id: ${id} name: ${name}`);
                updated_count++;
            }
            catch (e) {
                console.error(e);
            }
        }
        else {
            try {
                const res = await targetClient.post(endpoint, {
                    component,
                });
                const { id, name } = res.data.component;
                target_components.set(name, res.data.component);
                console.log(`Status: ${res.status} Created component id: ${id} name: ${name}`);
                created_count++;
            }
            catch (e) {
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
//# sourceMappingURL=copyComponent.js.map