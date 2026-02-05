const { getDB } = require('../config/database');

const getAllPointsCategories = async (req, res, next) => {
    try {
        const pointsCategories = await getDB().collection('PointCategory').find().toArray();
        if (!pointsCategories) {
            return res.status(404).json({
                success: false,
                message: 'Points categories not found'
            });
        }
        res.json({
            success: true,
            message: 'Points categories found successfully',
            pointsCategories: pointsCategories
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllPointsCategories
};