import { ref, computed } from 'vue';
import server from '@/services/server';
import { useUserProfile } from '@/composables/useUserProfile';
import { computeMean } from '@/utils/exportCsv';
import { meanTeacherRelativeScore, usesNormalizedEngagement } from '@/utils/experienceNormalization';

export function getDefaultTerm() {
  const m = new Date().getMonth();
  if (m <= 3) return 1;
  if (m <= 7) return 2;
  return 3;
}

export function useTeacherSchoolInsights() {
  const { user, teacherSchools } = useUserProfile();

  const selectedSchoolId = ref('');
  const year = ref(new Date().getFullYear());
  const term = ref(null);
  const insights = ref(null);
  const groupContext = ref(null);
  const loading = ref(false);
  const error = ref('');

  const schoolOptions = computed(() => teacherSchools.value);

  const isGroupView = computed(() => insights.value?.isGroup === true);

  const useNormalizedEngagement = computed(() =>
    usesNormalizedEngagement({
      isGroupView: isGroupView.value,
      teacherCount: insights.value?.teacherCount,
    })
  );

  const displayTitle = computed(() => {
    if (isGroupView.value) {
      return insights.value?.groupName || groupContext.value?.groupName || 'School group';
    }
    return insights.value?.schoolName || 'My school';
  });

  const classesByTeacher = computed(() => {
    const teachers = insights.value?.teachers || [];
    const classes = insights.value?.classes || [];
    const groups = teachers.map((teacher) => {
      const teacherClasses = classes.filter((c) => c.teacherUserId === teacher.userId);
      return {
        teacherUserId: teacher.userId,
        teacherName: teacher.name || 'Unnamed teacher',
        teacherEmail: teacher.email || teacher.userId,
        classes: teacherClasses,
      };
    });

    const assignedTeacherIds = new Set(teachers.map((t) => t.userId));
    const unassignedClasses = classes.filter((c) => !assignedTeacherIds.has(c.teacherUserId));
    if (unassignedClasses.length) {
      groups.push({
        teacherUserId: 'unknown-teacher',
        teacherName: 'Unknown teacher',
        teacherEmail: 'Not currently linked to school membership',
        classes: unassignedClasses,
      });
    }
    return groups;
  });

  const myUserId = computed(() => user.value?.userId ?? null);

  function isOwnClass(classItem) {
    return classItem?.teacherUserId === myUserId.value;
  }

  const myClassIds = computed(() => {
    const classes = insights.value?.classes || [];
    return new Set(classes.filter((c) => isOwnClass(c)).map((c) => c.id));
  });

  const schoolAverages = computed(() => {
    const classes = insights.value?.classes || [];
    if (!classes.length) return null;
    const experiences = classes.map((c) => c.experience ?? 0);
    const students = classes.map((c) => c.numberOfStudents ?? 0);
    const avgPoints = classes
      .map((c) => c.avgPointsPerStudent)
      .filter((v) => v != null);
    return {
      avgExperience: computeMean(experiences),
      avgStudents: computeMean(students),
      avgPointsPerStudent: avgPoints.length ? computeMean(avgPoints) : null,
      avgTeacherRelativeScore: meanTeacherRelativeScore(classes),
    };
  });

  async function loadInsights() {
    if (!selectedSchoolId.value) return;
    loading.value = true;
    error.value = '';
    try {
      const params = { year: year.value };
      if (term.value != null) {
        params.term = term.value;
        params.filterByTerm = '1';
      }

      const contextRes = await server.getSchoolGroupContext(selectedSchoolId.value);
      groupContext.value = contextRes?.group ?? null;

      if (groupContext.value?.groupId) {
        insights.value = await server.getSchoolGroupTeacherInsights(groupContext.value.groupId, params);
      } else {
        insights.value = await server.getSchoolTeacherInsights(selectedSchoolId.value, params);
      }
    } catch (e) {
      console.error('Failed to load teacher insights', e);
      error.value = e?.response?.data?.message || e?.message || 'Failed to load school insights';
      insights.value = null;
      groupContext.value = null;
    } finally {
      loading.value = false;
    }
  }

  function initSchoolSelection() {
    const opts = schoolOptions.value;
    if (!opts.length) {
      selectedSchoolId.value = '';
      return;
    }
    if (!selectedSchoolId.value || !opts.some((o) => o.schoolId === selectedSchoolId.value)) {
      selectedSchoolId.value = opts[0].schoolId;
    }
  }

  return {
    selectedSchoolId,
    year,
    term,
    insights,
    groupContext,
    isGroupView,
    useNormalizedEngagement,
    displayTitle,
    loading,
    error,
    schoolOptions,
    classesByTeacher,
    myUserId,
    isOwnClass,
    myClassIds,
    schoolAverages,
    loadInsights,
    initSchoolSelection,
  };
}
