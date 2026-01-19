import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { AppContext } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Placeholder for the background image - In a real app, this would be imported from assets
// const MILK_BG = require('../../assets/images/milk_bg.png'); 
// Using a subtle color/gradient logic or verify if user provided asset is available. 
// Since we don't have the file physically in the native bundle yet without a rebuild/add, 
// we will assume it's available or use a condition. For now, conditional styling.

const HomeScreen = () => {
    const { activeWorkerId, setActiveWorkerId, activeWorker, updateAttendance, getStatsForMonth, WORKER_TYPES } = useContext(AppContext);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const stats = getStatsForMonth(now.getFullYear(), now.getMonth() + 1);

    const todayStatus = activeWorker.attendance[dateStr] || { morning: undefined, evening: undefined };

    const isMilk = activeWorkerId === 'milk';

    const toggleShift = (shift) => {
        let newVal; // Undefined -> Present (true) -> Absent (false) -> Undefined
        if (todayStatus[shift] === undefined) newVal = true;
        else if (todayStatus[shift] === true) newVal = false;
        else newVal = undefined;

        const newStatus = { ...todayStatus, [shift]: newVal };
        updateAttendance(dateStr, newStatus);
    };

    const updateMilkLimit = (shift, change) => {
        const currentQty = typeof todayStatus[shift] === 'number'
            ? todayStatus[shift]
            : activeWorker.defaultLitre; // Start from default if currently generic 'true' or undefined

        let newQty = currentQty + change;
        if (newQty < 0) newQty = 0; // Minimum 0

        // If 0, maybe mark as absent? Or just 0 litres present? Let's keep it simple: 0 litres is still 'present' record but 0 cost. 
        // Or if user specifically wants 'Absent', they can toggle via a separate mechanism?
        // Simpler: If quantity > 0, calculate cost. Explicit Absent is tricky with just +/- buttons.
        // Let's treat 0 as 0 quantity. 

        const newStatus = { ...todayStatus, [shift]: newQty };
        updateAttendance(dateStr, newStatus);
    };

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    }).format(now);

    const renderStatusText = (status) => {
        if (isMilk && typeof status === 'number') return { text: `${status} Litres`, color: '#4CAF50' };
        if (status === true) return { text: isMilk ? `${activeWorker.defaultLitre} Litres (Default)` : 'Marked Present', color: '#4CAF50' };
        if (status === false) return { text: 'Marked Absent', color: '#EF5350' };
        return { text: 'Not marked yet', color: '#999' };
    };

    const renderMilkControls = (shift) => {
        const currentQty = typeof todayStatus[shift] === 'number' ? todayStatus[shift] : (todayStatus[shift] === true ? activeWorker.defaultLitre : 0);

        return (
            <View style={styles.qtyControls}>
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

    const BackgroundWrapper = ({ children }) => {
        if (isMilk) {
            // For now using style since we don't have the asset link working in Expo Go without download
            // In real scenario: <ImageBackground source={require('path')} ... >
            return <View style={[styles.container, styles.milkBackground]}>{children}</View>;
        }
        return <View style={styles.container}>{children}</View>;
    };

    return (
        <BackgroundWrapper>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Worker Selector */}
                    <View style={styles.workerSelector}>
                        {Object.keys(WORKER_TYPES).map((key) => {
                            const isActive = activeWorkerId === key;
                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.workerChip, isActive && styles.workerChipActive]}
                                    onPress={() => setActiveWorkerId(key)}
                                >
                                    <Text style={[styles.workerText, isActive && styles.workerTextActive]}>
                                        {WORKER_TYPES[key].name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.date}>{formattedDate}</Text>
                        <View style={styles.greetingRow}>
                            <Text style={styles.greeting}>Hi, Rahul</Text>
                            <Text style={styles.wave}>👋</Text>
                        </View>
                        <Text style={styles.subHeader}>Tracking: {WORKER_TYPES[activeWorkerId].name}</Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
                            <Text style={styles.statLabel}>Payable</Text>
                            <Text style={styles.statValue}>₹{stats.totalSalary}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                            <Text style={styles.statLabel}>{isMilk ? 'Total Litres' : 'Attendance'}</Text>
                            <Text style={styles.statValue}>{isMilk ? `${stats.totalLitres} L` : `${stats.totalPresentShifts} shifts`}</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Today's Status</Text>

                    {/* Morning Card */}
                    {activeWorker.shifts.morning && (
                        <TouchableOpacity
                            style={styles.shiftCard}
                            onPress={() => !isMilk && toggleShift('morning')}
                        >
                            <View style={[styles.shiftIconContainer, { backgroundColor: '#FFF3E0' }]}>
                                <Ionicons name="sunny" size={24} color="#FFA000" />
                            </View>
                            <View style={styles.shiftInfo}>
                                <Text style={styles.shiftTitle}>Morning</Text>
                                <Text style={[styles.shiftStatus, { color: renderStatusText(todayStatus.morning).color }]}>
                                    {renderStatusText(todayStatus.morning).text}
                                </Text>
                            </View>

                            {isMilk ? renderMilkControls('morning') : (
                                <View style={[styles.checkCircle, todayStatus.morning === true && styles.completedCircle, todayStatus.morning === false && styles.absentCircle]}>
                                    {todayStatus.morning === true && <Ionicons name="checkmark" size={16} color="#fff" />}
                                    {todayStatus.morning === false && <Ionicons name="close" size={16} color="#fff" />}
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Evening Card */}
                    {activeWorker.shifts.evening && (
                        <TouchableOpacity
                            style={styles.shiftCard}
                            onPress={() => !isMilk && toggleShift('evening')}
                        >
                            <View style={[styles.shiftIconContainer, { backgroundColor: '#E8EAF6' }]}>
                                <Ionicons name="moon" size={20} color="#3F51B5" />
                            </View>
                            <View style={styles.shiftInfo}>
                                <Text style={styles.shiftTitle}>Evening</Text>
                                <Text style={[styles.shiftStatus, { color: renderStatusText(todayStatus.evening).color }]}>
                                    {renderStatusText(todayStatus.evening).text}
                                </Text>
                            </View>
                            {isMilk ? renderMilkControls('evening') : (
                                <View style={[styles.checkCircle, todayStatus.evening === true && styles.completedCircle, todayStatus.evening === false && styles.absentCircle]}>
                                    {todayStatus.evening === true && <Ionicons name="checkmark" size={16} color="#fff" />}
                                    {todayStatus.evening === false && <Ionicons name="close" size={16} color="#fff" />}
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {!activeWorker.shifts.morning && !activeWorker.shifts.evening && (
                        <Text style={styles.noShiftsText}>No shifts enabled.</Text>
                    )}

                </ScrollView>
            </SafeAreaView>
        </BackgroundWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    milkBackground: {
        backgroundColor: '#F1F8E9' // Light green tint as fallback/theme
    },
    scrollContent: {
        padding: 20,
    },
    workerSelector: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10
    },
    workerChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    workerChipActive: {
        backgroundColor: '#333',
    },
    workerText: {
        color: '#666',
        fontWeight: '600'
    },
    workerTextActive: {
        color: '#fff'
    },
    header: {
        marginBottom: 30,
    },
    date: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    wave: {
        fontSize: 28,
        marginLeft: 10,
    },
    subHeader: {
        fontSize: 14,
        color: '#7E57C2',
        fontWeight: 'bold',
        marginTop: 5
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        width: '48%',
        padding: 20,
        borderRadius: 20,
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    shiftCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 15,
        backgroundColor: 'rgba(255,255,255,0.8)', // Semi transparent for BG
        elevation: 1,
    },
    shiftIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    shiftInfo: {
        flex: 1,
    },
    shiftTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    shiftStatus: {
        fontSize: 12,
    },
    checkCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedCircle: {
        backgroundColor: '#4CAF50', // Green
        borderColor: '#4CAF50',
    },
    absentCircle: {
        backgroundColor: '#EF5350', // Red
        borderColor: '#EF5350'
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    qtyBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center'
    },
    qtyText: {
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 50,
        textAlign: 'center'
    },
    noShiftsText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20
    }
});

export default HomeScreen;
