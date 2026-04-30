const statsService = require('./stats.service');

class StatsController {
    getWeightProgress(req, res, next) {
        try {
            const data = statsService.getWeightProgress(req.userId, req.query.exercise);
            res.json(data);
        } catch (err) { next(err); }
    }

    getExerciseList(req, res, next) {
        try {
            const exercises = statsService.getExerciseList(req.userId);
            res.json(exercises);
        } catch (err) { next(err); }
    }

    getOverview(req, res, next) {
        try {
            const overview = statsService.getOverview(req.userId);
            res.json(overview);
        } catch (err) { next(err); }
    }
}

module.exports = new StatsController();
