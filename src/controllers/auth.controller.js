const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/errorHandler');

exports.login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const data = await authService.login(username, password);
    res.status(200).json({ success: true, ...data });
});