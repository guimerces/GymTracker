const sessionsService = require('./sessions.service');

class SessionsController {
    getAll(req, res, next) {
        try {
            const sessions = sessionsService.getAll(req.userId, parseInt(req.query.limit) || 20);
            res.json(sessions);
        } catch (err) { next(err); }
    }

    suggest(req, res, next) {
        try {
            const suggestion = sessionsService.suggest(req.userId);
            res.json(suggestion);
        } catch (err) { next(err); }
    }

    getActive(req, res, next) {
        try {
            const session = sessionsService.getActive(req.userId);
            res.json(session);
        } catch (err) { next(err); }
    }

    start(req, res, next) {
        try {
            const session = sessionsService.start(req.userId, req.body.workout_id);
            res.status(201).json(session);
        } catch (err) { next(err); }
    }

    finish(req, res, next) {
        try {
            const session = sessionsService.finish(
                parseInt(req.params.id), 
                req.userId,
                req.body.duration_seconds
            );
            res.json(session);
        } catch (err) { next(err); }
    }

    getSets(req, res, next) {
        try {
            const sets = sessionsService.getSets(parseInt(req.params.id), req.userId);
            res.json(sets);
        } catch (err) { next(err); }
    }

    addSet(req, res, next) {
        try {
            const set = sessionsService.addSet(parseInt(req.params.id), req.userId, req.body);
            res.status(201).json(set);
        } catch (err) { next(err); }
    }

    deleteSet(req, res, next) {
        try {
            sessionsService.deleteSet(parseInt(req.params.setId), req.userId);
            res.status(204).send();
        } catch (err) { next(err); }
    }
}

module.exports = new SessionsController();
