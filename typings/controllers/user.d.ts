import WarpServer from '../index';
import { GetOptionsType, FindOptionsType, CreateOptionsType, UpdateOptionsType, DestroyOptionsType } from '../types/users';
export default class UserController {
    _api: WarpServer;
    constructor(api: WarpServer);
    find({ select, include, where, sort, skip, limit }: FindOptionsType): Promise<any>;
    get({ id, select, include }: GetOptionsType): Promise<any>;
    create({ currentUser, keys }: CreateOptionsType): Promise<any>;
    update({ currentUser, keys, id }: UpdateOptionsType): Promise<any>;
    destroy({ currentUser, id }: DestroyOptionsType): Promise<any>;
}
