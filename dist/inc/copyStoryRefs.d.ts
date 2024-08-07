import "dotenv/config";
import type StoryblokClient from "storyblok-js-client";
export declare function copyRefStories(sourceClient: StoryblokClient, targetClient: StoryblokClient, source_story_folders?: Map<any, any>, created_count?: number, updated_count?: number, page?: number, uuidMapping?: {}): Promise<{
    clone_type: string;
    created_count: number;
    updated_count: number;
    from_total: any;
}>;
