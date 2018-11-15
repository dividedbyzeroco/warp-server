import enforce from 'enforce-js';
import { FunctionMapType, FunctionOptions } from '../../types/functions';
import Function from './function';
import Error from '../../utils/error';
import User from '../auth/user';

export default class FunctionManager {

    private functions: FunctionMapType<any> = {};

    /**
     * Register functions to actions mapper
     * @param actionMap
     */
    register(functionMap: FunctionMapType<any>) {
        // Iterate through class map
        for(const [functionName, functionType] of Object.entries<typeof Function>(functionMap)) {
            // Make a sample instance
            const sampleInstance = new functionType;

            // Check data type
            enforce`${{ [functionName]: sampleInstance }} as a ${{ Function }}`;

            // Get function name
            const functionClassName = functionType.name;

            // Add to functions
            this.functions[functionType.functionName || functionClassName] = functionType;
        }
    }

    /**
     * Get function from registry
     * @param functionName
     */
    get<F extends typeof Function>(functionName: string) {
        // Get function
        const functionType: F = this.functions[functionName];

        // Check if class exists
        if(typeof functionType === 'undefined')
            throw new Error(Error.Code.FunctionNotFound, `Function '${functionName}' has not been registered`);

        // Return class
        return functionType;
    }

    /**
     * Run the function
     * @param functionType 
     */
    async run<F extends typeof Function, U extends User | undefined>(
        functionType: F, 
        keys: { [name: string]: any }, 
        opts?: FunctionOptions<U>
    ) {
        // Prepare instance
        const functionInstance = new functionType(keys, opts && opts.user);

        // Check if user has access
        if(functionInstance.statics().masterOnly && !(opts && opts.master))
            throw new Error(Error.Code.ForbiddenOperation, 'This function can only be accessed by a master');

        // Run function
        return await functionInstance.run(keys, opts);
    }

}