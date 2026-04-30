const { Router } = require('express');
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/auth');

const router = Router();

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => authController.getMe(req, res, next));

module.exports = router;
