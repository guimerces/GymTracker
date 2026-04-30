const { Router } = require('express');
const workoutsController = require('./workouts.controller');
const authMiddleware = require('../../middleware/auth');

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => workoutsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => workoutsController.getById(req, res, next));
router.post('/', (req, res, next) => workoutsController.create(req, res, next));
router.put('/:id', (req, res, next) => workoutsController.update(req, res, next));
router.delete('/:id', (req, res, next) => workoutsController.delete(req, res, next));
router.put('/reorder/batch', (req, res, next) => workoutsController.reorder(req, res, next));

module.exports = router;
