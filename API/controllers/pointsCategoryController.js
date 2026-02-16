const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

async function findCategoryById(id) {
    const db = getDB().collection('PointCategory');
    const byId = await db.findOne({ id });
    if (byId) return byId;
    if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
        return await db.findOne({ _id: new ObjectId(id) });
    }
    return null;
}

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
            value: numValue
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
        const category = await findCategoryById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Points category not found' });
        }
        const { name, value } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }
        const numValue = Number(value);
        if (Number.isNaN(numValue) || numValue < 0) {
            return res.status(400).json({ success: false, message: 'Points value must be a non-negative number' });
        }
        const filter = category.id != null ? { id: category.id } : { _id: category._id };
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
        const category = await findCategoryById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Points category not found' });
        }
        const filter = category.id != null ? { id: category.id } : { _id: category._id };
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