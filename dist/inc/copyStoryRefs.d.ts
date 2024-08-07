import type StoryblokClient from "storyblok-js-client";
export declare function copyRefStories(clients: {
    source: {
        client: StoryblokClient;
        spaceId: string;
    };
    target: {
        client: StoryblokClient;
        spaceId: string;
    };
}, source_story_folders?: Map<any, any>, created_count?: number, updated_count?: number, page?: number, uuidMapping?: {}): Promise<{
    clone_type: string;
    created_count: number;
    updated_count: number;
    from_total: any;
}>;
