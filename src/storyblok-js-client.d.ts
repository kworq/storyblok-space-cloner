// storyblok-js-client.d.ts
declare module "storyblok-js-client" {
  export interface StoryblokConfig {
    oauthToken: string;
    region?: string;
    cache?: {
      clear: string;
      type: string;
    };
    rateLimit?: number;
  }

  export class StoryblokClient {
    constructor(config: StoryblokConfig, endpoint?: string);

    get(slug: string, params?: object): Promise<any>;
    post(slug: string, params?: object): Promise<any>;
    put(slug: string, params?: object): Promise<any>;
    // Define other methods you use...
  }

  export default StoryblokClient;
}
