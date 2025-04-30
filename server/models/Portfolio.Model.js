import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User"
    },
    holdings: [
        {
            stock_symbol: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            average_price: {
                type: Number,
                required: true
            },
            trade_type: {
                type: String,
            },
        }
    ]
},
    {
        timestamps: true
    });

const Portfolio = mongoose.model("Portfolio", portfolioSchema);
export default Portfolio;
