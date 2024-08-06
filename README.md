# Storyblok Space Cloner

## Description
This package provides tools to efficiently copy components, stories, and assets from one Storyblok space to another. It is designed to simplify the process of cloning spaces for development, testing, or migration purposes, ensuring a seamless transfer of content and structure.

## Features
- **Copy Assets**: Clone all digital assets.
- **Copy Components**: Clone all components' schemas.
- **Copy Stories**: Clone all stories including all associated content and configurations. If the `toDisk` option is false or not set, then all story references from any other story will be updated with cloned story UUID.

## Prerequisites
Before using this package, you must:
- Have administrative access to both the source and target Storyblok spaces.
- Obtain the API OAuth personal access tokens for each account that controls the relative space. If it's the same account, then it's the same personal access token.

## Example

```typescript
import "dotenv/config";
import StoryblokSpaceCloner from "./dist/index";

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
```

## Run
node --import ./esm-loader.mjs app.ts

## License

This project is licensed under the MIT License.
