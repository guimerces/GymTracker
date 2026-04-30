const authService = require('./auth.service');

class AuthController {
    register(req, res, next) {
        try {
            const { name, email, password } = req.body;
            const result = authService.register(name, email, password);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = authService.login(email, password);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    getMe(req, res, next) {
        try {
            const user = authService.getMe(req.userId);
            res.json(user);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AuthController();
