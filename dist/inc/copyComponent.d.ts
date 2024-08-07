import "dotenv/config";
import type StoryblokClient from "storyblok-js-client";
export declare function copyComponents(sourceClient: StoryblokClient, targetClient: StoryblokClient, NOW: string, toDisk?: boolean, created_count?: number, updated_count?: number): Promise<{
    clone_type: string;
    files_created: number;
    components_copied: any;
    component_groups_copied: any;
    created?: undefined;
    updated?: undefined;
    from_total?: undefined;
} | {
    clone_type: string;
    created: number;
    updated: number;
    from_total: any;
    files_created?: undefined;
    components_copied?: undefined;
    component_groups_copied?: undefined;
}>;
