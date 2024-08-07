import "dotenv/config";
import type StoryblokClient from "storyblok-js-client";
export declare function copyStories(sourceClient: StoryblokClient, targetClient: StoryblokClient, NOW: string, toDisk?: boolean, source_story_folders?: Map<any, any>, created_count?: number, updated_count?: number, page?: number): Promise<{
    clone_type: string;
    files_created: number;
    from_total: any;
    created_count?: undefined;
    updated_count?: undefined;
} | {
    clone_type: string;
    created_count: number;
    updated_count: number;
    from_total: any;
    files_created?: undefined;
}>;
export declare function copyStoryFolders(sourceClient: StoryblokClient, targetClient: StoryblokClient, source_story_folders: Map<string | number, any>, created_count?: number, updated_count?: number, failed_count?: number): Promise<{
    clone_type: string;
    created_count: number;
    updated_count: number;
    failed_count: number;
    from_total: number;
    source_story_folders: Map<string | number, any>;
}>;
export declare function createStoryFolders(sourceClient: StoryblokClient, targetClient: StoryblokClient, source_story_folders: Map<string | number, any>, created_count: number, updated_count: number, failed_count: number, skipped_story_folder_ids?: Set<unknown>, page?: number): Promise<{
    source_story_folders: Map<string | number, any>;
    created_count: number;
    updated_count: number;
    failed_count: number;
}>;
export declare function getStoryFolders(client: StoryblokClient, SPACE_ID: string | undefined, storyFolders?: any, page?: number): Promise<any>;
