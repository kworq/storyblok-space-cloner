import "dotenv/config";
import StoryblokSpaceCloner from "./src/index";

const config = {
  SOURCE_OAUTH_TOKEN: process.env.SOURCE_OAUTH_TOKEN as string,
  TARGET_OAUTH_TOKEN: process.env.TARGET_OAUTH_TOKEN as string,
  SOURCE_SPACE_ID: process.env.SOURCE_SPACE_ID as string,
  TARGET_SPACE_ID: process.env.TARGET_SPACE_ID as string,
  API_REGION: process.env.API_REGION as string,
  API_ENDPOINT: process.env.API_ENDPOINT as string,
};

const cloner = new StoryblokSpaceCloner(config);

cloner.copy({
  assets: true,
  // TODO: add toDisk option for `assets`.
  // Currently if toDisk is set to true for `assets`,
  // it will not work, nor will it copy assets to the target space.
  components: { toDisk: false },
  stories: { toDisk: false },
});
