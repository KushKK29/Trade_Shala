import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    stock_symbol: {
        type: String,
        required: true
    },
    order_type: {
        type: String,
        required: true,
        enum: ["market", "limit"]
    },
    order_category: {
        type: String,
        required: true,
        enum: ["intraday", "delivery"]
    },
    type: {
        type: String,
        required: true,
        enum: ["buy", "sell"]
    },
    quantity: {
        type: Number,
        required: true
    },
    execution_price: {
        type: Number,
        required: true
    },
    completion_price: {
        type: Number,
    },
    limit_price: {
        type: Number,
        required: function () { return this.order_type === 'limit'; }
    },
    completed_time: {
        type: Date
    },
    order_status: {
        type: String,
        required: true,
        enum: ["pending", "completed", "cancelled", "executed"]
    },
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User"
    },
    stock_id: {
        type: mongoose.Types.ObjectId,
        ref: "Stock"
    }
},
    {
        timestamps: true
    }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
