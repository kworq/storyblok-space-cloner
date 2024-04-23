import "dotenv/config";
import StoryblokClient from "storyblok-js-client";
import { copyAssets } from "./inc/asset-util.js";
import { copyComponents } from "./inc/component-util.js";

const {
  SOURCE_OAUTH_TOKEN,
  SOURCE_PUBLIC_ACCESS_TOKEN,
  SOURCE_SPACE_ID,
  TARGET_OAUTH_TOKEN,
  TARGET_PUBLIC_ACCESS_TOKEN,
  TARGET_SPACE_ID,
} = process.env;

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

const a_response = await copyAssets(SourceStoryblok, TargetStoryblok);
console.log(a_response);
//await copyComponents(SourceStoryblok, TargetStoryblok);
