const { getDB } = require('../config/database');

const getShopItems = async (req, res, next) => {
    try {
        const shopItems = await getDB().collection('ShopItem').find().toArray();
        res.json({
            success: true,
            message: 'Shop items found successfully',
            shopItems: shopItems
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getShopItems
};