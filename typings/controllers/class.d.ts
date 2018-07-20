import WarpServer from '../index';
import Class from '../classes/class';
import ClassCollection from '../utils/class-collection';
import { GetOptionsType, FindOptionsType, CreateOptionsType, UpdateOptionsType, DestroyOptionsType } from '../types/classes';
export default class ClassController {
    _api: WarpServer;
    constructor(api: WarpServer);
    find({ className, select, include, where, sort, skip, limit }: FindOptionsType): Promise<ClassCollection<Class>>;
    get({ className, id, select, include }: GetOptionsType): Promise<Class>;
    create({ Warp, metadata, currentUser, className, keys }: CreateOptionsType): Promise<Class>;
    update({ Warp, metadata, currentUser, className, keys, id }: UpdateOptionsType): Promise<Class>;
    destroy({ Warp, metadata, currentUser, className, id }: DestroyOptionsType): Promise<Class>;
}
