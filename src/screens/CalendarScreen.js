import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { AppContext } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CalendarScreen = () => {
    const { activeWorker, updateAttendance } = useContext(AppContext);
    const [selectedDate, setSelectedDate] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const handleDayPress = (day) => {
        // Prevent selecting Sundays
        const date = new Date(day.dateString);
        if (date.getDay() === 0) return;

        setSelectedDate(day.dateString);
        setModalVisible(true);
    };

    const getDayStatus = (dateStr) => {
        return activeWorker.attendance[dateStr] || { morning: undefined, evening: undefined };
    };

    const currentStatus = selectedDate ? getDayStatus(selectedDate) : { morning: undefined, evening: undefined };

    const setStatus = (shift, value) => {
        if (selectedDate) {
            updateAttendance(selectedDate, {
                ...currentStatus,
                [shift]: value
            });
        }
    };

    const renderIndicator = (status) => {
        if (status === true) return styles.bgGreen; // Present
        if (status === false) return styles.bgRed;   // Absent
        return styles.bgGray;                        // Not Marked
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.headerTitle}>Attendance Calendar</Text>

            <Calendar
                onDayPress={handleDayPress}
                theme={{
                    todayTextColor: '#7E57C2',
                    arrowColor: '#7E57C2',
                    textMonthFontWeight: 'bold',
                    textMonthFontSize: 18,
                }}
                dayComponent={({ date, state }) => {
                    const dateStr = date.dateString;
                    const status = activeWorker.attendance[dateStr] || {};
                    const isSunday = new Date(dateStr).getDay() === 0;
                    const isToday = state === 'today';

                    return (
                        <TouchableOpacity
                            style={[styles.dayContainer, isSunday && styles.disabledDay]}
                            onPress={() => !isSunday && handleDayPress(date)}
                            disabled={state === 'disabled' || isSunday}
                        >
                            <Text style={[
                                styles.dayText,
                                isSunday && styles.sundayText,
                                state === 'disabled' && styles.disabledText,
                                isToday && styles.todayText
                            ]}>
                                {date.day}
                            </Text>
                            {!isSunday && (
                                <View style={styles.indicatorRow}>
                                    {activeWorker.shifts.morning && <View style={[styles.indicator, renderIndicator(status.morning)]} />}
                                    {activeWorker.shifts.evening && <View style={[styles.indicator, renderIndicator(status.evening)]} />}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Manual Legend */}
            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.indicator, styles.bgGreen]} />
                    <Text style={styles.legendText}>Present</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.indicator, styles.bgRed]} />
                    <Text style={styles.legendText}>Absent</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.indicator, styles.bgGray]} />
                    <Text style={styles.legendText}>Unmarked</Text>
                </View>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalDate}>
                                {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSub}>Mark attendance for this day</Text>

                        {/* Morning Row */}
                        {activeWorker.shifts.morning && (
                            <View style={styles.shiftRow}>
                                <View style={styles.shiftLabelRow}>
                                    <Ionicons name="sunny-outline" size={20} color="#FFA000" />
                                    <Text style={styles.shiftLabel}>Morning</Text>
                                </View>
                                <View style={styles.toggleGroup}>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, currentStatus.morning === false && styles.toggleSelectedRed]}
                                        onPress={() => setStatus('morning', currentStatus.morning === false ? undefined : false)}
                                    >
                                        <Text style={[styles.toggleText, currentStatus.morning === false && styles.textWhite]}>A</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.toggleBtn, currentStatus.morning === true && styles.toggleSelectedGreen]}
                                        onPress={() => setStatus('morning', currentStatus.morning === true ? undefined : true)}
                                    >
                                        <Text style={[styles.toggleText, currentStatus.morning === true && styles.textWhite]}>P</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Evening Row */}
                        {activeWorker.shifts.evening && (
                            <View style={styles.shiftRow}>
                                <View style={styles.shiftLabelRow}>
                                    <Ionicons name="moon-outline" size={20} color="#3F51B5" />
                                    <Text style={styles.shiftLabel}>Evening</Text>
                                </View>
                                <View style={styles.toggleGroup}>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, currentStatus.evening === false && styles.toggleSelectedRed]}
                                        onPress={() => setStatus('evening', currentStatus.evening === false ? undefined : false)}
                                    >
                                        <Text style={[styles.toggleText, currentStatus.evening === false && styles.textWhite]}>A</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.toggleBtn, currentStatus.evening === true && styles.toggleSelectedGreen]}
                                        onPress={() => setStatus('evening', currentStatus.evening === true ? undefined : true)}
                                    >
                                        <Text style={[styles.toggleText, currentStatus.evening === true && styles.textWhite]}>P</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {!activeWorker.shifts.morning && !activeWorker.shifts.evening && (
                            <Text style={styles.hintText}>No shifts enabled. Go to Payment Settings to enable shifts.</Text>
                        )}

                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20
    },
    dayContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        width: 40
    },
    dayText: {
        fontSize: 16,
        marginBottom: 4
    },
    disabledDay: {
        opacity: 0.5
    },
    sundayText: {
        color: 'red'
    },
    disabledText: {
        color: '#ccc'
    },
    todayText: {
        color: '#7E57C2',
        fontWeight: 'bold'
    },
    indicatorRow: {
        flexDirection: 'row',
        gap: 4
    },
    indicator: {
        width: 12,
        height: 4,
        borderRadius: 2
    },
    bgGreen: { backgroundColor: '#4CAF50' },
    bgRed: { backgroundColor: '#EF5350' },
    bgGray: { backgroundColor: '#EEEEEE' },

    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        gap: 15
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    legendText: { fontSize: 12, color: '#666' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    modalDate: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    modalSub: {
        color: '#666',
        marginTop: 5,
        marginBottom: 20
    },
    shiftRow: {
        backgroundColor: '#F5F5F5',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10
    },
    shiftLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    shiftLabel: {
        fontSize: 16,
        fontWeight: '500'
    },
    toggleGroup: {
        flexDirection: 'row',
        gap: 10
    },
    toggleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    toggleSelectedGreen: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50'
    },
    toggleSelectedRed: {
        backgroundColor: '#EF5350',
        borderColor: '#EF5350'
    },
    toggleText: {
        fontSize: 14,
        color: '#666',
        fontWeight: 'bold'
    },
    textWhite: {
        color: '#fff',
        fontWeight: 'bold'
    },
    hintText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#999',
        marginTop: 10
    }
});

export default CalendarScreen;
