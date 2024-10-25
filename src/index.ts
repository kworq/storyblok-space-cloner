import StoryblokClient from "storyblok-js-client";
import { copyAssets } from "./inc/copyAssets";
import { copyComponents } from "./inc/copyComponent";
import { copyStories } from "./inc/copyStories";
import { copyRefStories } from "./inc/copyStoryRefs";

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

  constructor(config: StoryblokSpaceClonerConfig) {
    this.config = config;
    this.toDiskPath = this.config.TO_DISK_PATH
      ? `${this.config.TO_DISK_PATH.replace(/\/$/, "")}/${
          this.config.SOURCE_SPACE_ID
        }`
      : `${process.cwd()}/storyblok-spaces/${this.config.SOURCE_SPACE_ID}`;
  }

  async copy(options: {
    assets?: boolean | { toDisk?: boolean };
    components?: boolean | { toDisk?: boolean; fromDisk?: { path: string } };
    stories?: boolean | { toDisk?: boolean };
  }) {
    const SourceStoryblok = new StoryblokClient(
      {
        oauthToken: this.config.SOURCE_OAUTH_TOKEN,
        region: this.config.SOURCE_API_REGION ?? this.config.API_REGION,
      },
      this.config.SOURCE_API_ENDPOINT ?? this.config.API_ENDPOINT
    );

    const TargetStoryblok = new StoryblokClient(
      {
        oauthToken: this.config.TARGET_OAUTH_TOKEN,
        region: this.config.TARGET_API_REGION ?? this.config.API_REGION,
      },
      this.config.TARGET_API_ENDPOINT ?? this.config.API_ENDPOINT
    );

    const clients = {
      source: { client: SourceStoryblok, spaceId: this.config.SOURCE_SPACE_ID },
      target: { client: TargetStoryblok, spaceId: this.config.TARGET_SPACE_ID },
    };

    const NOW = new Date().toISOString().replace(/:/g, "-");

    if (options.components || options.assets) {
      const ac = [];
      if (options.components) {
        const toDisk =
          typeof options.components === "object" && options.components.toDisk;
        const fromDisk =
          typeof options.components === "object"
            ? options.components.fromDisk
            : undefined;
        ac.push(
          copyComponents(clients, NOW, toDisk, this.toDiskPath, fromDisk)
        );
      }
      if (options.assets) {
        const toDisk =
          typeof options.assets == "object" && options.assets.toDisk;
        // TODO: functionality to download assets to disk
        if (!toDisk) ac.push(copyAssets(clients));
      }
      const ac_response = await Promise.all(ac);

      console.log(ac_response);
    }
    if (options.stories) {
      const sr = [];
      const toDisk =
        typeof options.stories == "object" && options.stories.toDisk;
      sr.push(await copyStories(clients, NOW, toDisk, this.toDiskPath));
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
