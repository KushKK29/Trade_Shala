import Order from "../models/Order.Model.js";

const OrderController = {
    getOrdersByUserId: async (req, res) => {
        try {
            const user_id = req.params.userId; // Assuming userId is passed as a route parameter
            if (!user_id) {
                return res.status(400).json({ message: "User ID is required." });
            }
            // Fetch orders from the database (replace with your actual data fetching logic)
            const orders = await Order.find({ user_id }); // Assuming you have an OrderModel

            if (orders.length === 0) {
                return res.status(404).json({ message: "No orders found for this user." });
            }
            return res.status(200).json({ data: orders });
        } catch (error) {
            console.error('Internal server error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    },
    createOrder: async (req, res) => {
        try {
            const { stock_symbol, order_type, order_category, type, quantity, price, limit_price, user_id, 
                order_status, execution_price, completion_price } = req.body;
                console.log('req body is ',req.body);
            // Validate required fields
            if (!stock_symbol || !order_type || !order_category || !type || !quantity || !user_id) {
                return res.status(400).json({ message: "All fields are required." });
            }

            // Create a new order
            const newOrder = new Order({
                stock_symbol,
                order_type,
                order_category,
                type,
                quantity,
                price,
                limit_price,
                user_id,
                order_status,
                execution_price,
                completion_price
            });
            console.log('new order before save is ',newOrder);
            // Save the order to the database
            await newOrder.save();
            console.log('new order after save is ',newOrder);
            return res.status(201).json({ message: "Order created successfully.", data: newOrder });
        } catch (error) {
            console.error('Internal server error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    },
    updateOrderStatus: async (req, res) => {
        try {
            const { orderId, order_status } = req.body;

            // Validate required fields
            if (!orderId || !order_status) {
                return res.status(400).json({ message: "Order ID and status are required." });
            }

            // Update the order status in the database
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                { order_status },
                { new: true, runValidators: true }
            );

            if (!updatedOrder) {
                return res.status(404).json({ message: "Order not found." });
            }

            return res.status(200).json({ message: "Order status updated successfully.", data: updatedOrder });
        } catch (error) {
            console.error('Internal server error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    }
};

export default OrderController;