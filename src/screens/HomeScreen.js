import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Modal } from 'react-native';
import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Using the newly moved asset
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

const StatusText = ({ status, isMilk, activeWorker }) => {
    if (isMilk && typeof status === 'number') return <Text style={[styles.shiftStatus, { color: '#4CAF50' }]}>{status} Litres</Text>;
    if (status === true) return <Text style={[styles.shiftStatus, { color: '#4CAF50' }]}>{isMilk ? `${activeWorker.defaultLitre} Litres (Default)` : 'Marked Present'}</Text>;
    if (status === false) return <Text style={[styles.shiftStatus, { color: '#EF5350' }]}>Marked Absent</Text>;
    return <Text style={[styles.shiftStatus, { color: '#999' }]}>Not marked yet</Text>;
};

const MilkAttendanceSelector = ({ shift, todayStatus, activeWorker, toggleShift, onAdjust }) => {
    const status = todayStatus[shift];
    const isPresent = status === true || typeof status === 'number';

    const currentQty = typeof status === 'number' ? status : (status === true ? activeWorker.defaultLitre : 0);

    return (
        <View style={styles.milkCardContent}>
            <View style={styles.milkInfoRow}>
                <View style={[styles.shiftIconContainer, { backgroundColor: shift === 'morning' ? '#FFF3E0' : '#E8EAF6' }]}>
                    <Ionicons name={shift === 'morning' ? "sunny" : "moon"} size={24} color={shift === 'morning' ? "#FFA000" : "#3F51B5"} />
                </View>
                <View style={styles.milkTextCol}>
                    <Text style={styles.shiftTitle}>{shift.charAt(0).toUpperCase() + shift.slice(1)}</Text>
                    <Text style={[styles.shiftStatus, { color: isPresent ? '#4CAF50' : '#999' }]}>
                        {isPresent ? `${currentQty} Litres` : 'Not marked'}
                    </Text>
                </View>
            </View>

            <View style={styles.milkActionRow}>
                <TouchableOpacity style={styles.adjustBtn} onPress={() => onAdjust(shift)}>
                    <Ionicons name="options-outline" size={20} color="#7E57C2" />
                    <Text style={styles.adjustText}>Adjust</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.simpleRadio, isPresent && styles.radioPresent]}
                    onPress={() => toggleShift(shift, isPresent ? undefined : true)}
                >
                    {isPresent && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const MilkAdjustmentModal = ({ visible, onClose, shift, todayStatus, activeWorker, updateMilkLimit }) => {
    if (!shift) return null;
    const currentQty = typeof todayStatus[shift] === 'number' ? todayStatus[shift] : (todayStatus[shift] === true ? activeWorker.defaultLitre : 0);

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                    <Text style={styles.modalTitle}>Adjust Milk Quantity</Text>
                    <Text style={styles.modalSub}>{shift.charAt(0).toUpperCase() + shift.slice(1)} Shift</Text>

                    <View style={styles.popupQtyRow}>
                        <TouchableOpacity style={styles.popupQtyBtn} onPress={() => updateMilkLimit(shift, -0.25)}>
                            <Text style={styles.popupQtyBtnText}>-250ml</Text>
                        </TouchableOpacity>

                        <View style={styles.popupQtyDisplay}>
                            <Text style={styles.popupQtyValue}>{currentQty}</Text>
                            <Text style={styles.popupQtyUnit}>Litres</Text>
                        </View>

                        <TouchableOpacity style={styles.popupQtyBtn} onPress={() => updateMilkLimit(shift, 0.25)}>
                            <Text style={styles.popupQtyBtnText}>+250ml</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.popupHint}>Default: {activeWorker.defaultLitre} L</Text>

                    <TouchableOpacity style={styles.popupCloseBtn} onPress={onClose}>
                        <Text style={styles.popupCloseBtnText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const HomeScreen = () => {
    const { activeWorkerId, setActiveWorkerId, activeWorker, updateAttendance, getStatsForMonth, WORKER_TYPES } = useContext(AppContext);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const stats = getStatsForMonth(now.getFullYear(), now.getMonth() + 1);

    const todayStatus = activeWorker.attendance[dateStr] || { morning: undefined, evening: undefined };

    const isMilk = activeWorkerId === 'milk';

    const [adjustModalVisible, setAdjustModalVisible] = useState(false);
    const [editingShift, setEditingShift] = useState(null);

    const toggleShift = React.useCallback((shift, forcedVal) => {
        let newVal;
        if (forcedVal !== undefined) {
            newVal = forcedVal;
        } else {
            if (todayStatus[shift] === undefined) newVal = true;
            else if (todayStatus[shift] === true) newVal = false;
            else newVal = undefined;
        }

        const newStatus = { ...todayStatus, [shift]: newVal };
        updateAttendance(dateStr, newStatus);
    }, [todayStatus, dateStr, updateAttendance]);

    const handleAdjust = (shift) => {
        setEditingShift(shift);
        setAdjustModalVisible(true);
    };

    const updateMilkLimit = React.useCallback((shift, change) => {
        let currentQty;
        if (typeof todayStatus[shift] === 'number') {
            currentQty = todayStatus[shift];
        } else if (todayStatus[shift] === true) {
            currentQty = activeWorker.defaultLitre;
        } else {
            currentQty = 0;
        }

        if (typeof todayStatus[shift] !== 'number' && todayStatus[shift] !== true) {
            currentQty = activeWorker.defaultLitre;
        }

        let newQty = currentQty + change;
        if (newQty < 0) newQty = 0;

        const newStatus = { ...todayStatus, [shift]: newQty };
        updateAttendance(dateStr, newStatus);
    }, [todayStatus, activeWorker.defaultLitre, dateStr, updateAttendance]);

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    }).format(now);





    return (
        <BackgroundWrapper activeWorkerId={activeWorkerId}>
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
                        <View style={[styles.shiftCard, isMilk && styles.milkShiftCard]}>
                            {isMilk ? (
                                <MilkAttendanceSelector
                                    shift="morning"
                                    todayStatus={todayStatus}
                                    activeWorker={activeWorker}
                                    toggleShift={toggleShift}
                                    onAdjust={handleAdjust}
                                />
                            ) : (
                                <TouchableOpacity
                                    style={styles.cardInternalLayout}
                                    onPress={() => toggleShift('morning')}
                                >
                                    <View style={[styles.shiftIconContainer, { backgroundColor: '#FFF3E0' }]}>
                                        <Ionicons name="sunny" size={24} color="#FFA000" />
                                    </View>
                                    <View style={styles.shiftInfo}>
                                        <Text style={styles.shiftTitle}>Morning</Text>
                                        <StatusText status={todayStatus.morning} isMilk={isMilk} activeWorker={activeWorker} />
                                    </View>
                                    <View style={[styles.checkCircle, todayStatus.morning === true && styles.completedCircle, todayStatus.morning === false && styles.absentCircle]}>
                                        {todayStatus.morning === true && <Ionicons name="checkmark" size={16} color="#fff" />}
                                        {todayStatus.morning === false && <Ionicons name="close" size={16} color="#fff" />}
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Evening Card */}
                    {activeWorker.shifts.evening && (
                        <View style={[styles.shiftCard, isMilk && styles.milkShiftCard]}>
                            {isMilk ? (
                                <MilkAttendanceSelector
                                    shift="evening"
                                    todayStatus={todayStatus}
                                    activeWorker={activeWorker}
                                    toggleShift={toggleShift}
                                    onAdjust={handleAdjust}
                                />
                            ) : (
                                <TouchableOpacity
                                    style={styles.cardInternalLayout}
                                    onPress={() => toggleShift('evening')}
                                >
                                    <View style={[styles.shiftIconContainer, { backgroundColor: '#E8EAF6' }]}>
                                        <Ionicons name="moon" size={20} color="#3F51B5" />
                                    </View>
                                    <View style={styles.shiftInfo}>
                                        <Text style={styles.shiftTitle}>Evening</Text>
                                        <StatusText status={todayStatus.evening} isMilk={isMilk} activeWorker={activeWorker} />
                                    </View>
                                    <View style={[styles.checkCircle, todayStatus.evening === true && styles.completedCircle, todayStatus.evening === false && styles.absentCircle]}>
                                        {todayStatus.evening === true && <Ionicons name="checkmark" size={16} color="#fff" />}
                                        {todayStatus.evening === false && <Ionicons name="close" size={16} color="#fff" />}
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {!activeWorker.shifts.morning && !activeWorker.shifts.evening && (
                        <Text style={styles.noShiftsText}>No shifts enabled.</Text>
                    )}

                    {isMilk && (
                        <MilkAdjustmentModal
                            visible={adjustModalVisible}
                            onClose={() => setAdjustModalVisible(false)}
                            shift={editingShift}
                            todayStatus={todayStatus}
                            activeWorker={activeWorker}
                            updateMilkLimit={updateMilkLimit}
                        />
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
    milkCardContent: {
        width: '100%'
    },
    milkInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15
    },
    milkTextCol: {
        flex: 1
    },
    milkActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12
    },
    simpleRadio: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
    },
    radioPresent: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50'
    },
    milkShiftCard: {
        padding: 15,
        minHeight: 120
    },
    cardInternalLayout: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    adjustBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 12,
        backgroundColor: '#F3E5F5',
        borderWidth: 1,
        borderColor: '#7E57C2'
    },
    adjustText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#7E57C2'
    },
    // Popup Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 25,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333'
    },
    modalSub: {
        fontSize: 14,
        color: '#7E57C2',
        fontWeight: '600',
        marginBottom: 20
    },
    popupQtyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginVertical: 10
    },
    popupQtyBtn: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee'
    },
    popupQtyBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333'
    },
    popupQtyDisplay: {
        alignItems: 'center'
    },
    popupQtyValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#333'
    },
    popupQtyUnit: {
        fontSize: 14,
        color: '#666'
    },
    popupHint: {
        fontSize: 12,
        color: '#999',
        marginTop: 15
    },
    popupCloseBtn: {
        marginTop: 25,
        backgroundColor: '#7E57C2',
        width: '100%',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center'
    },
    popupCloseBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
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
