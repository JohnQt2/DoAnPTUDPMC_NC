"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const app_error_1 = require("../errors/app-error");
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(app_error_1.AppError.unauthorized('Yêu cầu xác thực tài khoản.'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(app_error_1.AppError.forbidden(`Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: [${allowedRoles.join(', ')}]`, 'FORBIDDEN_INSUFFICIENT_ROLE'));
        }
        next();
    };
}
