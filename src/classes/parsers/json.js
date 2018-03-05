import Parser from './parser';
import { JsonAppend, JsonSet } from '../json';

export default class JSON extends Parser {

    static parse(key, value, isNew) {
        if(typeof value === 'string')
            return value;
        else if(typeof value === 'object')
        {
            if(JsonAppend.isImplementedBy(value))
                return new JsonAppend(key, value, isNew);
            else if(JsonSet.isImplementedBy(value))
                return new JsonSet(key, value, isNew);
            else
                return JSON.stringify(value);
        }
        else return null;
    }

}