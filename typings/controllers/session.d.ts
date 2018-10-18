import WarpServer from '../index';
import { GetOptionsType, FindOptionsType } from '../types/sessions';
export default class SessionController {
    _api: WarpServer;
    constructor(api: WarpServer);
    find({ select, include, where, sort, skip, limit }: FindOptionsType): Promise<void>;
    get({ id, select, include }: GetOptionsType): Promise<void>;
}
