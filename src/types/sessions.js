// @flow
/**
 * References
 */
import WarpServer from '../index';

export type FindOptionsType = {
    api: WarpServer,
    select: Array<string>,
    include: Array<string>,
    where: {[name: string]: {[name: string]: any}},
    sort: Array<string | {[name: string]: any}>,
    skip: number,
    limit: number
}

export type GetOptionsType = {
    api: WarpServer,
    id: number,
    select: Array<string>,
    include: Array<string>
};