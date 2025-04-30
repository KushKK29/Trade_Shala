import express from 'express';
import PortfolioController from '../controllers/Portfolio.Controller.js';

const router = express.Router();

router.get('/portfolio/user/:userId', PortfolioController.getPortfolioByUserId);

export default router;