export declare function findUUIDs(obj: Record<string, any> | string | any[] | null): string[];
export declare function getFullSlugUUIDs(uuids: string[], uuidMapping: Record<string, string>, fetchFullSlugByUUID: (uuid: string) => Promise<string>, fetchUUIDByFullSlug: (fullSlug: string) => Promise<string>): Promise<{
    uuidMapping: Record<string, string>;
    mappingChanged: boolean;
}>;
export declare function replaceUUIDs(obj: Record<string, any> | string | any[] | null, uuidMapping: Record<string, string>): void;
