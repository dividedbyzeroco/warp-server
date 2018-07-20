import WarpServer from '../index';
import User from '../classes/user';
import Session from '../classes/session';
import ClassCollection from '../utils/class-collection';
import { GetOptionsType, FindOptionsType, CreateOptionsType, UpdateOptionsType, DestroyOptionsType, LoginOptionsType, MeOptionsType, LogoutOptionsType } from '../types/users';
export default class UserController {
    _api: WarpServer;
    constructor(api: WarpServer);
    find({ select, include, where, sort, skip, limit }: FindOptionsType): Promise<ClassCollection<User>>;
    get({ id, select, include }: GetOptionsType): Promise<User>;
    create({ Warp, metadata, currentUser, keys }: CreateOptionsType): Promise<User>;
    update({ Warp, metadata, currentUser, keys, id }: UpdateOptionsType): Promise<User>;
    destroy({ Warp, metadata, currentUser, id }: DestroyOptionsType): Promise<User>;
    logIn({ Warp, metadata, currentUser, username, email, password }: LoginOptionsType): Promise<Session>;
    me({ currentUser }: MeOptionsType): Promise<User>;
    logOut({ Warp, sessionToken }: LogoutOptionsType): Promise<Session>;
}
