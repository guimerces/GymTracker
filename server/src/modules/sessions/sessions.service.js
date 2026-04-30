const { getDb } = require('../../database/db');
const { AppError } = require('../../middleware/errorHandler');
const { getWeightRecommendation } = require('../../utils/weightRecommendation');

class SessionsService {
    getAll(userId, limit = 20) {
        const db = getDb();
        return db.prepare(`
            SELECT ts.*, w.name as workout_name
            FROM training_sessions ts
            JOIN workouts w ON ts.workout_id = w.id
            WHERE ts.user_id = ?
            ORDER BY ts.started_at DESC
            LIMIT ?
        `).all(userId, limit);
    }

    getById(sessionId, userId) {
        const db = getDb();
        const session = db.prepare(`
            SELECT ts.*, w.name as workout_name
            FROM training_sessions ts
            JOIN workouts w ON ts.workout_id = w.id
            WHERE ts.id = ? AND ts.user_id = ?
        `).get(sessionId, userId);

        if (!session) {
            throw new AppError('Sessão não encontrada', 404);
        }
        return session;
    }

    /**
     * Suggest next workout based on training history.
     * Cycling through workouts: if last was B (index 1) of [A, B, C],
     * suggest C (index 2). Wraps around.
     */
    suggest(userId) {
        const db = getDb();

        const workouts = db.prepare(
            'SELECT * FROM workouts WHERE user_id = ? ORDER BY order_index ASC'
        ).all(userId);

        if (workouts.length === 0) {
            return { 
                suggestion: null, 
                message: 'Cadastre treinos primeiro!',
                exercises: [] 
            };
        }

        // Find last completed session
        const lastSession = db.prepare(`
            SELECT ts.*, w.order_index as workout_order
            FROM training_sessions ts
            JOIN workouts w ON ts.workout_id = w.id
            WHERE ts.user_id = ? AND ts.finished_at IS NOT NULL
            ORDER BY ts.finished_at DESC
            LIMIT 1
        `).get(userId);

        let suggestedWorkout;
        if (!lastSession) {
            suggestedWorkout = workouts[0];
        } else {
            const nextIndex = (lastSession.workout_order + 1) % workouts.length;
            suggestedWorkout = workouts[nextIndex];
        }

        // Get exercises for the suggested workout
        const exercises = db.prepare(
            'SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY order_index ASC'
        ).all(suggestedWorkout.id);

        // Find last session with this same workout to get previous data
        const lastSameWorkoutSession = db.prepare(`
            SELECT id FROM training_sessions
            WHERE user_id = ? AND workout_id = ? AND finished_at IS NOT NULL
            ORDER BY finished_at DESC
            LIMIT 1
        `).get(userId, suggestedWorkout.id);

        // Build exercise data with recommendations
        const exerciseData = exercises.map(exercise => {
            let previousSets = [];
            if (lastSameWorkoutSession) {
                previousSets = db.prepare(`
                    SELECT set_number, weight_kg, reps
                    FROM session_sets
                    WHERE session_id = ? AND workout_exercise_id = ?
                    ORDER BY set_number ASC
                `).all(lastSameWorkoutSession.id, exercise.id);
            }

            const recommendation = getWeightRecommendation(
                previousSets,
                exercise.target_sets,
                exercise.target_reps
            );

            return {
                ...exercise,
                recommendation
            };
        });

        return {
            suggestion: suggestedWorkout,
            message: `Treino sugerido: ${suggestedWorkout.name}`,
            lastSession: lastSession ? {
                workout_name: lastSession.workout_name || 'N/A',
                date: lastSession.finished_at
            } : null,
            exercises: exerciseData
        };
    }

