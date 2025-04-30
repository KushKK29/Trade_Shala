import mongoose from 'mongoose';

const strategySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stock_symbol: {
        type: String,
        required: true
    },
    trade_type: {
        type: String,
        required: true
    },
    strategy_date: {
        type: Date,
        default: Date.now
    },
    target: {
        type: String,
        default: 0
    },
    sl: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

const Strategy = mongoose.model('Strategy', strategySchema);
export default Strategy;