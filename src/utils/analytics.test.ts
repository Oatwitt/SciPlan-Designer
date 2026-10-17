import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePretestPct,
  calculatePosttestPct,
  calculateScoreDiff,
  countCompletedPlans,
  calculateThaiGrade,
  calculateNormalizedGain,
  calculateDependentTTest,
  calculateClassSummary,
  analyzeIndividualStudent,
  studentsToSheetRows,
  sheetRowsToStudents,
  INITIAL_STUDENTS,
} from './analytics.ts';

test('calculatePretestPct, calculatePosttestPct, and calculateScoreDiff compute accurately from 20-point scores', () => {
  assert.equal(calculatePretestPct({ pretest: 11 }), 55);
  assert.equal(calculatePosttestPct({ posttest: 18.5 }), 92.5);
  assert.equal(calculateScoreDiff({ pretest: 11, posttest: 18.5 }), 7.5);
});

test('countCompletedPlans counts unscored teaching plans attended (out of 3)', () => {
  assert.equal(
    countCompletedPlans({
      completedPlan1: true,
      completedPlan2: false,
      completedPlan3: true,
    }),
    2
  );
});

test('calculateThaiGrade maps post-test percentage (0-100%) to standard 8-level Thai MOE grades', () => {
  assert.equal(calculateThaiGrade(85), 4);
  assert.equal(calculateThaiGrade(76), 3.5);
  assert.equal(calculateThaiGrade(71), 3);
  assert.equal(calculateThaiGrade(65), 2.5);
  assert.equal(calculateThaiGrade(60), 2);
  assert.equal(calculateThaiGrade(55), 1.5);
  assert.equal(calculateThaiGrade(50), 1);
  assert.equal(calculateThaiGrade(49.5), 0);
});

test('calculateNormalizedGain computes Hake normalized gain <g> for 20-point pre/post tests', () => {
  const high = calculateNormalizedGain(10, 18, 20);
  assert.equal(high.gain, 0.8);
  assert.equal(high.level, 'High Gain');

  const medium = calculateNormalizedGain(8, 14, 20);
  assert.equal(medium.gain, 0.5);
  assert.equal(medium.level, 'Medium Gain');

  const low = calculateNormalizedGain(10, 12, 20);
  assert.equal(low.gain, 0.2);
  assert.equal(low.level, 'Low Gain');
});

test('calculateDependentTTest computes paired t-statistic and significance for pre (20) vs post (20) test', () => {
  const tResult = calculateDependentTTest(INITIAL_STUDENTS);
  assert.equal(tResult.df, INITIAL_STUDENTS.length - 1);
  assert.ok(tResult.meanPost > tResult.meanPre);
  assert.ok(tResult.tStat > tResult.criticalT);
  assert.equal(tResult.isSignificant, true);
});

test('calculateClassSummary and analyzeIndividualStudent work without plan scores or affective scores', () => {
  const summary = calculateClassSummary(INITIAL_STUDENTS, 80);
  assert.equal(summary.studentCount, INITIAL_STUDENTS.length);
  assert.ok(summary.meanPostScore > summary.tTest.meanPre);

  const profile = analyzeIndividualStudent(INITIAL_STUDENTS[2], INITIAL_STUDENTS);
  assert.equal(profile.student.studentCode, '30103');
  assert.equal(profile.completedPlansCount, 3);
  assert.equal(profile.scoreDiff, 8);
});

test('studentsToSheetRows and sheetRowsToStudents round-trip Pre-test (20), 3 Plans attendance, and Post-test (20)', () => {
  const rows = studentsToSheetRows(INITIAL_STUDENTS);
  assert.equal(rows.length, INITIAL_STUDENTS.length + 1);
  const parsed = sheetRowsToStudents(rows);
  assert.equal(parsed.length, INITIAL_STUDENTS.length);
  assert.equal(parsed[0].studentCode, INITIAL_STUDENTS[0].studentCode);
  assert.equal(parsed[0].pretest, INITIAL_STUDENTS[0].pretest);
  assert.equal(parsed[0].completedPlan2, INITIAL_STUDENTS[0].completedPlan2);
  assert.equal(parsed[6].completedPlan2, false);
  assert.equal(parsed[0].posttest, INITIAL_STUDENTS[0].posttest);
});
