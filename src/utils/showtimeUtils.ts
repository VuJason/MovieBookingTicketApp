import { ShowTime, ShowtimeByDate } from '../types/Movie';

/**
 * Utility functions for handling showtime data
 */

/**
 * Extract date and time from API string format
 * @param dateTimeString - String like "2025-10-26 15:30"
 * @returns Object with date and time separated
 */
export const extractDateTime = (dateTimeString: string) => {
  try {
    // Split by space to separate date and time
    const [datePart, timePart] = dateTimeString.split(' ');
    
    // Parse date part (2025-10-26)
    const dateStr = datePart; // "2025-10-26"
    
    // Parse time part (15:30)
    const timeStr = timePart.substring(0, 5); // "15:30"
    
    // Create full date object
    const fullDate = new Date(`${datePart}T${timePart}:00`);
    
    return {
      date: dateStr,
      time: timeStr,
      fullDate: fullDate
    };
  } catch (error) {
    console.error('Error parsing date:', error);
    return {
      date: '',
      time: '',
      fullDate: new Date()
    };
  }
};

/**
 * Group showtimes by date
 * @param showtimes - Array of showtime objects
 * @returns Array of showtime groups by date
 */
export const groupShowtimesByDate = (showtimes: ShowTime[]): ShowtimeByDate[] => {
  const grouped: { [key: string]: ShowTime[] } = {};
  
  showtimes.forEach(showtime => {
    const { date } = extractDateTime(showtime.startTime);
    
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(showtime);
  });
  
  // Convert to array and sort by date
  return Object.keys(grouped)
    .sort()
    .map(date => ({
      date,
      dateDisplay: getDateDisplay(date),
      showtimes: grouped[date].sort((a, b) => 
        extractDateTime(a.startTime).time.localeCompare(extractDateTime(b.startTime).time)
      )
    }));
};

/**
 * Get display text for date
 * @param dateStr - Date string in format "2024-01-15"
 * @returns Display text like "Today", "Mon", "Tue", etc.
 */
export const getDateDisplay = (dateStr: string): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const date = new Date(dateStr);
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  if (dateStr === todayStr) {
    return 'Today';
  } else if (dateStr === tomorrowStr) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en', { weekday: 'short' });
  }
};

/**
 * Filter showtimes by selected date
 * @param showtimes - Array of showtime objects
 * @param selectedDate - Selected date object
 * @returns Filtered showtimes for the selected date
 */
export const filterShowtimesByDate = (showtimes: ShowTime[], selectedDate: Date): ShowTime[] => {
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
  return showtimes.filter(showtime => {
    const { date } = extractDateTime(showtime.startTime);
    return date === selectedDateStr;
  });
};

/**
 * Group showtimes by room for a specific date
 * @param showtimes - Array of showtime objects for a specific date
 * @returns Object with room as key and showtimes as value
 */
export const groupShowtimesByRoom = (showtimes: ShowTime[]) => {
  const grouped: { [key: string]: ShowTime[] } = {};
  
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
 * Format time for display
 * @param timeStr - Time string in format "14:30"
 * @returns Formatted time string
 */
export const formatTime = (timeStr: string): string => {
  return timeStr; // Already in HH:MM format
};

/**
 * Check if showtime is available (room is active)
 * @param showtime - Showtime object
 * @returns Boolean indicating if showtime is available
 */
export const isShowtimeAvailable = (showtime: ShowTime): boolean => {
  return showtime.room.status === 'ACTIVE';
};

/**
 * Get next 7 days from today
 * @returns Array of Date objects for next 7 days
 */
export const getNextSevenDays = (): Date[] => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
};

/**
 * Check if a date has any available showtimes
 * @param showtimes - Array of all showtimes
 * @param date - Date to check
 * @returns Boolean indicating if date has available showtimes
 */
export const hasAvailableShowtimes = (showtimes: ShowTime[], date: Date): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  return showtimes.some(showtime => {
    const { date: showtimeDate } = extractDateTime(showtime.startTime);
    return showtimeDate === dateStr && isShowtimeAvailable(showtime);
  });
};
