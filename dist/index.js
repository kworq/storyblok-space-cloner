import StoryblokClient from "storyblok-js-client";
import { copyAssets } from "./inc/copyAssets.js";
import { copyComponents } from "./inc/copyComponent.js";
import { copyStories } from "./inc/copyStories.js";
import { copyRefStories } from "./inc/copyStoryRefs.js";
export default class StoryblokSpaceCloner {
    fullPath;
    config;
    constructor(config) {
        this.config = config;
        this.fullPath = this.config.TO_DISK_PATH
            ? `${this.config.TO_DISK_PATH.replace(/\/$/, "")}/${this.config.SOURCE_SPACE_ID}`
            : `${process.cwd()}/storyblok-spaces/${this.config.SOURCE_SPACE_ID}`;
    }
    async copy(options) {
        const SourceStoryblok = new StoryblokClient({
            oauthToken: this.config.SOURCE_OAUTH_TOKEN,
            region: this.config.SOURCE_API_REGION ?? this.config.API_REGION,
        }, this.config.SOURCE_API_ENDPOINT ?? this.config.API_ENDPOINT);
        const TargetStoryblok = new StoryblokClient({
            oauthToken: this.config.TARGET_OAUTH_TOKEN,
            region: this.config.TARGET_API_REGION ?? this.config.API_REGION,
        }, this.config.TARGET_API_ENDPOINT ?? this.config.API_ENDPOINT);
        const clients = {
            source: { client: SourceStoryblok, spaceId: this.config.SOURCE_SPACE_ID },
            target: { client: TargetStoryblok, spaceId: this.config.TARGET_SPACE_ID },
        };
        const NOW = new Date().toISOString().replace(/:/g, "-");
        if (options.components || options.assets) {
            const ac = [];
            if (options.components) {
                const toDisk = typeof options.components === "object" && options.components.toDisk;
                ac.push(copyComponents(clients, NOW, toDisk, this.fullPath));
            }
            if (options.assets) {
                const toDisk = typeof options.assets == "object" && options.assets.toDisk;
                // TODO: functionality to download assets to disk
                if (!toDisk)
                    ac.push(copyAssets(clients));
            }
            const ac_response = await Promise.all(ac);
            console.log(ac_response);
        }
        if (options.stories) {
            const sr = [];
            const toDisk = typeof options.stories == "object" && options.stories.toDisk;
            sr.push(await copyStories(clients, NOW, toDisk, this.fullPath));
            if (!toDisk) {
                sr.push(await copyRefStories(clients));
            }
            const st_response = await Promise.all([
                (async () => {
                    return sr;
                })(),
            ]);
            console.log(st_response);
        }
    }
}
//# sourceMappingURL=index.js.map