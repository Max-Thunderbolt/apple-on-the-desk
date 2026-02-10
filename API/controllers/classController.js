const { getDB } = require('../config/database');

const getAllClasses = async (req, res) => {
    try {
        const classes = await getDB().collection('Class').find().toArray();
        res.json({
            success: true,
            message: 'Classes found successfully',
            classes: classes
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error getting classes',
            error: err.message
        });
    }
};

const getClassNames = async (req, res) => {
    try {
        const classData = await getDB().collection('Class').find().sort({ name: 1 }).toArray();
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
        res.status(500).json({
            success: false,
            message: 'Error getting class names',
            error: err.message
        });
    }
};

const getClassById = async (req, res) => {
    try {
        const classData = await getDB().collection('Class').findOne({ id: req.params.id });
        if (!classData) {
            res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        if (Array.isArray(classData.students)) {
            classData.students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
        res.json({
            success: true,
            class: classData
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error getting class by id',
            error: err.message
        });
    }
};

const createClass = async (req, res) => {
    try {
        const result = await getDB().collection('Class').insertOne(req.body);
        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            class: { _id: result.insertedId, ...req.body }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error creating class',
            error: err.message
        });
    }
};

const updateClass = async (req, res) => {
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
        res.status(500).json({
            success: false,
            message: 'Error updating class',
            error: err.message
        });
    }
};

const deleteClass = async (req, res) => {
    try {
        const result = await getDB().collection('Class').deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }
        res.json({
            success: true,
            message: 'Class deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error deleting class',
            error: err.message
        });
    }
};

const updateStudentPoints = async (req, res) => {
    try {
        if (Array.isArray(req.body.students)) {
            // This is the full student array, so we need to update Class.students with the new array
            const result = await getDB().collection('Class').updateOne(
                { id: req.params.id },
                { $set: { students: req.body.students } }
            );
            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found'
                });
            }
            return res.json({
                success: true,
                message: 'Student points updated successfully'
            });
        } else {
            // This is a single student, so we need to update Class.students with the new student
            const classDoc = await getDB().collection('Class').findOne({ id: req.params.id }, { projection: { students: 1 } });
            if (!classDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found'
                });
            }
            await getDB().collection('Class').updateOne(
                { id: req.params.id },
                { $set: { students: [...classDoc.students, req.body.students] } }
            );
            return res.json({
                success: true,
                message: 'Student points updated successfully',
                students: [...classDoc.students, req.body.students]
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error updating student points',
            error: err.message
        });
    }
};

const awardPoints = async (req, res) => {
    try {
        const { categoryId, selectedStudentIds } = req.body;
        const classId = req.params.id;

        // Get the class
        const classDoc = await getDB().collection('Class').findOne({ id: classId });
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Get the points category (check both id and _id fields)
        let category = await getDB().collection('PointCategory').findOne({ id: categoryId });
        if (!category) {
            // Try finding by _id (MongoDB ObjectId)
            const { ObjectId } = require('mongodb');
            if (ObjectId.isValid(categoryId)) {
                category = await getDB().collection('PointCategory').findOne({ _id: new ObjectId(categoryId) });
            }
        }
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Points category not found'
            });
        }

        const allStudents = classDoc.students || [];
        const selectedStudents = allStudents.filter(s => selectedStudentIds.includes(s.id));

        if (selectedStudents.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid students selected'
            });
        }

        // Calculate points: if awarding to whole class, each gets value/10, otherwise full value
        const isWholeClass = selectedStudentIds.length === allStudents.length;
        const pointsToAward = isWholeClass ? Math.floor(category.value / 10) : category.value;
        const experienceToAward = Math.floor(category.value / 2);
        
        console.log('=== AWARD POINTS DEBUG ===');
        console.log('Received categoryId:', categoryId);
        console.log('Found category:', category.name, 'Value:', category.value);
        console.log('Total students:', allStudents.length);
        console.log('Selected students:', selectedStudentIds.length);
        console.log('Is whole class:', isWholeClass);
        console.log('Points to award per student:', pointsToAward);
        console.log('Experience to award to class:', experienceToAward);
        console.log('========================');

        // Update student points
        const updatedStudents = allStudents.map(student => {
            if (selectedStudentIds.includes(student.id)) {
                return {
                    ...student,
                    points: (student.points || 0) + pointsToAward
                };
            }
            return student;
        });

        // Update class with new student points and experience
        const newExperience = (classDoc.experience || 0) + experienceToAward;
        await getDB().collection('Class').updateOne(
            { id: classId },
            { 
                $set: { 
                    students: updatedStudents,
                    experience: newExperience
                } 
            }
        );

        return res.json({
            success: true,
            message: 'Points awarded successfully',
            students: updatedStudents,
            experience: newExperience,
            pointsAwarded: pointsToAward
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error awarding points',
            error: err.message
        });
    }
};

module.exports = {
    getAllClasses,
    getClassNames,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
    updateStudentPoints,
    awardPoints,
};