const workoutsService = require('./workouts.service');

class WorkoutsController {
    getAll(req, res, next) {
        try {
            const workouts = workoutsService.getAll(req.userId);
            res.json(workouts);
        } catch (err) { next(err); }
    }

    getById(req, res, next) {
        try {
            const workout = workoutsService.getById(parseInt(req.params.id), req.userId);
            res.json(workout);
        } catch (err) { next(err); }
    }

    create(req, res, next) {
        try {
            const workout = workoutsService.create(req.userId, req.body.name);
            res.status(201).json(workout);
        } catch (err) { next(err); }
    }

    update(req, res, next) {
        try {
            const workout = workoutsService.update(parseInt(req.params.id), req.userId, req.body);
            res.json(workout);
        } catch (err) { next(err); }
    }

    delete(req, res, next) {
        try {
            workoutsService.delete(parseInt(req.params.id), req.userId);
            res.status(204).send();
        } catch (err) { next(err); }
    }

    reorder(req, res, next) {
        try {
            const workouts = workoutsService.reorder(req.userId, req.body.workoutIds);
            res.json(workouts);
        } catch (err) { next(err); }
    }
}

module.exports = new WorkoutsController();
