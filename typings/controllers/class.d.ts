import WarpServer from '../index';
import Class from '../classes/class';
import ClassCollection from '../utils/class-collection';
import ConstraintMap from '../utils/constraint-map';
import { GetOptionsType, FindOptionsType, CreateOptionsType, UpdateOptionsType, DestroyOptionsType } from '../types/classes';
import { AccessType } from '../types/scope';
export default class ClassController {
    _api: WarpServer;
    constructor(api: WarpServer);
    checkAccess(accessToken: string, classType: typeof Class, action: AccessType, where: ConstraintMap): Promise<{
        accessibility: boolean | ConstraintMap;
        currentUser: import("../classes/user").default;
    }>;
    find({ accessToken, className, select, include, where, sort, skip, limit }: FindOptionsType): Promise<ClassCollection<Class>>;
    get({ accessToken, className, id, select, include }: GetOptionsType): Promise<Class>;
    create({ accessToken, className, keys }: CreateOptionsType): Promise<Class>;
    update({ accessToken, className, keys, id }: UpdateOptionsType): Promise<Class>;
    destroy({ accessToken, className, id }: DestroyOptionsType): Promise<Class>;
}
