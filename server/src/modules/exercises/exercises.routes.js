const { Router } = require('express');
const exercisesController = require('./exercises.controller');
const authMiddleware = require('../../middleware/auth');

const router = Router();

router.use(authMiddleware);

// Routes nested under /api/workouts/:workoutId/exercises
router.get('/workouts/:workoutId/exercises', (req, res, next) => exercisesController.getByWorkout(req, res, next));
router.post('/workouts/:workoutId/exercises', (req, res, next) => exercisesController.create(req, res, next));

// Routes for individual exercises
router.put('/exercises/:id', (req, res, next) => exercisesController.update(req, res, next));
router.delete('/exercises/:id', (req, res, next) => exercisesController.delete(req, res, next));

module.exports = router;
