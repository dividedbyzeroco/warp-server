import WarpServer from '../index';
import Session from '../classes/session';
import Collection from '../utils/collection';
import { GetOptionsType, FindOptionsType } from '../types/sessions';
export default class SessionController {
    _api: WarpServer;
    constructor(api: WarpServer);
    find({ select, include, where, sort, skip, limit }: FindOptionsType): Promise<Collection<Session>>;
    get({ id, select, include }: GetOptionsType): Promise<Session>;
}
