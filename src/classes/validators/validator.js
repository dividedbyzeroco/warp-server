import Error from '../../utils/error';

export default class Validator {

    static validate() {
        throw new Error(Error.Code.ForbiddenOperation, 'Validator must implement a `validate` method');
    }
}