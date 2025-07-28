const db = require('../config/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');

exports.login = async (username, password) => {
    const [users] = await db.query('SELECT * FROM tbl_users WHERE username = ?', [username]);
    if (users.length === 0) {
        throw new AppError('Username atau password salah.', 401);
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError('Username atau password salah.', 401);
    }

    const payload = { userId: user.id_user, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return { token, user: { username: user.username, role: user.role } };
};