import { describe, it, expect, vi, beforeEach } from "vitest";
import StoryblokSpaceCloner from "./src/index";
import { copyAssets } from "./src/inc/copyAssets";
import { copyComponents } from "./src/inc/copyComponent";
import { copyStories } from "./src/inc/copyStories";
import { copyRefStories } from "./src/inc/copyStoryRefs";

vi.mock("storyblok-js-client");
vi.mock("./src/inc/copyAssets");
vi.mock("./src/inc/copyComponent");
vi.mock("./src/inc/copyStories");
vi.mock("./src/inc/copyStoryRefs");

const mockConfig = {
  SOURCE_OAUTH_TOKEN: "source-token",
  TARGET_OAUTH_TOKEN: "target-token",
  SOURCE_SPACE_ID: "source-space-id",
  TARGET_SPACE_ID: "target-space-id",
  API_ENDPOINT: "https://api-us.storyblok.com",
  API_REGION: "us",
};

describe("StoryblokSpaceCloner", () => {
  let cloner;

  beforeEach(() => {
    vi.clearAllMocks();
    cloner = new StoryblokSpaceCloner(mockConfig);
  });

  it("should instantiate with given config", () => {
    expect(cloner.config).toEqual(mockConfig);
  });

  it("should call copyComponents when components option is provided", async () => {
    await cloner.copy({ components: true });
    expect(copyComponents).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({
          client: expect.anything(),
          spaceId: "source-space-id",
        }),
        target: expect.objectContaining({
          client: expect.anything(),
          spaceId: "target-space-id",
        }),
      }),
      expect.any(String), // NOW
      false, // toDisk
      expect.any(String), // toDiskPath
      undefined // fromDisk
    );
  });

  it("should call copyAssets when assets option is provided", async () => {
    await cloner.copy({ assets: true });
    expect(copyAssets).toHaveBeenCalledWith(expect.any(Object));
  });

  it("should call copyStories when stories option is provided", async () => {
    await cloner.copy({ stories: true });
    expect(copyStories).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
      false,
      expect.any(String)
    );
  });

  it("should call copyRefStories when stories option is provided and not toDisk", async () => {
    await cloner.copy({ stories: true });
    expect(copyRefStories).toHaveBeenCalledWith(expect.any(Object));
  });

  it("should not call copyRefStories when stories option is provided and toDisk", async () => {
    await cloner.copy({ stories: { toDisk: true } });
    expect(copyStories).toHaveBeenCalled();
    expect(copyRefStories).not.toHaveBeenCalled();
  });

  it("should handle combined options correctly", async () => {
    await cloner.copy({ components: true, assets: true, stories: true });
    expect(copyComponents).toHaveBeenCalled();
    expect(copyAssets).toHaveBeenCalled();
    expect(copyStories).toHaveBeenCalled();
    expect(copyRefStories).toHaveBeenCalled();
  });

  it("should handle errors in copyComponents", async () => {
    copyComponents.mockImplementationOnce(() => {
      throw new Error("Error in copyComponents");
    });

    await expect(cloner.copy({ components: true })).rejects.toThrow(
      "Error in copyComponents"
    );
  });

  it("should handle errors in copyAssets", async () => {
    copyAssets.mockImplementationOnce(() => {
      throw new Error("Error in copyAssets");
    });

    await expect(cloner.copy({ assets: true })).rejects.toThrow(
      "Error in copyAssets"
    );
  });

  it("should handle errors in copyStories", async () => {
    copyStories.mockImplementationOnce(() => {
      throw new Error("Error in copyStories");
    });

    await expect(cloner.copy({ stories: true })).rejects.toThrow(
      "Error in copyStories"
    );
  });

  it("should handle errors in copyRefStories", async () => {
    copyRefStories.mockImplementationOnce(() => {
      throw new Error("Error in copyRefStories");
    });

    await expect(cloner.copy({ stories: true })).rejects.toThrow(
      "Error in copyRefStories"
    );
  });
});
