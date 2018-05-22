import WarpServer from '../index';
import Session from '../classes/session';
import ClassCollection from '../utils/class-collection';
import { GetOptionsType, FindOptionsType } from '../types/sessions';
export default class SessionController {
    _api: WarpServer;
    constructor(api: WarpServer);
    find({metadata, select, include, where, sort, skip, limit}: FindOptionsType): Promise<ClassCollection<Session>>;
    get({metadata, id, select, include}: GetOptionsType): Promise<Session>;
}
