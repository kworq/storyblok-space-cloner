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

const { SOURCE_OAUTH_TOKEN, TARGET_OAUTH_TOKEN } = process.env;

const ENDPOINT = "https://api-us.storyblok.com/v1";

const SourceStoryblok = new StoryblokClient(
  {
    oauthToken: SOURCE_OAUTH_TOKEN,
    region: "us",
  },
  ENDPOINT
);

const TargetStoryblok = new StoryblokClient(
  {
    oauthToken: TARGET_OAUTH_TOKEN,
    region: "us",
  },
  ENDPOINT
);

const ac_response = await Promise.all([
  // copyComponents(SourceStoryblok, TargetStoryblok),
  // copyAssets(SourceStoryblok, TargetStoryblok),
]);

console.log(ac_response);

const st_response = await Promise.all([
  copyStories(SourceStoryblok, TargetStoryblok),
]);

console.log(st_response);
