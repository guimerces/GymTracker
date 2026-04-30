function errorHandler(err, req, res, next) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);

    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'Registro duplicado' });
    }

    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(400).json({ error: 'Referência inválida' });
    }

    const status = err.statusCode || 500;
    const message = err.statusCode ? err.message : 'Erro interno do servidor';

    res.status(status).json({ error: message });
}

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

module.exports = { errorHandler, AppError };
