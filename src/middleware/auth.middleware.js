const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

exports.protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Anda tidak login. Silakan login untuk mendapatkan akses.', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.userId, role: decoded.role }; 
        next();
    } catch (error) {
        return next(new AppError('Token tidak valid atau kedaluwarsa.', 401));
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Anda tidak memiliki izin untuk mengakses sumber daya ini.', 403));
        }
        next();
    };
};