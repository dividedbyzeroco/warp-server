import enforce from 'enforce-js';
import { FunctionMapType } from '../../types/functions';
import Function from './function';
import Error from '../../utils/error';
import User from '../auth/user';
import KeyMap from '../../utils/key-map';

export default class ActionMapper {

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

            // Add to functions
            this.functions[functionType.functionName] = functionType;
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
            throw new Error(Error.Code.MissingConfiguration, `Function '${functionName}' has not been registered`);

        // Return class
        return functionType;
    }

    /**
     * Run the function
     * @param functionType 
     */
    async run<F extends typeof Function, U extends User>(functionType: F, keys: { [name: string]: any }, user?: U) {
        // Preepare instance
        const functionInstance = new functionType(keys, user);

        // Run function
        return await functionInstance.run(keys, user);
    }

}