const { getDB } = require('../config/database');
const { getAuth } = require('../config/firebaseAdmin');

/**
 * Delete the current user's account:
 * 1. Delete all Class, ShopItem, PointCategory documents for this userId
 * 2. Delete the Firebase Auth user
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const db = getDB();

    const [classResult, shopResult, pointsResult] = await Promise.all([
      db.collection('Class').deleteMany({ userId }),
      db.collection('ShopItem').deleteMany({ userId }),
      db.collection('PointCategory').deleteMany({ userId })
    ]);

    const auth = getAuth();
    if (!auth) {
      return res.status(503).json({
        success: false,
        message: 'Auth not configured; user data was deleted but Firebase account was not removed.'
      });
    }

    await auth.deleteUser(userId);

    res.json({
      success: true,
      message: 'Account and all associated data deleted',
      deleted: {
        classes: classResult.deletedCount,
        shopItems: shopResult.deletedCount,
        pointsCategories: pointsResult.deletedCount
      }
    });
  } catch (err) {
    console.error('Delete account error:', err);
    const status = err.code === 'auth/user-not-found' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Failed to delete account'
    });
  }
};

module.exports = { deleteAccount };
