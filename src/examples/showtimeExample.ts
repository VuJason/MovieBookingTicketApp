/**
 * Example usage of showtime API and utility functions
 * 
 * This file demonstrates how to use the showtime API and utility functions
 * to separate date and time from startTime and group showtimes by date.
 */

import { apiService } from '../api/apicall';
import { 
  groupShowtimesByDate, 
  filterShowtimesByDate, 
  groupShowtimesByCinema,
  extractDateTime,
  formatTime,
  isShowtimeAvailable,
  getNextSevenDays,
  hasAvailableShowtimes
} from '../utils/showtimeUtils';
import { ShowTime, ShowtimeByDate } from '../types/Movie';

// Example: Fetch showtimes for a movie
export const fetchMovieShowtimes = async (movieId: number) => {
  try {
    const response = await apiService.getShowtimesByMovieId(movieId);
    
    if (response && response.data) {
      const showtimes: ShowTime[] = response.data;
      
      // Example 1: Extract date and time from startTime
      showtimes.forEach(showtime => {
        const { date, time, fullDate } = extractDateTime(showtime.startTime);
        console.log(`Showtime ${showtime.id}: Date=${date}, Time=${time}`);
        // Output: Showtime 1: Date=2024-01-15, Time=14:30
      });
      
      // Example 2: Group showtimes by date
      const groupedByDate: ShowtimeByDate[] = groupShowtimesByDate(showtimes);
      console.log('Showtimes grouped by date:', groupedByDate);
      // Output: [
      //   { date: '2024-01-15', dateDisplay: 'Today', showtimes: [...] },
      //   { date: '2024-01-16', dateDisplay: 'Tomorrow', showtimes: [...] },
      //   ...
      // ]
      
      // Example 3: Filter showtimes for a specific date
      const today = new Date();
      const todayShowtimes = filterShowtimesByDate(showtimes, today);
      console.log('Today showtimes:', todayShowtimes);
      
      // Example 4: Group showtimes by cinema for a specific date
      const cinemaGroups = groupShowtimesByCinema(todayShowtimes);
      console.log('Cinema groups:', cinemaGroups);
      // Output: {
      //   '1-CGV Vincom Center': [showtime1, showtime2, ...],
      //   '2-Lotte Cinema': [showtime3, showtime4, ...],
      //   ...
      // }
      
      // Example 5: Check available dates
      const availableDates = getNextSevenDays().filter(date => 
        hasAvailableShowtimes(showtimes, date)
      );
      console.log('Available dates:', availableDates);
      
      return {
        showtimes,
        groupedByDate,
        todayShowtimes,
        cinemaGroups,
        availableDates
      };
    }
  } catch (error) {
    console.error('Error fetching showtimes:', error);
    throw error;
  }
};

// Example: Sample showtime data structure
export const sampleShowtimeData: ShowTime[] = [
  {
    id: 1,
    movieId: 1,
    cinemaId: 1,
    cinemaName: 'CGV Vincom Center',
    cinemaAddress: '191 Ba Trieu, Hai Ba Trung, Ha Noi',
    startTime: '2024-01-15T10:30:00', // Contains both date and time
    endTime: '2024-01-15T12:30:00',
    price: 15.99,
    availableSeats: 45,
    totalSeats: 50,
    format: '2D',
    roomName: 'Room A'
  },
  {
    id: 2,
    movieId: 1,
    cinemaId: 1,
    cinemaName: 'CGV Vincom Center',
    cinemaAddress: '191 Ba Trieu, Hai Ba Trung, Ha Noi',
    startTime: '2024-01-15T14:30:00', // Same date, different time
    endTime: '2024-01-15T16:30:00',
    price: 15.99,
    availableSeats: 0, // Sold out
    totalSeats: 50,
    format: '3D',
    roomName: 'Room B'
  },
  {
    id: 3,
    movieId: 1,
    cinemaId: 2,
    cinemaName: 'Lotte Cinema Landmark',
    cinemaAddress: 'E6 Cau Giay, Cau Giay, Ha Noi',
    startTime: '2024-01-16T11:00:00', // Different date
    endTime: '2024-01-16T13:00:00',
    price: 12.99,
    availableSeats: 30,
    totalSeats: 40,
    format: '2D',
    roomName: 'Room 1'
  }
];

// Example: How to use in a React component
export const useShowtimeData = (movieId: number) => {
  const [showtimes, setShowtimes] = useState<ShowTime[]>([]);
  const [groupedByDate, setGroupedByDate] = useState<ShowtimeByDate[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  useEffect(() => {
    const loadShowtimes = async () => {
      try {
        const data = await fetchMovieShowtimes(movieId);
        setShowtimes(data.showtimes);
        setGroupedByDate(data.groupedByDate);
      } catch (error) {
        console.error('Failed to load showtimes:', error);
      }
    };
    
    loadShowtimes();
  }, [movieId]);
  
  // Get showtimes for selected date
  const selectedDateShowtimes = useMemo(() => {
    return filterShowtimesByDate(showtimes, selectedDate);
  }, [showtimes, selectedDate]);
  
  // Group by cinema for selected date
  const cinemaGroups = useMemo(() => {
    return groupShowtimesByCinema(selectedDateShowtimes);
  }, [selectedDateShowtimes]);
  
  return {
    showtimes,
    groupedByDate,
    selectedDateShowtimes,
    cinemaGroups,
    selectedDate,
    setSelectedDate
  };
};
