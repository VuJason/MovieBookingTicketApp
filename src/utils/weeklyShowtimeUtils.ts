/**
 * Utility functions for weekly date management and showtime matching
 */

import { ShowTime } from '../types/Movie';

/**
 * Get current week dates (Monday to Sunday)
 * @param date - Reference date (default: today)
 * @returns Array of 7 dates for current week
 */
export const getCurrentWeekDates = (date: Date = new Date()): Date[] => {
  const dates: Date[] = [];
  
  // Normalize date to avoid timezone issues
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Get Monday of current week
  const monday = new Date(normalizedDate);
  const dayOfWeek = normalizedDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
  monday.setDate(normalizedDate.getDate() + daysToMonday);
  
  // Generate 7 days from Monday to Sunday
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(monday);
    weekDate.setDate(monday.getDate() + i);
    dates.push(weekDate);
  }
  
  return dates;
};

/**
 * Get next week dates
 * @param currentWeekDates - Current week dates
 * @returns Array of 7 dates for next week
 */
export const getNextWeekDates = (currentWeekDates: Date[]): Date[] => {
  const nextWeekDates: Date[] = [];
  
  // Add 7 days to each date, avoiding timezone issues
  currentWeekDates.forEach(date => {
    const nextWeekDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
    nextWeekDates.push(nextWeekDate);
  });
  
  return nextWeekDates;
};

/**
 * Get previous week dates
 * @param currentWeekDates - Current week dates
 * @returns Array of 7 dates for previous week
 */
export const getPreviousWeekDates = (currentWeekDates: Date[]): Date[] => {
  const previousWeekDates: Date[] = [];
  
  // Subtract 7 days from each date, avoiding timezone issues
  currentWeekDates.forEach(date => {
    const prevWeekDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7);
    previousWeekDates.push(prevWeekDate);
  });
  
  return previousWeekDates;
};

/**
 * Check if a date is in current week
 * @param date - Date to check
 * @param weekDates - Current week dates
 * @returns Boolean indicating if date is in current week
 */
export const isDateInCurrentWeek = (date: Date, weekDates: Date[]): boolean => {
  // Normalize date to avoid timezone issues
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  return weekDates.some(weekDate => {
    const normalizedWeekDate = new Date(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate());
    return normalizedDate.getTime() === normalizedWeekDate.getTime();
  });
};

/**
 * Auto-load new week if current date is not in displayed week
 * @param currentWeekDates - Currently displayed week dates
 * @returns New week dates if auto-load needed, otherwise current week dates
 */
export const autoLoadNewWeek = (currentWeekDates: Date[]): Date[] => {
  const today = new Date();
  
  // Check if today is in current week
  if (!isDateInCurrentWeek(today, currentWeekDates)) {
    console.log('Auto-loading new week because today is not in current week');
    return getCurrentWeekDates(today);
  }
  
  return currentWeekDates;
};

/**
 * Format date for display
 * @param date - Date to format
 * @param isToday - Whether this date is today
 * @returns Formatted date string
 */
export const formatDateForDisplay = (date: Date, isToday: boolean = false): {
  dayName: string;
  dayNumber: string;
  monthName: string;
  isToday: boolean;
} => {
  const today = new Date();
  // Normalize dates to avoid timezone issues
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isTodayDate = normalizedDate.getTime() === normalizedToday.getTime();
  
  return {
    dayName: isTodayDate ? 'Today' : date.toLocaleDateString('en', { weekday: 'short' }),
    dayNumber: date.getDate().toString(),
    monthName: date.toLocaleDateString('en', { month: 'short' }),
    isToday: isTodayDate
  };
};

/**
 * Extract date from showtime startTime
 * @param startTime - Showtime startTime string
 * @returns Date object
 */
export const extractDateFromShowtime = (startTime: string): Date => {
  try {
    // Handle format: "2025-10-26 15:30"
    const [datePart] = startTime.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Create date without timezone issues
    return new Date(year, month - 1, day); // month is 0-indexed
  } catch (error) {
    console.error('Error parsing showtime date:', error);
    return new Date();
  }
};

/**
 * Match showtimes with week dates
 * @param showtimes - Array of showtimes from API
 * @param weekDates - Current week dates
 * @returns Object with dates as keys and matching showtimes as values
 */
