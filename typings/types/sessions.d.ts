export declare type FindOptionsType = {
    select?: Array<string>;
    include?: Array<string>;
    where?: {
        [name: string]: {
            [name: string]: any;
        };
    };
    sort?: Array<string | {
        [name: string]: any;
    }>;
    skip?: number;
    limit?: number;
};
export declare type GetOptionsType = {
    id: number;
    select?: Array<string>;
    include?: Array<string>;
};
