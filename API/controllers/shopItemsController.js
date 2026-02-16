const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

const getShopItems = async (req, res, next) => {
    try {
        const shopItems = await getDB().collection('ShopItem').find().sort({ cost: 1 }).toArray();
        res.json({
            success: true,
            message: 'Shop items found successfully',
            shopItems: shopItems
        });
    } catch (err) {
        next(err);
    }
};

const createShopItem = async (req, res, next) => {
    try {
        const { name, cost } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Shop item name is required'
            });
        }
        const numCost = Number(cost);
        if (Number.isNaN(numCost) || numCost < 0) {
            return res.status(400).json({
                success: false,
                message: 'Cost must be a non-negative number'
            });
        }
        const doc = {
            name: name.trim(),
            cost: numCost
        };
        const result = await getDB().collection('ShopItem').insertOne(doc);
        const shopItem = { ...doc, _id: result.insertedId };
        res.status(201).json({
            success: true,
            message: 'Shop item created successfully',
            shopItem
        });
    } catch (err) {
        next(err);
    }
};

const updateShopItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid shop item id' });
        }
        const existing = await getDB().collection('ShopItem').findOne({ _id: new ObjectId(id) });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Shop item not found' });
        }
        const { name, cost } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Shop item name is required' });
        }
        const numCost = Number(cost);
        if (Number.isNaN(numCost) || numCost < 0) {
            return res.status(400).json({ success: false, message: 'Cost must be a non-negative number' });
        }
        await getDB().collection('ShopItem').updateOne(
            { _id: new ObjectId(id) },
            { $set: { name: name.trim(), cost: numCost } }
        );
        const shopItem = { ...existing, name: name.trim(), cost: numCost };
        res.json({ success: true, message: 'Shop item updated', shopItem });
    } catch (err) {
        next(err);
    }
};

const deleteShopItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid shop item id' });
        }
        const result = await getDB().collection('ShopItem').deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Shop item not found' });
        }
        res.json({ success: true, message: 'Shop item deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getShopItems,
    createShopItem,
    updateShopItem,
    deleteShopItem
};