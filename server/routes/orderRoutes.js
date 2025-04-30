import express from 'express';
import OrderController from '../controllers/Order.Controller.js';

const router = express.Router();

router.get('/order/user/:userId', OrderController.getOrdersByUserId);
router.post('/order', OrderController.createOrder);
router.put('/order/update-status', OrderController.updateOrderStatus);

export default router;