import Formatter from './formatter';

export default class JSON extends Formatter {

    static format(key, value) {
        if(typeof value === 'string')
            return JSON.parse(value);
        else if(typeof value === 'object')
        {
            return undefined;
        }
        else return null;
    }

}