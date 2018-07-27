import { InternalKeys } from '../utils/constants';

export type AccessType = typeof InternalKeys.Access.Find
    | typeof InternalKeys.Access.Get
    | typeof InternalKeys.Access.Create
    | typeof InternalKeys.Access.Update
    | typeof InternalKeys.Access.Destroy
    | typeof InternalKeys.Access.Run
    | typeof InternalKeys.Access.Manage;