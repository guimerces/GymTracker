const { getDb } = require('../../database/db');
const { AppError } = require('../../middleware/errorHandler');

class ExercisesService {
    getByWorkout(workoutId, userId) {
        const db = getDb();
        // Verify workout belongs to user
        const workout = db.prepare(
            'SELECT id FROM workouts WHERE id = ? AND user_id = ?'
        ).get(workoutId, userId);
        if (!workout) {
            throw new AppError('Treino não encontrado', 404);
        }

        return db.prepare(
            'SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY order_index ASC'
        ).all(workoutId);
    }

    create(workoutId, userId, data) {
        const db = getDb();

        // Verify workout belongs to user
        const workout = db.prepare(
            'SELECT id FROM workouts WHERE id = ? AND user_id = ?'
        ).get(workoutId, userId);
        if (!workout) {
            throw new AppError('Treino não encontrado', 404);
        }

        if (!data.exercise_name || !data.exercise_name.trim()) {
            throw new AppError('Nome do exercício é obrigatório', 400);
        }

        const targetSets = data.target_sets || 3;
        const targetReps = data.target_reps || 12;

        // Get next order_index
        const last = db.prepare(
            'SELECT MAX(order_index) as maxIdx FROM workout_exercises WHERE workout_id = ?'
        ).get(workoutId);
        const orderIndex = (last.maxIdx ?? -1) + 1;

        const result = db.prepare(
            'INSERT INTO workout_exercises (workout_id, exercise_name, target_sets, target_reps, order_index) VALUES (?, ?, ?, ?, ?)'
        ).run(workoutId, data.exercise_name.trim(), targetSets, targetReps, orderIndex);

        return db.prepare('SELECT * FROM workout_exercises WHERE id = ?').get(result.lastInsertRowid);
    }

    update(exerciseId, userId, data) {
        const db = getDb();

        // Verify exercise belongs to a workout owned by user
        const exercise = db.prepare(`
            SELECT we.* FROM workout_exercises we
            JOIN workouts w ON we.workout_id = w.id
            WHERE we.id = ? AND w.user_id = ?
        `).get(exerciseId, userId);

        if (!exercise) {
            throw new AppError('Exercício não encontrado', 404);
        }

        const exerciseName = data.exercise_name !== undefined ? data.exercise_name.trim() : exercise.exercise_name;
        const targetSets = data.target_sets !== undefined ? data.target_sets : exercise.target_sets;
        const targetReps = data.target_reps !== undefined ? data.target_reps : exercise.target_reps;
        const orderIndex = data.order_index !== undefined ? data.order_index : exercise.order_index;

        db.prepare(
            'UPDATE workout_exercises SET exercise_name = ?, target_sets = ?, target_reps = ?, order_index = ? WHERE id = ?'
        ).run(exerciseName, targetSets, targetReps, orderIndex, exerciseId);

        return db.prepare('SELECT * FROM workout_exercises WHERE id = ?').get(exerciseId);
    }

    delete(exerciseId, userId) {
        const db = getDb();

        const exercise = db.prepare(`
            SELECT we.* FROM workout_exercises we
            JOIN workouts w ON we.workout_id = w.id
            WHERE we.id = ? AND w.user_id = ?
        `).get(exerciseId, userId);

        if (!exercise) {
            throw new AppError('Exercício não encontrado', 404);
        }

        db.prepare('DELETE FROM workout_exercises WHERE id = ?').run(exerciseId);

        // Reorder remaining exercises
        const remaining = db.prepare(
            'SELECT id FROM workout_exercises WHERE workout_id = ? ORDER BY order_index ASC'
        ).all(exercise.workout_id);
        const updateStmt = db.prepare('UPDATE workout_exercises SET order_index = ? WHERE id = ?');
        remaining.forEach((e, idx) => updateStmt.run(idx, e.id));
    }
}

module.exports = new ExercisesService();
