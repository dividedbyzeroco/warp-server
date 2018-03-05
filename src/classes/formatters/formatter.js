import Error from '../../utils/error';

export default class Formatter {

    static format() {
        throw new Error(Error.Code.ForbiddenOperation, 'Formatter must implement a `format` method');
    }
}