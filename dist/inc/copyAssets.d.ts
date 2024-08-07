import type StoryblokClient from "storyblok-js-client";
export declare function copyAssets(clients: {
    source: {
        client: StoryblokClient;
        spaceId: string;
    };
    target: {
        client: StoryblokClient;
        spaceId: string;
    };
}, created_count?: number, skipped_count?: number, page?: number, unique_assets?: Map<any, any>): Promise<{
    clone_type: string;
    created_count: number;
    skipped_count: number;
    from_total: any;
}>;
export declare function uploadFile(target: {
    client: StoryblokClient;
    spaceId: string;
}, sourceFilename: string, fileOptions: Record<string, any>): Promise<[string, any]>;
export declare function fetchAssetBuffer(url: string): Promise<Buffer | undefined>;
export declare function copyAssetFolders(clients: {
    source: {
        client: StoryblokClient;
        spaceId: string;
    };
    target: {
        client: StoryblokClient;
        spaceId: string;
    };
}): Promise<Map<any, any>>;
