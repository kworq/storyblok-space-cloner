declare global {
    interface StoryblokSpaceClonerConfig {
        SOURCE_OAUTH_TOKEN: string;
        TARGET_OAUTH_TOKEN: string;
        SOURCE_SPACE_ID: string;
        TARGET_SPACE_ID: string;
        API_ENDPOINT: string;
        API_REGION: string;
        SOURCE_API_ENDPOINT?: string;
        SOURCE_API_REGION?: string;
        TARGET_API_ENDPOINT?: string;
        TARGET_API_REGION?: string;
        TO_DISK_PATH?: string;
    }
}
export default class StoryblokSpaceCloner {
    toDiskPath: string;
    config: StoryblokSpaceClonerConfig;
    constructor(config: StoryblokSpaceClonerConfig);
    copy(options: {
        assets?: boolean | {
            toDisk?: boolean;
        };
        components?: boolean | {
            toDisk?: boolean;
            fromDisk?: {
                path: string;
            };
        };
        stories?: boolean | {
            toDisk?: boolean;
        };
    }): Promise<void>;
}
