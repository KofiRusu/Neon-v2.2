"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicProcedure = exports.router = exports.createContext = void 0;
const server_1 = require("@trpc/server");
const data_model_1 = require("@neon/data-model");
const createContext = ({ req, res, }) => {
    return {
        req,
        res,
        db: data_model_1.db,
    };
};
exports.createContext = createContext;
const t = server_1.initTRPC.context().create();
exports.router = t.router;
exports.publicProcedure = t.procedure;
//# sourceMappingURL=trpc.js.map