require('dotenv').config();
const mongoose = require('mongoose');

function getFirstTuesdayOfMonth(year, month) {
  const date = new Date(year, month, 1);
  while (date.getDay() !== 2) { // 2 = Tuesday
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function getMondayBeforeFirstTuesday(year, month) {
  const firstTuesday = getFirstTuesdayOfMonth(year, month);
  const monday = new Date(firstTuesday);
  monday.setDate(monday.getDate() - 1);
  return monday;
}

async function testReminder() {
  console.log('--- TEST REMINDER DATE CALCULATIONS ---');
  const today = new Date();
  console.log('Today:', today.toLocaleDateString());
  
  const firstTuesday = getFirstTuesdayOfMonth(today.getFullYear(), today.getMonth());
  console.log('First Tuesday of this month:', firstTuesday.toLocaleDateString());

  const targetMonday = getMondayBeforeFirstTuesday(today.getFullYear(), today.getMonth());
  console.log('Target Monday (reminder day):', targetMonday.toLocaleDateString());

  const isTodayTarget = today.getDate() === targetMonday.getDate() &&
                        today.getMonth() === targetMonday.getMonth() &&
                        today.getFullYear() === targetMonday.getFullYear();
  console.log('Is today the target Monday?', isTodayTarget);

  console.log('--- TEST GENERAL MONTHS (2026) ---');
  for (let m = 0; m < 12; m++) {
    const t = getFirstTuesdayOfMonth(2026, m);
    const mon = getMondayBeforeFirstTuesday(2026, m);
    console.log(`Month ${m+1}/2026: Tuesday = ${t.toLocaleDateString()} | Monday Reminder = ${mon.toLocaleDateString()}`);
  }
}

testReminder();
