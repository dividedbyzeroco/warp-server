import enforce from 'enforce-js';

export default class Validation {
    static initialize() {
        enforce.extend(/^equivalent to an array$/i, val => {
            try {
                const parsedValue = JSON.parse(val);
                if(parsedValue instanceof Array) return true;
                else return false;
            }
            catch(err) {
                return false;
            }
        });

        enforce.extend(/^equivalent to an object$/i, val => {
            try {
                const parsedValue = JSON.parse(val);
                if(typeof parsedValue === 'object') return true;
                else return false;
            }
            catch(err) {
                return false;
            }
        });

        enforce.extend(/^and a valid email address$/i, val => {
            return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(val);
        });
    }
}