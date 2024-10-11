# Storyblok Space Cloner

> **⚠️ Warning:**  
> As a precaution, it is highly recommended to duplicate your space within each account that it is associated with before proceeding. See [here](https://www.storyblok.com/docs/how-to-duplicate-a-space) for details. If you mistakenly mix up your source and target environments, you could unintentionally overwrite Blocks or Stories that share the same name, leading to permanent loss of data. This package uses the Storyblok Management API, which requires a personal access token for each account that is used. This token grants access to all associated spaces for your account, along with their respective permissions. Use with caution and at your own risk.

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

```javascript
import "dotenv/config";
import StoryblokSpaceCloner from "@kworq/storyblok-space-cloner";

const config = {
  SOURCE_OAUTH_TOKEN: process.env.SOURCE_OAUTH_TOKEN,
  TARGET_OAUTH_TOKEN: process.env.TARGET_OAUTH_TOKEN,
  SOURCE_SPACE_ID: process.env.SOURCE_SPACE_ID,
  TARGET_SPACE_ID: process.env.TARGET_SPACE_ID,
  API_ENDPOINT: process.env.API_ENDPOINT,
  API_REGION: process.env.API_REGION,
  // If either or both specific endpoints and regions are not provided, API_ENDPOINT and API_REGION will used.
  // SOURCE_API_ENDPOINT: process.env.SOURCE_API_ENDPOINT,
  // SOURCE_API_REGION: process.env.SOURCE_API_REGION,
  // TARGET_API_ENDPOINT: process.env.TARGET_API_ENDPOINT,
  // TARGET_API_REGION: process.env.TARGET_API_REGION,
  // TO_DISK_PATH: "/path/to/backup/directory",
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

## Plugins
In the plugins folder, there are Storyblok packages. These are field type plugins for Storyblok's visual UI. Not related to the main cloning features, but perhaps usefull to some. We will continue to add more of them.

## License

This project is licensed under the MIT License.
