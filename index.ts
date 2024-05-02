import "dotenv/config";
import StoryblokClient from "storyblok-js-client";
import { copyAssets } from "./inc/asset-util";
import { copyComponents } from "./inc/component-util";
import { copyStories } from "./inc/story-util";
import { copyRefStories } from "./inc/story-ref-util";

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

const ac_response = await Promise.all([
  copyComponents(SourceStoryblok, TargetStoryblok),
  copyAssets(SourceStoryblok, TargetStoryblok),
]);

console.log(ac_response);

const st_response = await Promise.all([
  (async () => {
    await copyStories(SourceStoryblok, TargetStoryblok);
    await copyRefStories(SourceStoryblok, TargetStoryblok);
  })(),
]);

console.log(st_response);
