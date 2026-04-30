const exercisesService = require('./exercises.service');

class ExercisesController {
    getByWorkout(req, res, next) {
        try {
            const exercises = exercisesService.getByWorkout(parseInt(req.params.workoutId), req.userId);
            res.json(exercises);
        } catch (err) { next(err); }
    }

    create(req, res, next) {
        try {
            const exercise = exercisesService.create(parseInt(req.params.workoutId), req.userId, req.body);
            res.status(201).json(exercise);
        } catch (err) { next(err); }
    }

    update(req, res, next) {
        try {
            const exercise = exercisesService.update(parseInt(req.params.id), req.userId, req.body);
            res.json(exercise);
        } catch (err) { next(err); }
    }

    delete(req, res, next) {
        try {
            exercisesService.delete(parseInt(req.params.id), req.userId);
            res.status(204).send();
        } catch (err) { next(err); }
    }
}

module.exports = new ExercisesController();
