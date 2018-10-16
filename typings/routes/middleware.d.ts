import { WarpServer } from '../index';
declare const middleware: (api: WarpServer) => import("express-serve-static-core").Router;
export default middleware;
