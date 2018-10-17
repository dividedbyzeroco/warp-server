import WarpServer from '..';
declare const auth: (api: WarpServer) => import("express-serve-static-core").Router;
export default auth;
