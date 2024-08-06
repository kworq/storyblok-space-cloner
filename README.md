# Storyblok Space Cloner

## Description
This package provides tools to efficiently copy components, stories, and assets from one Storyblok space to another. It is designed to simplify the process of cloning spaces for development, testing, or migration purposes, ensuring a seamless transfer of content and structure.

## Features
- **Copy Assets**: Clone all digital assets.
- **Copy Components**: Clone all components' schemas.
- **Copy Stories**: Clone all stories including all associated content and configurations.
- **Copy Story References**: Replace all story references with cloned story references.

## Prerequisites
Before using this package, you must:
- Have administrative access to both the source and target Storyblok spaces.
- Obtain the API OAuth personal access tokens for both spaces.

## Run
node --import ./esm-loader.mjs index.ts

## License

This project is licensed under the MIT License.
