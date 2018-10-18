import WarpServer from '../index';
import Class from '../classes/class';
import Collection from '../utils/collection';
import { GetOptionsType, FindOptionsType, CreateOptionsType, UpdateOptionsType, DestroyOptionsType } from '../types/classes';
export default class ClassController {
    _api: WarpServer;
    constructor(api: WarpServer);
    find({ user, className, select, include, where, sort, skip, limit }: FindOptionsType): Promise<Collection<Class>>;
    get({ user, className, id, select, include }: GetOptionsType): Promise<Class>;
    create({ user, className, keys }: CreateOptionsType): Promise<Class>;
    update({ user, className, keys, id }: UpdateOptionsType): Promise<Class>;
    destroy({ user, className, id }: DestroyOptionsType): Promise<Class>;
}
