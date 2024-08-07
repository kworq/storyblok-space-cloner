import "dotenv/config";
import type StoryblokClient from "storyblok-js-client";
export declare function copyAssets(sourceClient: StoryblokClient, targetClient: StoryblokClient, created_count?: number, skipped_count?: number, page?: number, unique_assets?: Map<any, any>): Promise<{
    clone_type: string;
    created_count: number;
    skipped_count: number;
    from_total: any;
}>;
export declare function uploadFile(targetClient: StoryblokClient, sourceFilename: string, fileOptions: Record<string, any>): Promise<[string, any]>;
export declare function fetchAssetBuffer(url: string): Promise<Buffer | undefined>;
export declare function copyAssetFolders(sourceClient: StoryblokClient, targetClient: StoryblokClient): Promise<Map<any, any>>;
