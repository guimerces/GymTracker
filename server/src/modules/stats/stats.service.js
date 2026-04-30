const { getDb } = require('../../database/db');
const { AppError } = require('../../middleware/errorHandler');

class StatsService {
    /**
     * Get weight progress for a specific exercise over time.
     * Returns data points with date, weight, and total reps per session.
     */
    getWeightProgress(userId, exerciseName) {
        const db = getDb();

        if (!exerciseName) {
            throw new AppError('Nome do exercício é obrigatório', 400);
        }

        const data = db.prepare(`
            SELECT 
                ts.finished_at as date,
                w.name as workout_name,
                we.exercise_name,
                MAX(ss.weight_kg) as max_weight,
                AVG(ss.weight_kg) as avg_weight,
                SUM(ss.reps) as total_reps,
                COUNT(ss.id) as total_sets
            FROM session_sets ss
            JOIN training_sessions ts ON ss.session_id = ts.id
            JOIN workout_exercises we ON ss.workout_exercise_id = we.id
            JOIN workouts w ON we.workout_id = w.id
            WHERE ts.user_id = ? 
              AND we.exercise_name = ?
              AND ts.finished_at IS NOT NULL
            GROUP BY ts.id
            ORDER BY ts.finished_at ASC
        `).all(userId, exerciseName);

        return data;
    }

    /**
     * Get all unique exercise names the user has trained.
     */
    getExerciseList(userId) {
        const db = getDb();
        const exercises = db.prepare(`
            SELECT DISTINCT we.exercise_name
            FROM workout_exercises we
            JOIN workouts w ON we.workout_id = w.id
            WHERE w.user_id = ?
            ORDER BY we.exercise_name ASC
        `).all(userId);

        return exercises.map(e => e.exercise_name);
    }

    /**
     * Overview stats: total sessions, total workouts, current streak, etc.
     */
    getOverview(userId) {
        const db = getDb();

        const totalWorkouts = db.prepare(
            'SELECT COUNT(*) as count FROM workouts WHERE user_id = ?'
        ).get(userId).count;

        const totalSessions = db.prepare(
            'SELECT COUNT(*) as count FROM training_sessions WHERE user_id = ? AND finished_at IS NOT NULL'
        ).get(userId).count;

        const totalExercises = db.prepare(`
            SELECT COUNT(DISTINCT we.exercise_name) as count
            FROM workout_exercises we
            JOIN workouts w ON we.workout_id = w.id
            WHERE w.user_id = ?
        `).get(userId).count;

        const totalVolume = db.prepare(`
            SELECT COALESCE(SUM(ss.weight_kg * ss.reps), 0) as volume
            FROM session_sets ss
            JOIN training_sessions ts ON ss.session_id = ts.id
            WHERE ts.user_id = ? AND ts.finished_at IS NOT NULL
        `).get(userId).volume;

        // Last 7 days activity
        const recentSessions = db.prepare(`
            SELECT ts.finished_at, w.name as workout_name, ts.duration_seconds
            FROM training_sessions ts
            JOIN workouts w ON ts.workout_id = w.id
            WHERE ts.user_id = ? AND ts.finished_at IS NOT NULL
            ORDER BY ts.finished_at DESC
            LIMIT 7
        `).all(userId);

        // Week streak (consecutive days with sessions)
        const sessionsPerDay = db.prepare(`
            SELECT DISTINCT DATE(finished_at) as day
            FROM training_sessions
            WHERE user_id = ? AND finished_at IS NOT NULL
            ORDER BY day DESC
        `).all(userId);

        let streak = 0;
        const today = new Date();
        for (let i = 0; i < sessionsPerDay.length; i++) {
            const sessionDate = new Date(sessionsPerDay[i].day);
            const expectedDate = new Date(today);
            expectedDate.setDate(expectedDate.getDate() - i);

            if (sessionDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
                streak++;
            } else if (i === 0) {
                // If today doesn't have a session, check from yesterday
                expectedDate.setDate(expectedDate.getDate() - 1);
                if (sessionDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
                    streak++;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        return {
            totalWorkouts,
            totalSessions,
            totalExercises,
            totalVolume: Math.round(totalVolume),
            streak,
            recentSessions
        };
    }
}

module.exports = new StatsService();
