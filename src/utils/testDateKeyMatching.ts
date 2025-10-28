/**
 * Test để kiểm tra date key matching
 */

import { 
  getCurrentWeekDates, 
  matchShowtimesWithWeekDates,
  extractDateFromShowtime 
} from '../utils/weeklyShowtimeUtils';
import { ShowTime } from '../types/Movie';

export const testDateKeyMatching = () => {
  console.log('=== TESTING DATE KEY MATCHING ===');
  
  // Test với API data thực tế
  const apiShowtime: ShowTime = {
    id: 1,
    movie: { id: 1, name: "Test Movie" },
    room: { 
      id: 1, 
      roomNumber: 1, 
      status: "ACTIVE",
      totalRows: 10,
      seatsPerRow: 10,
      type: { id: 1, name: "Phòng 1 - Standard" }
    },
    startTime: "2025-10-26 19:30", // Ngày 26/10/2025
    endTime: "2025-10-26 22:30"
  };
  
  console.log('\n1. API Showtime:');
  console.log('startTime:', apiShowtime.startTime);
  
  // Test extractDateFromShowtime
  console.log('\n2. Extract date from showtime:');
  const extractedDate = extractDateFromShowtime(apiShowtime.startTime);
  console.log('Extracted date:', extractedDate.toDateString());
  
  // Test current week
  console.log('\n3. Current week dates:');
  const weekDates = getCurrentWeekDates();
  weekDates.forEach((date, index) => {
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateKey = `${normalizedDate.getFullYear()}-${String(normalizedDate.getMonth() + 1).padStart(2, '0')}-${String(normalizedDate.getDate()).padStart(2, '0')}`;
    console.log(`Day ${index}: ${date.toDateString()} -> Key: ${dateKey}`);
  });
  
  // Test matching
  console.log('\n4. Matching showtimes with week dates:');
  const matched = matchShowtimesWithWeekDates([apiShowtime], weekDates);
  console.log('Matched keys:', Object.keys(matched));
  console.log('Matched data:', matched);
  
  // Test date key generation for selected date
  console.log('\n5. Test date key generation for selected date:');
  const selectedDate = new Date(2025, 9, 26); // October 26, 2025
  const normalizedSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const selectedDateKey = `${normalizedSelectedDate.getFullYear()}-${String(normalizedSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(normalizedSelectedDate.getDate()).padStart(2, '0')}`;
  
  console.log('Selected date:', selectedDate.toDateString());
  console.log('Selected date key:', selectedDateKey);
  console.log('Has showtimes for selected date?', !!matched[selectedDateKey]);
  console.log('Showtimes count:', matched[selectedDateKey]?.length || 0);
  
  // Test timezone issues
  console.log('\n6. Test timezone issues:');
  const date1 = new Date(2025, 9, 26); // October 26, 2025
  const date2 = new Date('2025-10-26T00:00:00Z'); // UTC
  const date3 = new Date('2025-10-26T12:00:00Z'); // UTC with time
  
  console.log('Date 1 (local):', date1.toDateString(), '->', date1.toISOString().split('T')[0]);
  console.log('Date 2 (UTC):', date2.toDateString(), '->', date2.toISOString().split('T')[0]);
  console.log('Date 3 (UTC with time):', date3.toDateString(), '->', date3.toISOString().split('T')[0]);
  
  // Test normalized date keys
  const key1 = `${date1.getFullYear()}-${String(date1.getMonth() + 1).padStart(2, '0')}-${String(date1.getDate()).padStart(2, '0')}`;
  const key2 = `${date2.getFullYear()}-${String(date2.getMonth() + 1).padStart(2, '0')}-${String(date2.getDate()).padStart(2, '0')}`;
  const key3 = `${date3.getFullYear()}-${String(date3.getMonth() + 1).padStart(2, '0')}-${String(date3.getDate()).padStart(2, '0')}`;
  
  console.log('Normalized keys:');
  console.log('Key 1:', key1);
  console.log('Key 2:', key2);
  console.log('Key 3:', key3);
  console.log('All keys equal?', key1 === key2 && key2 === key3);
  
  console.log('\n=== TEST COMPLETED ===');
};

// Expected output nếu fix thành công:
/*
=== TESTING DATE KEY MATCHING ===

1. API Showtime:
startTime: 2025-10-26 19:30

2. Extract date from showtime:
Extracted date: Sun Oct 26 2025

3. Current week dates:
Day 0: Mon Oct 20 2025 -> Key: 2025-10-20
Day 1: Tue Oct 21 2025 -> Key: 2025-10-21
...
Day 6: Sun Oct 26 2025 -> Key: 2025-10-26

4. Matching showtimes with week dates:
Matched keys: ["2025-10-26"]
Matched data: { "2025-10-26": [showtime] }

5. Test date key generation for selected date:
Selected date: Sun Oct 26 2025
Selected date key: 2025-10-26
Has showtimes for selected date? true
Showtimes count: 1

6. Test timezone issues:
All keys equal? true

=== TEST COMPLETED ===
*/
