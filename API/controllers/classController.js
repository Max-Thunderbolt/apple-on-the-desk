const { getDB } = require('../config/database');
const { generateGroups, clearGroups, getStudentsByGroup } = require('../utils/groupingAlgorithm');

const userOrDefaultFilter = (userId) => ({ $or: [{ userId }, { default: true }] });

const getAllClasses = async (req, res) => {
    try {
        const classes = await getDB().collection('Class').find(userOrDefaultFilter(req.userId)).toArray();
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
        const classData = await getDB().collection('Class').find(userOrDefaultFilter(req.userId)).sort({ name: 1 }).toArray();
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
        const classData = await getDB().collection('Class').findOne({
            id: req.params.id,
            ...userOrDefaultFilter(req.userId)
        });
        if (!classData) {
            return res.status(404).json({
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
        const doc = { ...req.body, userId: req.userId, default: req.body.default === true };
        const result = await getDB().collection('Class').insertOne(doc);
        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            class: { _id: result.insertedId, ...doc }
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
            { id: req.params.id, userId: req.userId },
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
        const result = await getDB().collection('Class').deleteOne({ id: req.params.id, userId: req.userId });
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
                { id: req.params.id, userId: req.userId },
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
            const classDoc = await getDB().collection('Class').findOne({ id: req.params.id, userId: req.userId }, { projection: { students: 1 } });
            if (!classDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found'
                });
            }
            await getDB().collection('Class').updateOne(
                { id: req.params.id, userId: req.userId },
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
        const classDoc = await getDB().collection('Class').findOne({ id: classId, userId: req.userId });
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Get the points category (check both id and _id fields), scoped to user
        const { ObjectId } = require('mongodb');
        let category = await getDB().collection('PointCategory').findOne({ id: categoryId, userId: req.userId });
        if (!category) {
            if (ObjectId.isValid(categoryId)) {
                category = await getDB().collection('PointCategory').findOne({ _id: new ObjectId(categoryId), userId: req.userId });
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
            { id: classId, userId: req.userId },
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

const generateGroupsForClass = async (req, res) => {
    try {
        const { numberOfGroups } = req.body;
        const classId = req.params.id;

        // Validate input
        if (!numberOfGroups || numberOfGroups <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Number of groups must be greater than 0'
            });
        }

        // Get the class
        const classDoc = await getDB().collection('Class').findOne({ id: classId, userId: req.userId });
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const students = classDoc.students || [];

        if (students.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create groups for a class with no students'
            });
        }

        // Ensure students have the required fields
        const studentsWithDefaults = students.map(s => ({
            ...s,
            cannotPairWith: s.cannotPairWith || [],
            group: s.group || null
        }));

        // Generate groups using the algorithm
        try {
            const studentsWithGroups = generateGroups(studentsWithDefaults, numberOfGroups);

            // Update the class with new student data
            await getDB().collection('Class').updateOne(
                { id: classId, userId: req.userId },
                { $set: { students: studentsWithGroups } }
            );

            return res.json({
                success: true,
                message: 'Groups generated successfully',
                students: studentsWithGroups
            });
        } catch (algorithmError) {
            return res.status(400).json({
                success: false,
                message: algorithmError.message
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error generating groups',
            error: err.message
        });
    }
};

const getGroups = async (req, res) => {
    try {
        const classId = req.params.id;

        // Get the class
        const classDoc = await getDB().collection('Class').findOne({ id: classId, userId: req.userId });
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const students = classDoc.students || [];
        const groupedStudents = getStudentsByGroup(students);

        return res.json({
            success: true,
            groups: groupedStudents
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error getting groups',
            error: err.message
        });
    }
};

const clearGroupsForClass = async (req, res) => {
    try {
        const classId = req.params.id;

        // Get the class
        const classDoc = await getDB().collection('Class').findOne({ id: classId, userId: req.userId });
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const students = classDoc.students || [];
        const studentsWithoutGroups = clearGroups(students);

        // Update the class
        await getDB().collection('Class').updateOne(
            { id: classId, userId: req.userId },
            { $set: { students: studentsWithoutGroups } }
        );

        return res.json({
            success: true,
            message: 'Groups cleared successfully',
            students: studentsWithoutGroups
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error clearing groups',
            error: err.message
        });
    }
};

const updateStudentConstraints = async (req, res) => {
    try {
        const classId = req.params.id;
        const studentId = req.params.studentId;
        const { cannotPairWith } = req.body;

        // Validate input
        if (!Array.isArray(cannotPairWith)) {
            return res.status(400).json({
                success: false,
                message: 'cannotPairWith must be an array'
            });
        }

        // Get the class
        const classDoc = await getDB().collection('Class').findOne({ id: classId, userId: req.userId });
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Find and update the student
        const students = classDoc.students || [];
        const studentIndex = students.findIndex(s => s.id === studentId);

        if (studentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Update the student's constraints
        students[studentIndex].cannotPairWith = cannotPairWith;

        // Update the class
        await getDB().collection('Class').updateOne(
            { id: classId, userId: req.userId },
            { $set: { students: students } }
        );

        return res.json({
            success: true,
            message: 'Student constraints updated successfully',
            student: students[studentIndex]
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error updating student constraints',
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
    generateGroupsForClass,
    getGroups,
    clearGroupsForClass,
    updateStudentConstraints,
};