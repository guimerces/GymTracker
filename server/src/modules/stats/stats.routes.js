const { Router } = require('express');
const statsController = require('./stats.controller');
const authMiddleware = require('../../middleware/auth');

const router = Router();

router.use(authMiddleware);

router.get('/weight-progress', (req, res, next) => statsController.getWeightProgress(req, res, next));
router.get('/exercises', (req, res, next) => statsController.getExerciseList(req, res, next));
router.get('/overview', (req, res, next) => statsController.getOverview(req, res, next));

module.exports = router;
