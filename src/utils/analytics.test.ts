import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalScore,
  calculateThreePlansScore,
  calculateThaiGrade,
  calculateNormalizedGain,
  calculateE1E2,
  calculateDependentTTest,
  analyzeIndividualStudent,
  studentsToSheetRows,
  sheetRowsToStudents,
  INITIAL_STUDENTS,
} from './analytics.ts';

test('calculateThreePlansScore and calculateTotalScore sum 3 lesson plans (20 each) + posttest (20) + affective (20)', () => {
  const threePlans = calculateThreePlansScore({
    unit1: 18,
    unit2: 17.5,
    unit3: 18.5,
  });
  assert.equal(threePlans, 54);

  const total = calculateTotalScore({
    unit1: 18,
    unit2: 17.5,
    unit3: 18.5,
    posttest: 18.5,
    affective: 19,
  });
  assert.equal(total, 91.5);
});

test('calculateThaiGrade maps 0-100 scores to standard 8-level Thai MOE grades', () => {
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

test('calculateE1E2 computes process (E1 from 3 plans / 60) and product (E2 from posttest / 20) efficiency percentages', () => {
  const result = calculateE1E2(INITIAL_STUDENTS, 80, 80);
  assert.ok(result.e1 >= 80 && result.e1 <= 100);
  assert.ok(result.e2 >= 80 && result.e2 <= 100);
  assert.equal(result.meetsBoth, true);
});

test('calculateDependentTTest computes paired t-statistic and significance for pre (20) vs post (20) test', () => {
  const tResult = calculateDependentTTest(INITIAL_STUDENTS);
  assert.equal(tResult.df, INITIAL_STUDENTS.length - 1);
  assert.ok(tResult.meanPost > tResult.meanPre);
  assert.ok(tResult.tStat > tResult.criticalT);
  assert.equal(tResult.isSignificant, true);
});

test('analyzeIndividualStudent generates 3-plan diagnostic profile and competency breakdown', () => {
  const profile = analyzeIndividualStudent(INITIAL_STUDENTS[2], INITIAL_STUDENTS);
  assert.equal(profile.student.studentCode, '30103');
  assert.equal(profile.competencies.length, 5);
  assert.equal(profile.statusTier, 'At-Risk');
  assert.ok(profile.scoreDiff > 0);
});

test('studentsToSheetRows and sheetRowsToStudents round-trip 3-plan data accurately', () => {
  const rows = studentsToSheetRows(INITIAL_STUDENTS);
  assert.equal(rows.length, INITIAL_STUDENTS.length + 1);
  const parsed = sheetRowsToStudents(rows);
  assert.equal(parsed.length, INITIAL_STUDENTS.length);
  assert.equal(parsed[0].studentCode, INITIAL_STUDENTS[0].studentCode);
  assert.equal(parsed[0].unit1, INITIAL_STUDENTS[0].unit1);
  assert.equal(parsed[0].posttest, INITIAL_STUDENTS[0].posttest);
});
