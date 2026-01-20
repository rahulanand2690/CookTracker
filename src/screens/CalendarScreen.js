import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ImageBackground } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { AppContext } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MILK_BG = require('../../assets/images/milk_bg.jpg');
const MAID_BG = require('../../assets/images/maid_bg.jpg');
const COOK_BG = require('../../assets/images/cook_bg.jpg');

const BackgroundWrapper = ({ children, activeWorkerId }) => {
    const isMilk = activeWorkerId === 'milk';
    const isMaid = activeWorkerId === 'maid';
    const isCook = activeWorkerId === 'cook';

    if (isMilk) {
        return (
            <ImageBackground source={MILK_BG} style={styles.bgImage} resizeMode="cover">
                <View style={styles.overlay}>
                    {children}
                </View>
            </ImageBackground>
        );
    }
    if (isMaid) {
        return (
            <ImageBackground source={MAID_BG} style={styles.bgImage} resizeMode="cover">
                <View style={styles.overlay}>
                    {children}
                </View>
            </ImageBackground>
        );
    }
    if (isCook) {
        return (
            <ImageBackground source={COOK_BG} style={styles.bgImage} resizeMode="cover">
                <View style={styles.overlay}>
                    {children}
                </View>
            </ImageBackground>
        );
    }
    return <View style={styles.container}>{children}</View>;
};

const AttendanceToggles = ({ shift, currentStatus, setStatus }) => {
    return (
        <View style={styles.toggleGroup}>
            <TouchableOpacity
                style={[styles.toggleBtn, currentStatus[shift] === false && styles.toggleSelectedRed]}
                onPress={() => setStatus(shift, currentStatus[shift] === false ? undefined : false)}
            >
                <Text style={[styles.toggleText, currentStatus[shift] === false && styles.textWhite]}>A</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.toggleBtn, currentStatus[shift] === true && styles.toggleSelectedGreen]}
                onPress={() => setStatus(shift, currentStatus[shift] === true ? undefined : true)}
            >
                <Text style={[styles.toggleText, currentStatus[shift] === true && styles.textWhite]}>P</Text>
            </TouchableOpacity>
        </View>
    );
};

const MilkControls = ({ shift, currentStatus, activeWorker, updateMilkLimit }) => {
    const currentQty = typeof currentStatus[shift] === 'number' ? currentStatus[shift] : (currentStatus[shift] ? activeWorker.defaultLitre : 0);
    return (
        <View style={styles.toggleGroup}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateMilkLimit(shift, -0.25)}>
                <Ionicons name="remove" size={20} color="#555" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{currentQty} L</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateMilkLimit(shift, 0.25)}>
                <Ionicons name="add" size={20} color="#555" />
            </TouchableOpacity>
        </View>
    );
};

