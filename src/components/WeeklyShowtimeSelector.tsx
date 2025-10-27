/**
 * Weekly Showtime Selector Component
 * Hiển thị danh sách ngày theo tuần và box clickable cho suất chiếu
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ShowTime } from '../types/Movie';
import {
  getCurrentWeekDates,
  getNextWeekDates,
  getPreviousWeekDates,
  formatDateForDisplay,
  matchShowtimesWithWeekDates,
  groupShowtimesByRoomForDate,
  extractTimeFromShowtime,
  isShowtimeAvailable,
  getWeekInfo,
} from '../utils/weeklyShowtimeUtils';

interface WeeklyShowtimeSelectorProps {
  showtimes: ShowTime[];
  onShowtimeSelect: (showtime: ShowTime) => void;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

const WeeklyShowtimeSelector: React.FC<WeeklyShowtimeSelectorProps> = ({
  showtimes,
  onShowtimeSelect,
  selectedDate,
  onDateSelect,
}) => {
  const [currentWeekDates, setCurrentWeekDates] = useState<Date[]>(() => getCurrentWeekDates());
  const [matchedShowtimes, setMatchedShowtimes] = useState<{ [dateKey: string]: ShowTime[] }>({});
  const [selectedDateState, setSelectedDateState] = useState<Date>(selectedDate || new Date());
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState<ShowTime | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update current time every minute to refresh UI
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Initialize week dates
  useEffect(() => {
    const weekDates = getCurrentWeekDates();
    setCurrentWeekDates(weekDates);

    // Auto-select today if it's in current week
    const today = new Date();
    if (weekDates.some(date => date.toDateString() === today.toDateString())) {
      setSelectedDateState(today);
    } else {
      setSelectedDateState(weekDates[0]); // Select first day of week
    }
  }, []);

  // Auto-load new week when needed
  useEffect(() => {
    // Only run if currentWeekDates is properly initialized (has 7 elements)
    if (currentWeekDates.length === 7) {
      const today = new Date();
      const isTodayInCurrentWeek = currentWeekDates.some(date =>
        date.toDateString() === today.toDateString()
      );

      // Only auto-load if today is not in current week AND we haven't manually navigated
      if (!isTodayInCurrentWeek && !hasManuallyNavigated) {
        const newWeekDates = getCurrentWeekDates(today);
        setCurrentWeekDates(newWeekDates);
        setSelectedDateState(today);
      }
    }
  }, [currentWeekDates, hasManuallyNavigated]);

  // Match showtimes with week dates
  useEffect(() => {
    // Only run if currentWeekDates is properly initialized
    if (currentWeekDates.length === 7) {
      console.log('WeeklyShowtimeSelector: Matching showtimes with week dates');
      console.log('Week dates:', currentWeekDates.map(date => date.toDateString()));
      console.log('Showtimes:', showtimes.map(s => ({ id: s.id, startTime: s.startTime })));

      const matched = matchShowtimesWithWeekDates(showtimes, currentWeekDates);
      console.log('Matched result:', matched);
      setMatchedShowtimes(matched);
    }
  }, [showtimes, currentWeekDates]);

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDateState(date);
    setSelectedShowtime(null); // Clear selected showtime when changing dates
    onDateSelect?.(date);
  };

  // Handle showtime selection with toggle
  const handleShowtimeSelect = (showtime: ShowTime) => {
    if (isShowtimeAvailable(showtime)) {
      // Toggle: if already selected, deselect it
      if (selectedShowtime?.id === showtime.id) {
        setSelectedShowtime(null);
        // Notify parent that showtime was deselected
        onShowtimeSelect(null as any);
      } else {
        setSelectedShowtime(showtime);
        onShowtimeSelect(showtime);
      }
    }
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const nextWeekDates = getNextWeekDates(currentWeekDates);
    setCurrentWeekDates(nextWeekDates);
    setHasManuallyNavigated(true);

    // Select first day of new week
    setSelectedDateState(nextWeekDates[0]);
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const prevWeekDates = getPreviousWeekDates(currentWeekDates);
    setCurrentWeekDates(prevWeekDates);
    setHasManuallyNavigated(true);

    // Select first day of new week
    setSelectedDateState(prevWeekDates[0]);
  };

  // Check if a date is in the past (before today)
  const isDatePast = (date: Date): boolean => {
    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Check if can go to previous week (disable if current week contains today or is in the past)
  const canGoToPreviousWeek = (): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if any date in current week is today or in the future
    const hasCurrentOrFutureDates = currentWeekDates.some(date => {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate >= today;
    });

    // Can only go back if all dates in current week are in the future
    // (meaning we're already viewing a future week)
    const firstDateOfWeek = new Date(currentWeekDates[0]);
    firstDateOfWeek.setHours(0, 0, 0, 0);

    return firstDateOfWeek > today;
  };

  // Render date selector
  const renderDateSelector = () => {
    const weekInfo = getWeekInfo(currentWeekDates);
    const canGoPrevious = canGoToPreviousWeek();

    // Filter out past dates
    const availableDates = currentWeekDates.filter(date => !isDatePast(date));

    return (
      <View style={styles.dateSelectorContainer}>
        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity
            style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
            onPress={goToPreviousWeek}
            disabled={!canGoPrevious}
          >
            <Icon name="chevron-back" size={20} color={canGoPrevious ? "#FF4500" : "#666"} />
          </TouchableOpacity>

          <Text style={styles.weekRangeText}>{weekInfo.weekRange}</Text>

          <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
            <Icon name="chevron-forward" size={20} color="#FF4500" />
          </TouchableOpacity>
        </View>

        {/* Date Items */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollContent}
        >
          {availableDates.length > 0 ? (
            availableDates.map((date, index) => {
              const dateInfo = formatDateForDisplay(date);
              const isSelected = date.toDateString() === selectedDateState.toDateString();

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateItem,
                    isSelected && styles.selectedDateItem
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text style={[
                    styles.dayText,
                    isSelected && styles.selectedDayText
                  ]}>
                    {dateInfo.dayName}
                  </Text>
                  <Text style={[
                    styles.dateText,
                    isSelected && styles.selectedDateText
                  ]}>
                    {dateInfo.dayNumber}
                  </Text>
                  <Text style={[
                    styles.monthText,
                    isSelected && styles.selectedMonthText
                  ]}>
                    {dateInfo.monthName}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.noAvailableDatesContainer}>
              <Text style={styles.noAvailableDatesText}>
                No available dates this week. Navigate to next week.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Render showtimes for selected date
  const renderShowtimesForSelectedDate = () => {
    // Use same date key format as matchShowtimesWithWeekDates
    const normalizedDate = new Date(selectedDateState.getFullYear(), selectedDateState.getMonth(), selectedDateState.getDate());
    const selectedDateKey = `${normalizedDate.getFullYear()}-${String(normalizedDate.getMonth() + 1).padStart(2, '0')}-${String(normalizedDate.getDate()).padStart(2, '0')}`;
    const showtimesForDate = matchedShowtimes[selectedDateKey] || [];

    console.log('WeeklyShowtimeSelector: Rendering showtimes for selected date');
    console.log('  selectedDateState:', selectedDateState.toDateString());
    console.log('  selectedDateKey:', selectedDateKey);
    console.log('  matchedShowtimes keys:', Object.keys(matchedShowtimes));
    console.log('  showtimesForDate count:', showtimesForDate.length);

    if (showtimesForDate.length === 0) {
      return (
        <View style={styles.noShowtimesContainer}>
          <Icon name="calendar-outline" size={48} color="#666" />
          <Text style={styles.noShowtimesText}>
            No showtimes available for {formatDateForDisplay(selectedDateState).dayName}
          </Text>
        </View>
      );
    }

    // Group by room
    const roomGroups = groupShowtimesByRoomForDate(showtimesForDate);

    return (
      <View style={styles.showtimesContainer}>
        <Text style={styles.showtimesTitle}>
          Showtimes for {formatDateForDisplay(selectedDateState).dayName}
        </Text>

        {Object.keys(roomGroups).map((roomKey) => {
          const roomShowtimes = roomGroups[roomKey];
          const firstShowtime = roomShowtimes[0];

          return (
            <View key={roomKey} style={styles.roomContainer}>
              {/* Room Info */}
              <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{firstShowtime.room.type.name}</Text>
              </View>

              {/* Showtime Buttons */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.showtimeButtonsContainer}
              >
                {roomShowtimes.map((showtime) => {
                  const time = extractTimeFromShowtime(showtime.startTime);
                  const isAvailable = isShowtimeAvailable(showtime);
                  const isSelected = selectedShowtime?.id === showtime.id;

                  return (
                    <TouchableOpacity
                      key={showtime.id}
                      style={[
                        styles.showtimeButton,
                        !isAvailable && styles.disabledShowtimeButton,
                        isSelected && styles.selectedShowtimeButton
                      ]}
                      onPress={() => handleShowtimeSelect(showtime)}
                      disabled={!isAvailable}
                    >
                      <Text style={[
                        styles.showtimeTime,
                        !isAvailable && styles.disabledShowtimeTime,
                        isSelected && styles.selectedShowtimeTime
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderDateSelector()}
      {renderShowtimesForSelectedDate()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  dateSelectorContainer: {
    marginBottom: 20,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,69,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    opacity: 0.5,
  },
  weekRangeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateScrollContent: {
    paddingHorizontal: 16,
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 70,
    position: 'relative',
  },
  selectedDateItem: {
    backgroundColor: 'rgba(255,69,0,0.2)',
    borderColor: '#FF4500',
  },
  dayText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedDayText: {
    color: '#FF4500',
  },
  dateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'normal',
    marginBottom: 2,
  },
  selectedDateText: {
    color: '#FF4500',
  },
  monthText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
  },
  selectedMonthText: {
    color: '#FF4500',
  },
  showtimesContainer: {
    paddingHorizontal: 20,
  },
  showtimesTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  roomContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roomInfo: {
    marginBottom: 12,
  },
  roomName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  showtimeButtonsContainer: {
    gap: 12,
  },
  showtimeButton: {
    backgroundColor: 'rgba(255,69,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,69,0,0.3)',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedShowtimeButton: {
    backgroundColor: '#FF4500',
    borderColor: '#FF6B35',
    shadowColor: '#FF4500',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledShowtimeButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.5,
  },
  showtimeTime: {
    color: '#FF4500',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  selectedShowtimeTime: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledShowtimeTime: {
    color: '#666',
  },

  noShowtimesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
  },
  noShowtimesText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  noAvailableDatesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  noAvailableDatesText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default WeeklyShowtimeSelector;
