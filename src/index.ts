import "dotenv/config";
import StoryblokClient from "storyblok-js-client";
import { copyAssets } from "./inc/copyAssets";
import { copyComponents } from "./inc/copyComponent";
import { copyStories } from "./inc/copyStories";
import { copyRefStories } from "./inc/copyStoryRefs";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SOURCE_OAUTH_TOKEN: string;
      TARGET_OAUTH_TOKEN: string;
      SOURCE_SPACE_ID: string;
      TARGET_SPACE_ID: string;
    }
  }
}

const { SOURCE_OAUTH_TOKEN, TARGET_OAUTH_TOKEN, API_ENDPOINT, API_REGION } =
  process.env;

const SourceStoryblok = new StoryblokClient(
  {
    oauthToken: SOURCE_OAUTH_TOKEN,
    region: API_REGION,
  },
  API_ENDPOINT
);

const TargetStoryblok = new StoryblokClient(
  {
    oauthToken: TARGET_OAUTH_TOKEN,
    region: API_REGION,
  },
  API_ENDPOINT
);
const NOW = new Date().toISOString().replace(/:/g, "-");
const ac_response = await Promise.all([
  copyComponents(SourceStoryblok, TargetStoryblok, NOW),
  copyAssets(SourceStoryblok, TargetStoryblok),
]);

console.log(ac_response);

const st_response = await Promise.all([
  (async () => {
    return [
      await copyStories(SourceStoryblok, TargetStoryblok, NOW),
      await copyRefStories(SourceStoryblok, TargetStoryblok),
    ];
  })(),
]);

console.log(st_response);
