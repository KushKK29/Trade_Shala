import { Router } from 'express';
import { createStrategy, deleteStrategy, getAllStrategies } from '../controllers/Strategy.Controller.js';

const router = Router();

router.get('/strategy', getAllStrategies);

router.post('/strategy', createStrategy);

router.delete('/strategy/:id', deleteStrategy);

export default router;
