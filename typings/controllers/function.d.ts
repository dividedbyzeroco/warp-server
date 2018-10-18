import WarpServer from '../index';
import { RunOptionsType } from '../types/functions';
export default class FunctionController {
    _api: WarpServer;
    constructor(api: WarpServer);
    run({ user, functionName, keys }: RunOptionsType): Promise<any>;
}
