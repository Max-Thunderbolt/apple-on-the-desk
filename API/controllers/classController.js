const { getDB } = require('../config/database');

const getAllClasses = async (req, res, next) => {
    try {
        const classes = await getDB().collection('Class').find().toArray();
        res.json({
            success: true,
            message: 'Classes found successfully',
            classes: classes
        });
    } catch (err) {
        next(err);
    }
};

const getClassNames = async (req, res, next) => {
    try {
        const classData = await getDB().collection('Class').find().toArray();
        let classesData = [];
        for (const classItem of classData) {
            classesData.push({
                name: classItem.name,
                numberOfStudents: classItem.students.length,
                id: classItem.id,
                experience: classItem.experience ?? 0
            });
        }
        res.json({
            success: true,
            message: 'Classes data found successfully',
            classes: classesData
        });
    } catch (err) {
        next(err);
    }
};

const getClassById = async (req, res, next) => {
    try {
        const classData = await getDB().collection('Class').findOne({ id: req.params.id });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        res.json({
            success: true,
            class: classData
        });
    } catch (err) {
        next(err);
    }
};

const createClass = async (req, res, next) => {
    try {
        const result = await getDB().collection('Class').insertOne(req.body);
        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            class: { _id: result.insertedId, ...req.body }
        });
    } catch (err) {
        next(err);
    }
};

const updateClass = async (req, res, next) => {
    try {
        const result = await getDB().collection('Class').updateOne(
            { id: req.params.id },
            { $set: req.body }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        res.json({
            success: true,
            message: 'Class updated successfully',
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        next(err);
    }
};

const deleteClass = async (req, res, next) => {
    try {
        const result = await getDB().collection('Class').deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        res.json({
            success: true,
            message: 'Class deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllClasses,
    getClassNames,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
};