const DayComponent = ({ date, state, activeWorker, handleDayPress, renderIndicator }) => {
    const dateStr = date.dateString;
    const status = (activeWorker && activeWorker.attendance && activeWorker.attendance[dateStr]) || {};
    const dateObj = new Date(dateStr);
    const isSunday = dateObj.getDay() === 0;
    const isDisabled = state === 'disabled' || (isSunday && (!activeWorker || !activeWorker.includeSundays));

    return (
        <TouchableOpacity
            style={[styles.dayContainer, isDisabled && styles.disabledDay]}
            onPress={() => !isDisabled && handleDayPress(date)}
            disabled={isDisabled}
        >
            <Text style={[
                styles.dayText,
                isSunday && styles.sundayText,
                state === 'disabled' && styles.disabledText,
                state === 'today' && styles.todayText
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
};

const CalendarScreen = () => {
    const { activeWorker, activeWorkerId, updateAttendance, workerMeta } = useContext(AppContext);

    if (!activeWorker) return null;

    const [selectedDate, setSelectedDate] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const isMilk = activeWorkerId === 'milk';

    const handleDayPress = React.useCallback((day) => {
        if (!day || !day.dateString) return;

        const date = new Date(day.dateString);
        if (date.getDay() === 0 && (!activeWorker || !activeWorker.includeSundays)) return;

        setSelectedDate(day.dateString);
        setModalVisible(true);
    }, [activeWorker]);

    const getDayStatus = (dateStr) => {
        if (!activeWorker || !activeWorker.attendance) return { morning: undefined, evening: undefined };
        return activeWorker.attendance[dateStr] || { morning: undefined, evening: undefined };
    };

    const currentStatus = selectedDate ? getDayStatus(selectedDate) : { morning: undefined, evening: undefined };

    const setStatus = React.useCallback((shift, value) => {
        if (selectedDate) {
            updateAttendance(selectedDate, {
                ...currentStatus,
                [shift]: value
            });
        }
    }, [selectedDate, currentStatus, updateAttendance]);

    const updateMilkLimit = React.useCallback((shift, change) => {
        let currentQty;
        if (typeof currentStatus[shift] === 'number') {
            currentQty = currentStatus[shift];
        } else if (currentStatus[shift] === true) {
            currentQty = activeWorker.defaultLitre;
        } else {
            currentQty = activeWorker.defaultLitre;
        }

        let newQty = currentQty + change;
        if (newQty < 0) newQty = 0;

        setStatus(shift, newQty);
    }, [currentStatus, activeWorker.defaultLitre, setStatus]);

    const renderIndicator = React.useCallback((status) => {
        if (typeof status === 'number') return styles.bgGreen; // Custom quantity
        if (status === true) return styles.bgGreen; // Present (Default)
        if (status === false) return styles.bgRed;   // Absent
        return styles.bgGray;                        // Not Marked
    }, []);

    return (
        <BackgroundWrapper activeWorkerId={activeWorkerId}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ padding: 20 }}>
                    <Text style={styles.headerTitle}>Attendance Calendar</Text>
                    <Text style={styles.subHeader}>For: {workerMeta.name}</Text>

                    <Calendar
                        onDayPress={handleDayPress}
                        theme={{
                            todayTextColor: '#7E57C2',
                            arrowColor: '#7E57C2',
                            textMonthFontWeight: 'bold',
                            textMonthFontSize: 18,
                            calendarBackground: 'transparent',
                            textSectionTitleColor: '#333',
                            dayTextColor: '#333'
                        }}
                        dayComponent={(props) => (
                            <DayComponent
                                {...props}
                                activeWorker={activeWorker}
                                handleDayPress={handleDayPress}
                                renderIndicator={renderIndicator}
                            />
                        )}
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
                                    {selectedDate && new Date(selectedDate).toDateString()}
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
                                    {isMilk ? (
                                        <MilkControls
                                            shift="morning"
                                            currentStatus={currentStatus}
                                            activeWorker={activeWorker}
                                            updateMilkLimit={updateMilkLimit}
                                        />
                                    ) : (
                                        <AttendanceToggles
                                            shift="morning"
                                            currentStatus={currentStatus}
                                            setStatus={setStatus}
                                        />
                                    )}
                                </View>
                            )}

                            {/* Evening Row */}
                            {activeWorker.shifts.evening && (
                                <View style={styles.shiftRow}>
                                    <View style={styles.shiftLabelRow}>
                                        <Ionicons name="moon-outline" size={20} color="#3F51B5" />
                                        <Text style={styles.shiftLabel}>Evening</Text>
                                    </View>
                                    {isMilk ? (
                                        <MilkControls
                                            shift="evening"
                                            currentStatus={currentStatus}
                                            activeWorker={activeWorker}
                                            updateMilkLimit={updateMilkLimit}
                                        />
                                    ) : (
                                        <AttendanceToggles
                                            shift="evening"
                                            currentStatus={currentStatus}
                                            setStatus={setStatus}
                                        />
                                    )}
                                </View>
                            )}

                            {!activeWorker.shifts.morning && !activeWorker.shifts.evening && (
                                <Text style={styles.hintText}>No shifts enabled. Go to Payment Settings to enable shifts.</Text>
                            )}

                            {isMilk && (
                                <Text style={styles.hintText}>Adjust quantity in 0.25L increments.</Text>
                            )}

                        </View>
                    </TouchableOpacity>
                </Modal>
            </SafeAreaView>
        </BackgroundWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    bgImage: {
        flex: 1,
        width: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 5
    },
    subHeader: {
        fontSize: 16,
        color: '#7E57C2',
        marginBottom: 20,
        fontWeight: '600'
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
    },
    qtyBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center'
    },
    qtyText: {
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 50,
        textAlign: 'center'
    },
});

export default CalendarScreen;
