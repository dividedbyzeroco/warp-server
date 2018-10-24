import { NumberType } from "../features/orm/keys/types/number";

export type KeyOptions = {
    via?: string,
    numType?: NumberType,
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number,
    decimals?: number
};