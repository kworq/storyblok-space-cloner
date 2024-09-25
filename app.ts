import "dotenv/config";
import StoryblokSpaceCloner from "./src/index";

const config = {
  SOURCE_OAUTH_TOKEN: process.env.SOURCE_OAUTH_TOKEN,
  TARGET_OAUTH_TOKEN: process.env.TARGET_OAUTH_TOKEN,
  SOURCE_SPACE_ID: process.env.SOURCE_SPACE_ID,
  TARGET_SPACE_ID: process.env.TARGET_SPACE_ID,
  API_REGION: process.env.API_REGION,
  API_ENDPOINT: process.env.API_ENDPOINT,
  SOURCE_API_REGION: process.env.SOURCE_API_REGION,
  SOURCE_API_ENDPOINT: process.env.SOURCE_API_ENDPOINT,
  TARGET_API_REGION: process.env.TARGET_API_REGION,
  TARGET_API_ENDPOINT: process.env.TARGET_API_ENDPOINT,
} as StoryblokSpaceClonerConfig;

const cloner = new StoryblokSpaceCloner(config);

cloner.copy({
  assets: true,
  // TODO: add toDisk option for `assets`.
  // Currently if toDisk is set to true for `assets`,
  // it will not work, nor will it copy assets to the target space.
  components: { toDisk: false },
  stories: { toDisk: false },
});
