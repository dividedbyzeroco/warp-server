import Role from '../classes/role';

export type RoleMapType = { [name: string]: typeof Role };

export type RoleFunctionsType = {
    add: (map: RoleMapType) => void;
    get: (roleName: string) =>  typeof Role
}