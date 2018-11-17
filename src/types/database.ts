import Pointer from '../features/orm/pointer';
import KeyMap from '../utils/key-map';
import ConstraintMap from '../utils/constraint-map';
import { ILogger } from './logger';

export type DatabaseAction = 'read' | 'write';

export interface IDatabaseAdapter {
    currentTimestamp: string;
    initialize(): Promise<void>;
    find(
        source: [string, string],
        columns: Map<string, string>,
        relations: Map<string, Pointer>,
        constraints: ConstraintMap,
        sorting: string[],
        skipped: number,
        limitation: number,
    ): Promise<KeyMap[]>;
    create(source: string, keys: KeyMap): Promise<number>;
    update(source: string, keys: KeyMap, id: number): Promise<void>;
    destroy(source: string, keys: KeyMap, id: number): Promise<void>;
}

export declare const IDatabaseAdapter: {
    new(config: DatabaseConfig): IDatabaseAdapter;
};

export interface DatabaseConfig {
    uris: URIConfig[];
    persistent: boolean;
    logger: ILogger;
}

export interface URIConfig {
    uri: string;
    action: DatabaseAction;
}

export interface ConnectionConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    [config: string]: any;
}

export interface ConnectionCollection {
    write: ConnectionConfig[];
    read: ConnectionConfig[];
}

export interface QueryOptionsType {
    source: [string, string];
    columns: Map<string, string>;
    relations: Map<string, Pointer>;
    constraints: ConstraintMap;
    sorting: string[];
    skipped: number;
    limitation: number;
}

export interface FindClauseOptionsType {
    source: [string, string];
    columns: Map<string, string>;
    relations: Map<string, Pointer>;
    constraints: ConstraintMap;
}

export interface SubqueryOptionsType {
    className: string;
    select: Map<string, string>;
    where: { [key: string]: { [key: string]: any } };
}