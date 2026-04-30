const { getDb } = require('../../database/db');
const { AppError } = require('../../middleware/errorHandler');

class WorkoutsService {
    getAll(userId) {
        const db = getDb();
        return db.prepare(
            'SELECT * FROM workouts WHERE user_id = ? ORDER BY order_index ASC'
        ).all(userId);
    }

    getById(id, userId) {
        const db = getDb();
        const workout = db.prepare(
            'SELECT * FROM workouts WHERE id = ? AND user_id = ?'
        ).get(id, userId);
        if (!workout) {
            throw new AppError('Treino não encontrado', 404);
        }
        return workout;
    }

    create(userId, name) {
        const db = getDb();

        if (!name || !name.trim()) {
            throw new AppError('Nome do treino é obrigatório', 400);
        }

        // Get the next order_index
        const last = db.prepare(
            'SELECT MAX(order_index) as maxIdx FROM workouts WHERE user_id = ?'
        ).get(userId);
        const orderIndex = (last.maxIdx ?? -1) + 1;

        const result = db.prepare(
            'INSERT INTO workouts (user_id, name, order_index) VALUES (?, ?, ?)'
        ).run(userId, name.trim(), orderIndex);

        return db.prepare('SELECT * FROM workouts WHERE id = ?').get(result.lastInsertRowid);
    }

    update(id, userId, data) {
        const db = getDb();
        const workout = this.getById(id, userId);

        const name = data.name !== undefined ? data.name.trim() : workout.name;
        const orderIndex = data.order_index !== undefined ? data.order_index : workout.order_index;

        db.prepare(
            'UPDATE workouts SET name = ?, order_index = ? WHERE id = ? AND user_id = ?'
        ).run(name, orderIndex, id, userId);

        return this.getById(id, userId);
    }

    delete(id, userId) {
        const db = getDb();
        this.getById(id, userId); // Ensure it exists
        db.prepare('DELETE FROM workouts WHERE id = ? AND user_id = ?').run(id, userId);

        // Reorder remaining workouts
        const remaining = db.prepare(
            'SELECT id FROM workouts WHERE user_id = ? ORDER BY order_index ASC'
        ).all(userId);
        const updateStmt = db.prepare('UPDATE workouts SET order_index = ? WHERE id = ?');
        remaining.forEach((w, idx) => updateStmt.run(idx, w.id));
    }

    reorder(userId, workoutIds) {
        const db = getDb();
        const updateStmt = db.prepare('UPDATE workouts SET order_index = ? WHERE id = ? AND user_id = ?');
        const transaction = db.transaction(() => {
            workoutIds.forEach((id, idx) => {
                updateStmt.run(idx, id, userId);
            });
        });
        transaction();
        return this.getAll(userId);
    }
}

module.exports = new WorkoutsService();
