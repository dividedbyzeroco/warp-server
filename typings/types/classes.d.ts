export declare type FindOptionsType = {
    accessToken: string;
    className: string;
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
    accessToken: string;
    className: string;
    id: number;
    select?: Array<string>;
    include?: Array<string>;
};
export declare type CreateOptionsType = {
    accessToken: string;
    className: string;
    keys: {
        [name: string]: any;
    };
};
export declare type UpdateOptionsType = {
    accessToken: string;
    className: string;
    id: number;
    keys: {
        [name: string]: any;
    };
};
export declare type DestroyOptionsType = {
    accessToken: string;
    className: string;
    id: number;
};
