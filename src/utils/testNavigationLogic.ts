/**
 * Test để kiểm tra navigation logic
 */

import { 
  getCurrentWeekDates, 
  getNextWeekDates, 
  getPreviousWeekDates,
  getWeekInfo 
} from '../utils/weeklyShowtimeUtils';

export const testNavigationLogic = () => {
  console.log('=== TESTING NAVIGATION LOGIC ===');
  
  // Test current week
  console.log('\n1. Current week:');
  const currentWeek = getCurrentWeekDates();
  const currentWeekInfo = getWeekInfo(currentWeek);
  console.log('Current week range:', currentWeekInfo.weekRange);
  console.log('Current week dates:', currentWeek.map(date => date.toDateString()));
  
  // Test next week
  console.log('\n2. Next week:');
  const nextWeek = getNextWeekDates(currentWeek);
  const nextWeekInfo = getWeekInfo(nextWeek);
  console.log('Next week range:', nextWeekInfo.weekRange);
  console.log('Next week dates:', nextWeek.map(date => date.toDateString()));
  
  // Test previous week
  console.log('\n3. Previous week:');
  const prevWeek = getPreviousWeekDates(currentWeek);
  const prevWeekInfo = getWeekInfo(prevWeek);
  console.log('Previous week range:', prevWeekInfo.weekRange);
  console.log('Previous week dates:', prevWeek.map(date => date.toDateString()));
  
  // Test navigation consistency
  console.log('\n4. Navigation consistency:');
  const backToCurrent = getPreviousWeekDates(nextWeek);
  const forwardToCurrent = getNextWeekDates(prevWeek);
  
  console.log('Next -> Previous should equal current:', 
    backToCurrent.every((date, index) => 
      date.toDateString() === currentWeek[index].toDateString()
    )
  );
  
  console.log('Previous -> Next should equal current:', 
    forwardToCurrent.every((date, index) => 
      date.toDateString() === currentWeek[index].toDateString()
    )
  );
  
  // Test today detection
  console.log('\n5. Today detection:');
  const today = new Date();
  const isTodayInCurrentWeek = currentWeek.some(date => 
    date.toDateString() === today.toDateString()
  );
  const isTodayInNextWeek = nextWeek.some(date => 
    date.toDateString() === today.toDateString()
  );
  const isTodayInPrevWeek = prevWeek.some(date => 
    date.toDateString() === today.toDateString()
  );
  
  console.log('Today:', today.toDateString());
  console.log('Is today in current week?', isTodayInCurrentWeek);
  console.log('Is today in next week?', isTodayInNextWeek);
  console.log('Is today in previous week?', isTodayInPrevWeek);
  
  console.log('\n=== TEST COMPLETED ===');
};

// Expected behavior:
// 1. Navigation should work correctly (next/previous)
// 2. Today should only be in one week at a time
// 3. Navigation should be consistent (next->prev = current)
// 4. Week ranges should be consecutive
