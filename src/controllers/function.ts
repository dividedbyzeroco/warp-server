import WarpServer from '../index';
import { RunOptionsType } from '../types/functions';

export default class FunctionController {

    _api: WarpServer;

    constructor(api: WarpServer) {
        this._api = api;
    }
    
    async run({ user, functionName, keys }: RunOptionsType): Promise<any> {
        // // Get function
        // const functionClass = this._api.functions.get(functionName);
        // const func = new functionClass({ keys });

        // // Run the function
        // const result = await func.execute();

        // // Return the result
        // return result;
    }
}