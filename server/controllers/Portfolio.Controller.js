import Portfolio from "../models/Portfolio.Model.js";

const PortfolioController = {
    getPortfolioByUserId: async (req, res) => {
        try {
            const { userId } = req.params;
            const portfolios = await Portfolio.find({ user_id: userId }).populate('user_id');
            console.log(portfolios);
            res.status(200).json(portfolios);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching portfolios', error });
        }
    }
}

export default PortfolioController;