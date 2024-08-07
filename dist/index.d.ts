interface Config {
    SOURCE_OAUTH_TOKEN: string;
    TARGET_OAUTH_TOKEN: string;
    SOURCE_SPACE_ID: string;
    TARGET_SPACE_ID: string;
    API_ENDPOINT: string;
    API_REGION: string;
}
export default class StoryblokSpaceCloner {
    config: Config;
    constructor(config: Config);
    copy(options: {
        assets?: boolean | {
            toDisk: boolean;
        };
        components?: boolean | {
            toDisk: boolean;
        };
        stories?: boolean | {
            toDisk: boolean;
        };
    }): Promise<void>;
}
export {};
