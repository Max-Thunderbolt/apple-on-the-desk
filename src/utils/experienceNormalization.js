/**
 * Client-side mirror of API teacher-relative engagement scoring.
 */

function classHasEngagement(c) {
  const exp = c.experience ?? 0;
  const avgPts = c.avgPointsPerStudent ?? 0;
  return exp > 0 || avgPts > 0;
}

function assignMinMaxScores(classes, valueKey = 'experience') {
  const values = classes.map((c) => c[valueKey] ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  for (const c of classes) {
    const v = c[valueKey] ?? 0;
    c.teacherRelativeScore = range === 0 ? 100 : Math.round(((v - min) / range) * 100);
  }
}

export function enrichClassesWithTeacherRelativeScores(classes) {
  if (!classes?.length) return classes;

  const byTeacher = new Map();
  for (const c of classes) {
    const tid = c.teacherUserId ?? '__unknown__';
    if (!byTeacher.has(tid)) byTeacher.set(tid, []);
    byTeacher.get(tid).push(c);
  }

  for (const teacherClasses of byTeacher.values()) {
    for (const c of teacherClasses) {
      const students = c.numberOfStudents ?? 0;
      c.experiencePerStudent = students > 0 ? (c.experience ?? 0) / students : null;
      c.teacherRelativeScore = null;
    }

    const active = teacherClasses.filter(classHasEngagement);
    if (active.length === 0) continue;
    if (active.length === 1) {
      active[0].teacherRelativeScore = 100;
      continue;
    }

    assignMinMaxScores(active);
  }

  return classes;
}

export function meanTeacherRelativeScore(classes) {
  const scores = (classes || [])
    .map((c) => c.teacherRelativeScore)
    .filter((v) => v != null);
  if (!scores.length) return null;
  return scores.reduce((sum, v) => sum + v, 0) / scores.length;
}

export function usesNormalizedEngagement({ isGroupView, teacherCount }) {
  return isGroupView || (teacherCount ?? 0) > 1;
}
