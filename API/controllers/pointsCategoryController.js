const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

const userOrDefaultFilter = (userId) => ({ $or: [{ userId }, { default: true }] });

async function findCategoryById(id, userId) {
    const db = getDB().collection('PointCategory');
    const byId = await db.findOne({ id, ...userOrDefaultFilter(userId) });
    if (byId) return byId;
    if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
        return await db.findOne({ _id: new ObjectId(id), ...userOrDefaultFilter(userId) });
    }
    return null;
}

const getAllPointsCategories = async (req, res, next) => {
    try {
        const pointsCategories = await getDB().collection('PointCategory').find(userOrDefaultFilter(req.userId)).toArray();
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

const createPointsCategory = async (req, res, next) => {
    try {
        const { name, value } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }
        const numValue = Number(value);
        if (Number.isNaN(numValue) || numValue < 0) {
            return res.status(400).json({
                success: false,
                message: 'Points value must be a non-negative number'
            });
        }
        const doc = {
            name: name.trim(),
            value: numValue,
            userId: req.userId,
            default: req.body.default === true
        };
        const result = await getDB().collection('PointCategory').insertOne(doc);
        const pointsCategory = { ...doc, _id: result.insertedId };
        res.status(201).json({
            success: true,
            message: 'Points category created successfully',
            pointsCategory
        });
    } catch (err) {
        next(err);
    }
};

const updatePointsCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await findCategoryById(id, req.userId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Points category not found' });
        }
        if (category.default === true && category.userId !== req.userId) {
            return res.status(403).json({ success: false, message: 'Cannot modify default category' });
        }
        const { name, value } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }
        const numValue = Number(value);
        if (Number.isNaN(numValue) || numValue < 0) {
            return res.status(400).json({ success: false, message: 'Points value must be a non-negative number' });
        }
        const filter = category.id != null ? { id: category.id, userId: req.userId } : { _id: category._id, userId: req.userId };
        await getDB().collection('PointCategory').updateOne(filter, {
            $set: { name: name.trim(), value: numValue }
        });
        const updated = { ...category, name: name.trim(), value: numValue };
        res.json({ success: true, message: 'Points category updated', pointsCategory: updated });
    } catch (err) {
        next(err);
    }
};

const deletePointsCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await findCategoryById(id, req.userId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Points category not found' });
        }
        if (category.default === true && category.userId !== req.userId) {
            return res.status(403).json({ success: false, message: 'Cannot delete default category' });
        }
        const filter = category.id != null ? { id: category.id, userId: req.userId } : { _id: category._id, userId: req.userId };
        await getDB().collection('PointCategory').deleteOne(filter);
        res.json({ success: true, message: 'Points category deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllPointsCategories,
    createPointsCategory,
    updatePointsCategory,
    deletePointsCategory
};