import { Interval } from 'limiter';

export type ThrottlingConfigType = {
    limit: number,
    unit: Interval
}