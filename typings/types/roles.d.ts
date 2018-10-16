import Role from '../classes/role';
export declare type RoleMapType = {
    [name: string]: typeof Role;
};
export declare type RoleFunctionsType = {
    add: (map: RoleMapType) => void;
    get: (roleName: string) => typeof Role;
};
