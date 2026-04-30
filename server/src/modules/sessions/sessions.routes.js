const { Router } = require('express');
const sessionsController = require('./sessions.controller');
const authMiddleware = require('../../middleware/auth');

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res, next) => sessionsController.getAll(req, res, next));
router.get('/suggest', (req, res, next) => sessionsController.suggest(req, res, next));
router.get('/active', (req, res, next) => sessionsController.getActive(req, res, next));
router.post('/', (req, res, next) => sessionsController.start(req, res, next));
router.put('/:id/finish', (req, res, next) => sessionsController.finish(req, res, next));
router.get('/:id/sets', (req, res, next) => sessionsController.getSets(req, res, next));
router.post('/:id/sets', (req, res, next) => sessionsController.addSet(req, res, next));
router.delete('/:id/sets/:setId', (req, res, next) => sessionsController.deleteSet(req, res, next));

module.exports = router;
