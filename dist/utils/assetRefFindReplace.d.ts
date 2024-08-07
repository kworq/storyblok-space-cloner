export declare const cloneDeep: <T>(obj: T) => T | T[];
export declare function findValuesByKey(obj: Record<string, any>, key: string): {
    ref: Record<string, any>;
    key: string;
}[];
export declare function updateValues(obj: Record<string, any>, key: string, getNewValue: (value: string) => Promise<any>): Promise<void>;
