/**
 * Grouping Algorithm for Student Assignment
 * Assigns students to groups while respecting pairing constraints
 */

/**
 * Generates group assignments for students based on constraints
 * @param {Array} students - Array of student objects with id, name, cannotPairWith
 * @param {Number} numberOfGroups - Number of groups to create
 * @returns {Array} Students array with group assignments
 */
function generateGroups(students, numberOfGroups) {
    // Validate inputs
    if (!students || students.length === 0) {
        throw new Error('No students to group');
    }

    if (numberOfGroups <= 0) {
        throw new Error('Number of groups must be greater than 0');
    }

    if (numberOfGroups > students.length) {
        throw new Error('Number of groups cannot exceed number of students');
    }

    // Calculate target group size
    const groupSize = Math.ceil(students.length / numberOfGroups);

    // Initialize groups with names C02, C03, C04, etc.
    const groups = [];
    for (let i = 0; i < numberOfGroups; i++) {
        const groupNumber = i + 2; // Start from C02
        const groupName = `C${String(groupNumber).padStart(2, '0')}`;
        groups.push({
            name: groupName,
            members: [],
            memberNames: new Set() // For quick constraint checking
        });
    }

    // Create a copy of students to avoid mutating input
    const studentsCopy = students.map(s => ({
        ...s,
        cannotPairWith: s.cannotPairWith || [],
        group: null
    }));

    // Sort students by number of constraints (most constrained first)
    studentsCopy.sort((a, b) => {
        const aConstraints = (a.cannotPairWith || []).length;
        const bConstraints = (b.cannotPairWith || []).length;
        return bConstraints - aConstraints;
    });

    // Try to assign students to groups
    const assigned = assignStudentsToGroups(studentsCopy, groups, groupSize);

    if (!assigned) {
        throw new Error('Unable to create valid groups with the given constraints. Please review pairing constraints and try again.');
    }

    // Return students with their group assignments
    return studentsCopy;
}

/**
 * Assigns students to groups using greedy algorithm with backtracking
 * @param {Array} students - Students to assign
 * @param {Array} groups - Group objects
 * @param {Number} groupSize - Target size for each group
 * @returns {Boolean} True if assignment successful
 */
function assignStudentsToGroups(students, groups, groupSize) {
    // Reset all assignments
    students.forEach(s => s.group = null);
    groups.forEach(g => {
        g.members = [];
        g.memberNames = new Set();
    });

    // Try to assign each student
    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        let assigned = false;

        // Try to find a valid group for this student
        // Prefer smaller groups first to balance sizes
        const sortedGroups = [...groups].sort((a, b) => a.members.length - b.members.length);

        for (const group of sortedGroups) {
            // Check if group is not full
            if (group.members.length >= groupSize && i < students.length - (students.length % groups.length)) {
                continue; // Skip full groups unless we're in the remainder
            }

            // Check constraints: can this student be in this group?
            if (canStudentJoinGroup(student, group)) {
                // Assign student to group
                student.group = group.name;
                group.members.push(student);
                group.memberNames.add(student.name);
                assigned = true;
                break;
            }
        }

        if (!assigned) {
            // Could not assign this student to any group
            return false;
        }
    }

    return true;
}

/**
 * Check if a student can join a group without violating constraints
 * @param {Object} student - Student to check
 * @param {Object} group - Group to check
 * @returns {Boolean} True if student can join group
 */
function canStudentJoinGroup(student, group) {
    const cannotPairWith = student.cannotPairWith || [];

    // Check if any member in the group is in the student's cannot-pair-with list
    for (const memberName of group.memberNames) {
        if (cannotPairWith.includes(memberName)) {
            return false;
        }
    }

    // Also check if any group member has this student in their cannot-pair-with list
    for (const member of group.members) {
        const memberConstraints = member.cannotPairWith || [];
        if (memberConstraints.includes(student.name)) {
            return false;
        }
    }

    return true;
}

/**
 * Clear all group assignments from students
 * @param {Array} students - Students array
 * @returns {Array} Students with group set to null
 */
function clearGroups(students) {
    return students.map(s => ({
        ...s,
        group: null
    }));
}

/**
 * Get students organized by group
 * @param {Array} students - Students array
 * @returns {Object} Object with group names as keys and student arrays as values
 */
function getStudentsByGroup(students) {
    const groupedStudents = {};

    students.forEach(student => {
        if (student.group) {
            if (!groupedStudents[student.group]) {
                groupedStudents[student.group] = [];
            }
            groupedStudents[student.group].push(student);
        }
    });

    return groupedStudents;
}

module.exports = {
    generateGroups,
    clearGroups,
    getStudentsByGroup
};