    start(userId, workoutId) {
        const db = getDb();

        // Verify workout belongs to user
        const workout = db.prepare(
            'SELECT id FROM workouts WHERE id = ? AND user_id = ?'
        ).get(workoutId, userId);
        if (!workout) {
            throw new AppError('Treino não encontrado', 404);
        }

        // Check if there's an active (unfinished) session
        const activeSession = db.prepare(`
            SELECT id FROM training_sessions
            WHERE user_id = ? AND finished_at IS NULL
        `).get(userId);
        if (activeSession) {
            throw new AppError('Já existe uma sessão em andamento. Finalize-a primeiro.', 400);
        }

        const result = db.prepare(
            'INSERT INTO training_sessions (user_id, workout_id) VALUES (?, ?)'
        ).run(userId, workoutId);

        return this.getById(result.lastInsertRowid, userId);
    }

    finish(sessionId, userId, durationSeconds) {
        const db = getDb();
        const session = this.getById(sessionId, userId);

        if (session.finished_at) {
            throw new AppError('Sessão já finalizada', 400);
        }

        db.prepare(`
            UPDATE training_sessions
            SET finished_at = datetime('now'), duration_seconds = ?
            WHERE id = ? AND user_id = ?
        `).run(durationSeconds || 0, sessionId, userId);

        return this.getById(sessionId, userId);
    }

    // Get active (unfinished) session if any
    getActive(userId) {
        const db = getDb();
        const session = db.prepare(`
            SELECT ts.*, w.name as workout_name
            FROM training_sessions ts
            JOIN workouts w ON ts.workout_id = w.id
            WHERE ts.user_id = ? AND ts.finished_at IS NULL
            LIMIT 1
        `).get(userId);
        return session || null;
    }

    // Session sets management
    getSets(sessionId, userId) {
        const db = getDb();
        this.getById(sessionId, userId); // verify access

        return db.prepare(`
            SELECT ss.*, we.exercise_name
            FROM session_sets ss
            JOIN workout_exercises we ON ss.workout_exercise_id = we.id
            WHERE ss.session_id = ?
            ORDER BY ss.workout_exercise_id, ss.set_number ASC
        `).all(sessionId);
    }

    addSet(sessionId, userId, data) {
        const db = getDb();
        this.getById(sessionId, userId); // verify access

        if (!data.workout_exercise_id) {
            throw new AppError('ID do exercício é obrigatório', 400);
        }

        // Auto-determine set_number
        const lastSet = db.prepare(`
            SELECT MAX(set_number) as maxSet
            FROM session_sets
            WHERE session_id = ? AND workout_exercise_id = ?
        `).get(sessionId, data.workout_exercise_id);
        const setNumber = (lastSet.maxSet || 0) + 1;

        const result = db.prepare(`
            INSERT INTO session_sets (session_id, workout_exercise_id, set_number, weight_kg, reps)
            VALUES (?, ?, ?, ?, ?)
        `).run(sessionId, data.workout_exercise_id, setNumber, data.weight_kg || 0, data.reps || 0);

        return db.prepare(`
            SELECT ss.*, we.exercise_name
            FROM session_sets ss
            JOIN workout_exercises we ON ss.workout_exercise_id = we.id
            WHERE ss.id = ?
        `).get(result.lastInsertRowid);
    }

    deleteSet(setId, userId) {
        const db = getDb();

        const set = db.prepare(`
            SELECT ss.* FROM session_sets ss
            JOIN training_sessions ts ON ss.session_id = ts.id
            WHERE ss.id = ? AND ts.user_id = ?
        `).get(setId, userId);

        if (!set) {
            throw new AppError('Série não encontrada', 404);
        }

        db.prepare('DELETE FROM session_sets WHERE id = ?').run(setId);

        // Renumber remaining sets for this exercise in this session
        const remaining = db.prepare(
            'SELECT id FROM session_sets WHERE session_id = ? AND workout_exercise_id = ? ORDER BY set_number ASC'
        ).all(set.session_id, set.workout_exercise_id);
        const updateStmt = db.prepare('UPDATE session_sets SET set_number = ? WHERE id = ?');
        remaining.forEach((s, idx) => updateStmt.run(idx + 1, s.id));
    }
}

module.exports = new SessionsService();
