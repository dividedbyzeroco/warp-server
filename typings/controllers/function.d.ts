import WarpServer from '../index';
import { RunOptionsType } from '../types/functions';
export default class FunctionController {
    _api: WarpServer;
    constructor(api: WarpServer);
    run({Warp, metadata, currentUser, functionName, keys}: RunOptionsType): Promise<any>;
}
