import { MongoClient, ObjectId } from 'mongodb';

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const getAllClasses = async (req, res) => {
    try {
        const classes = await mongoClient.db('apple-on-the-desk').collection('classes').find().toArray();
        return {
            success: true,
            message: 'Classes found successfully',
            classes: classes
        };
    } catch (err) {
        return {
            success: false,
            message: 'Failed to get classes',
            error: err.message
        };
    }
};

const getClassById = async (req, res) => {
    try {
        const classData = await mongoClient.db('apple-on-the-desk').collection('classes').findOne({ _id: new ObjectId(req.params.id) });
        return {
            success: true,
            message: 'Class found successfully',
            class: classData
        };
    } catch (err) {
        return {
            success: false,
            message: 'Failed to get class by id',
            error: err.message
        };
    }
};

const createClass = async (req, res) => {
    try {
        const classData = await mongoClient.db('apple-on-the-desk').collection('classes').insertOne(req.body);
        return {
            success: true,
            message: 'Class created successfully',
            class: classData
        };
    } catch (err) {
        return {
            success: false,
            message: 'Failed to create class',
            error: err.message
        };
    }
};

const updateClass = async (req, res) => {
    try {
        const classData = await mongoClient.db('apple-on-the-desk').collection('classes').updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
        return {
            success: true,
            message: 'Class updated successfully',
            class: classData
        };
    } catch (err) {
        return {
            success: false,
            message: 'Failed to update class',
            error: err.message
        };
    }
};

const deleteClass = async (req, res) => {
    try {
        const classData = await mongoClient.db('apple-on-the-desk').collection('classes').deleteOne({ _id: new ObjectId(req.params.id) });
        return {
            success: true,
            message: 'Class deleted successfully',
            class: classData
        };
    } catch (err) {
        return {
            success: false,
            message: 'Failed to delete class',
            error: err.message
        };
    }
};

module.exports = {
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
};