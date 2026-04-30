const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../../database/db');
const { AppError } = require('../../middleware/errorHandler');

class AuthService {
    register(name, email, password) {
        const db = getDb();

        if (!name || !email || !password) {
            throw new AppError('Nome, email e senha são obrigatórios', 400);
        }

        if (password.length < 6) {
            throw new AppError('A senha deve ter pelo menos 6 caracteres', 400);
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            throw new AppError('Email já cadastrado', 409);
        }

        const passwordHash = bcrypt.hashSync(password, 10);
        const result = db.prepare(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
        ).run(name, email, passwordHash);

        const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
        const token = this._generateToken(user.id);

        return { user, token };
    }

    login(email, password) {
        const db = getDb();

        if (!email || !password) {
            throw new AppError('Email e senha são obrigatórios', 400);
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            throw new AppError('Email ou senha inválidos', 401);
        }

        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            throw new AppError('Email ou senha inválidos', 401);
        }

        const token = this._generateToken(user.id);
        const { password_hash, ...userData } = user;

        return { user: userData, token };
    }

    getMe(userId) {
        const db = getDb();
        const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(userId);
        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }
        return user;
    }

    _generateToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    }
}

module.exports = new AuthService();
