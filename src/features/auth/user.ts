import Class from '../orm/class';
import Key from '../orm/keys/key';

@Class.definition
export default class User extends Class {

    @Key username: string;
    @Key email: string;
    @Key password: string;
    @Key role: string;

}