import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { AppContext } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Using the newly moved asset
const MILK_BG = require('../../assets/images/milk_bg.jpg');
const MAID_BG = require('../../assets/images/maid_bg.jpg');
const COOK_BG = require('../../assets/images/cook_bg.jpg');

const HomeScreen = () => {
    const { activeWorkerId, setActiveWorkerId, activeWorker, updateAttendance, getStatsForMonth, WORKER_TYPES } = useContext(AppContext);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const stats = getStatsForMonth(now.getFullYear(), now.getMonth() + 1);

    const todayStatus = activeWorker.attendance[dateStr] || { morning: undefined, evening: undefined };

    const isMilk = activeWorkerId === 'milk';
    const isMaid = activeWorkerId === 'maid';
    const isCook = activeWorkerId === 'cook';

    const toggleShift = (shift) => {
        let newVal; // Undefined -> Present (true) -> Absent (false) -> Undefined
        if (todayStatus[shift] === undefined) newVal = true;
        else if (todayStatus[shift] === true) newVal = false;
        else newVal = undefined;

        const newStatus = { ...todayStatus, [shift]: newVal };
        updateAttendance(dateStr, newStatus);
    };

    const updateMilkLimit = (shift, change) => {
        let currentQty;
        // If it's a number, use it.
        if (typeof todayStatus[shift] === 'number') {
            currentQty = todayStatus[shift];
        } else if (todayStatus[shift] === true) {
            // If marked 'true' (Present), treat as default litre
            currentQty = activeWorker.defaultLitre;
        } else {
            // If undefined (not marked) or false (Absent)
            // We want the *first* click (especially +) to start at defaultLitre
            // But if we are adding 0.25 to "nothing", logical expectations:
            // Option A: 0 + 0.25 = 0.25
            // Option B: Jump to Default (e.g. 1.0)
            // User req: "start with default Daily Litres ... instead of 0 litres"

            // If we assume "start with" means the base value before adding 'change'
            // If nothing is marked, base is 0. So 0 + 0.25 = 0.25. 
            // But user wants "start with default".
            // Maybe they mean: If I click '+', it should become (Default + 0.25)? 
            // Or if I click '+', it becomes Default immediately? -> No, that's what 'Present' toggle is for.
            // Likely: The "starting point" is Default. 
            // So if Default is 1L.
            // If I have nothing, and click '+', it becomes 1.25L ?? (1L default + 0.25)
            // Or does it become 1L? 
            // Let's implement: If Unmarked/Absent -> Treat 'current' as Default Litre.
            currentQty = 0;
        }

        // Wait, if I treat 'current' as Default (1L), then 1L + 0.25 = 1.25L.
        // It skips 0.25, 0.5, 0.75... 
        // Re-reading: "litres should start with default Daily Litres ... instead of 0 litres"
        // This implies the standard daily delivery is X. Adjustments are from X.
        // So yes, if I have nothing recorded, assume I got the usual (Default) and want to adjust it.

        if (typeof todayStatus[shift] !== 'number' && todayStatus[shift] !== true) {
            // First interaction on an empty/absent shift
            // "Start with default"
            currentQty = activeWorker.defaultLitre;

            // BUT, if I just clicked '+', do I want (Default + 0.25) or just (Default)?
            // Usually controls are +/-. 
            // If the display shows "0 L" (calculated), and I click +, it should go to 0.25.
            // But user says "start with Default ... instead of 0".
            // So display should probably show Default initially? No, that would be confusing if attendance is unmarked.

            // INTERPRETATION: When I interact with the +/- controls, Initialize at Default.
            // So: New Value = Default + Change.
        }

        let newQty = currentQty + change;
        if (newQty < 0) newQty = 0;

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
        // Correctly read 'true' as defaultLitre for display
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
    bgImage: {
        flex: 1,
        width: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.7)' // White overlay to ensure readability over the image
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
        backgroundColor: 'rgba(255,255,255,0.9)',
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
