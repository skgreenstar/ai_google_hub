declare module "node:sqlite" {
    export const constants: Record<string, unknown>;
    export class DatabaseSync {
        constructor(filename: string);
        exec(sql: string): void;
        prepare(sql: string): any;
    }
}
