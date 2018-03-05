import Error from '../../utils/error';

export default class Parser {

    static parse() {
        throw new Error(Error.Code.ForbiddenOperation, 'Parser must implement a `parse` method');
    }
}