import type StoryblokClient from "storyblok-js-client";
export declare function copyComponents(clients: {
    source: {
        client: StoryblokClient;
        spaceId: string;
    };
    target: {
        client: StoryblokClient;
        spaceId: string;
    };
}, NOW: string, toDisk: boolean | undefined, toDiskPath: string, fromDisk: {
    path: string;
} | undefined, created_count?: number, updated_count?: number): Promise<{
    clone_type: string;
    files_created: number;
    components_copied: number;
    component_groups_copied: number;
    created?: undefined;
    updated?: undefined;
    from_total?: undefined;
} | {
    clone_type: string;
    created: number;
    updated: number;
    from_total: number;
    files_created?: undefined;
    components_copied?: undefined;
    component_groups_copied?: undefined;
}>;
