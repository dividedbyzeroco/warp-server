import { MetadataType } from './class';

export type FindOptionsType = {
    metadata: MetadataType,
    select?: Array<string>,
    include?: Array<string>,
    where?: {[name: string]: {[name: string]: any}},
    sort?: Array<string | {[name: string]: any}>,
    skip?: number,
    limit?: number
}

export type GetOptionsType = {
    metadata: MetadataType,
    id: number,
    select?: Array<string>,
    include?: Array<string>
};