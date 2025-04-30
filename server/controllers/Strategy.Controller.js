import Strategy from "../models/Marketplace.Model.js";

// Create new strategy
export const createStrategy = async (req, res) => {
    try {
        const strategy = new Strategy(req.body);
        await strategy.save();
        res.status(201).json({ message: 'Strategy uploaded successfully', strategy });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading strategy', error });
    }
};

// Get all strategies
export const getAllStrategies = async (req, res) => {
    try {
        const strategies = await Strategy.find().populate('author');
        res.status(200).json(strategies);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching strategies', error });
    }
};

// Get single strategy by ID
export const getStrategyById = async (req, res) => {
    try {
        const strategy = await Strategy.findById(req.params.id).populate('author', 'name email');
        if (!strategy) return res.status(404).json({ message: 'Strategy not found' });
        res.status(200).json(strategy);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching strategy', error });
    }
};

// Update strategy
export const updateStrategy = async (req, res) => {
    try {
        const updatedStrategy = await Strategy.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedStrategy) return res.status(404).json({ message: 'Strategy not found' });
        res.status(200).json(updatedStrategy);
    } catch (error) {
        res.status(500).json({ message: 'Error updating strategy', error });
    }
};

// Delete strategy
export const deleteStrategy = async (req, res) => {
    try {
        const deletedStrategy = await Strategy.findByIdAndDelete(req.params.id);
        if (!deletedStrategy) return res.status(404).json({ message: 'Strategy not found' });
        res.status(200).json({ message: 'Strategy deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting strategy', error });
    }
};
