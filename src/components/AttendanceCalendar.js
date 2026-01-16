import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

const AttendanceCalendar = ({ markedDates, onDayPress }) => {
    return (
        <Calendar
            onDayPress={(day) => onDayPress(day)}
            dayComponent={({ date, state }) => {
                const dateString = date.dateString;
                const attendance = markedDates[dateString] || {};
                const isSunday = new Date(dateString).getDay() === 0;

                return (
                    <TouchableOpacity
                        style={[styles.dayContainer, isSunday && styles.sundayContainer]}
                        onPress={() => !isSunday && onDayPress(date)}
                        disabled={state === 'disabled' || isSunday}
                    >
                        <Text style={[styles.dayText, state === 'disabled' && styles.disabledText, isSunday && styles.sundayText]}>
                            {date.day}
                        </Text>
                        {!isSunday && (
                            <View style={styles.dotsContainer}>
                                <View style={[styles.dot, attendance.morning && styles.morningDot]} />
                                <View style={[styles.dot, attendance.evening && styles.eveningDot]} />
                            </View>
                        )}
                        {isSunday && <Text style={styles.holidayText}>Sun</Text>}
                    </TouchableOpacity>
                );
            }}
            theme={{
                todayTextColor: '#2d4150',
                arrowColor: '#2d4150',
            }}
        />
    );
};

const styles = StyleSheet.create({
    dayContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        width: 40,
    },
    sundayContainer: {
        backgroundColor: '#ffebee',
        borderRadius: 20,
    },
    dayText: {
        fontSize: 14,
        color: '#2d4150',
    },
    disabledText: {
        color: '#d9e1e8',
    },
    sundayText: {
        color: '#d32f2f',
        fontWeight: 'bold',
    },
    dotsContainer: {
        flexDirection: 'row',
        marginTop: 2,
        gap: 2, // Works in newer React Native/Expo
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#eee',
        marginHorizontal: 1,
    },
    morningDot: {
        backgroundColor: '#FF9800', // Orange for morning
    },
    eveningDot: {
        backgroundColor: '#3F51B5', // Indigo for evening
    },
    holidayText: {
        fontSize: 8,
        color: '#d32f2f',
    },
});

export default AttendanceCalendar;