export const matchShowtimesWithWeekDates = (
  showtimes: ShowTime[], 
  weekDates: Date[]
): { [dateKey: string]: ShowTime[] } => {
  const matchedShowtimes: { [dateKey: string]: ShowTime[] } = {};
  
  // Initialize empty arrays for each date
  weekDates.forEach(date => {
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateKey = `${normalizedDate.getFullYear()}-${String(normalizedDate.getMonth() + 1).padStart(2, '0')}-${String(normalizedDate.getDate()).padStart(2, '0')}`;
    matchedShowtimes[dateKey] = [];
  });
  
  // Match showtimes with dates
  showtimes.forEach(showtime => {
    const showtimeDate = extractDateFromShowtime(showtime.startTime);
    const normalizedShowtimeDate = new Date(showtimeDate.getFullYear(), showtimeDate.getMonth(), showtimeDate.getDate());
    const dateKey = `${normalizedShowtimeDate.getFullYear()}-${String(normalizedShowtimeDate.getMonth() + 1).padStart(2, '0')}-${String(normalizedShowtimeDate.getDate()).padStart(2, '0')}`;
    
    if (matchedShowtimes[dateKey]) {
      matchedShowtimes[dateKey].push(showtime);
    }
  });
  
  // Sort showtimes by time for each date
  Object.keys(matchedShowtimes).forEach(dateKey => {
    matchedShowtimes[dateKey].sort((a, b) => {
      const timeA = a.startTime.split(' ')[1];
      const timeB = b.startTime.split(' ')[1];
      return timeA.localeCompare(timeB);
    });
  });
  
  return matchedShowtimes;
};

/**
 * Get showtimes for a specific date
 * @param showtimes - All showtimes
 * @param targetDate - Target date
 * @returns Array of showtimes for the target date
 */
export const getShowtimesForDate = (showtimes: ShowTime[], targetDate: Date): ShowTime[] => {
  // Normalize target date to avoid timezone issues
  const normalizedTargetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  return showtimes.filter(showtime => {
    const showtimeDate = extractDateFromShowtime(showtime.startTime);
    const normalizedShowtimeDate = new Date(showtimeDate.getFullYear(), showtimeDate.getMonth(), showtimeDate.getDate());
    return normalizedTargetDate.getTime() === normalizedShowtimeDate.getTime();
  });
};

/**
 * Group showtimes by room for a specific date
 * @param showtimes - Showtimes for a specific date
 * @returns Object with room as key and showtimes as value
 */
export const groupShowtimesByRoomForDate = (showtimes: ShowTime[]) => {
  const grouped: { [roomKey: string]: ShowTime[] } = {};
  
  showtimes.forEach(showtime => {
    const roomKey = `${showtime.room.id}-${showtime.room.type.name}`;
    
    if (!grouped[roomKey]) {
      grouped[roomKey] = [];
    }
    grouped[roomKey].push(showtime);
  });
  
  return grouped;
};

/**
 * Extract time from showtime startTime
 * @param startTime - Showtime startTime string
 * @returns Time string in HH:MM format
 */
export const extractTimeFromShowtime = (startTime: string): string => {
  try {
    const [, timePart] = startTime.split(' ');
    return timePart.substring(0, 5); // "15:30"
  } catch (error) {
    console.error('Error extracting time:', error);
    return '00:00';
  }
};

/**
 * Check if showtime is available
 * @param showtime - Showtime object
 * @returns Boolean indicating if showtime is available
 */
export const isShowtimeAvailable = (showtime: ShowTime): boolean => {
  return showtime.room.status === 'ACTIVE';
};

/**
 * Get week info for display
 * @param weekDates - Current week dates
 * @returns Week info object
 */
export const getWeekInfo = (weekDates: Date[]): {
  weekStart: string;
  weekEnd: string;
  weekRange: string;
} => {
  // Check if weekDates has enough elements
  if (!weekDates || weekDates.length < 7) {
    console.warn('getWeekInfo: weekDates array is incomplete, using fallback dates');
    const today = new Date();
    const fallbackStart = new Date(today);
    const fallbackEnd = new Date(today);
    fallbackEnd.setDate(today.getDate() + 6);
    
    return {
      weekStart: fallbackStart.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      weekEnd: fallbackEnd.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }),
      weekRange: `${fallbackStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} - ${fallbackEnd.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
    };
  }
  
  const startDate = weekDates[0];
  const endDate = weekDates[6];
  
  // Additional safety check
  if (!startDate || !endDate) {
    console.warn('getWeekInfo: startDate or endDate is undefined');
    const today = new Date();
    return {
      weekStart: today.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      weekEnd: today.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }),
      weekRange: today.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  }
  
  const weekStart = startDate.toLocaleDateString('en', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  const weekEnd = endDate.toLocaleDateString('en', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  const weekRange = `${weekStart} - ${weekEnd}`;
  
  return {
    weekStart,
    weekEnd,
    weekRange
  };
};
