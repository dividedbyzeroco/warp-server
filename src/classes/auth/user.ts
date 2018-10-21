import Class from '../class';
import Key from '../keys/key';

@Class.definition
export default class User extends Class {

    @Key username: string;
    @Key email: string;
    @Key password: string;
    @Key role: string;

}