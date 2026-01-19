import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Switch, ImageBackground } from 'react-native';
import { AppContext } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MILK_BG = require('../../assets/images/milk_bg.jpg');

const PaymentsScreen = () => {
    const { activeWorkerId, activeWorker, updateWorkerSettings, getStatsForMonth, workerMeta } = useContext(AppContext);
    const now = new Date();

    const isMilk = activeWorkerId === 'milk';

    const [editingSalary, setEditingSalary] = useState(activeWorker.salary?.toString() || '0');
    const [ratePerLitre, setRatePerLitre] = useState(activeWorker.ratePerLitre?.toString() || '0');
    const [defaultLitre, setDefaultLitre] = useState(activeWorker.defaultLitre?.toString() || '1');
    const [shifts, setShifts] = useState(activeWorker.shifts);

    useEffect(() => {
        setEditingSalary(activeWorker.salary?.toString() || '0');
        setRatePerLitre(activeWorker.ratePerLitre?.toString() || '0');
        setDefaultLitre(activeWorker.defaultLitre?.toString() || '1');
        setShifts(activeWorker.shifts);
    }, [activeWorker]);

    const stats = getStatsForMonth(now.getFullYear(), now.getMonth() + 1);

    const handleSave = () => {
        if (!shifts.morning && !shifts.evening) {
            Alert.alert('Error', 'At least one shift must be enabled.');
            setShifts(activeWorker.shifts);
            return;
        }

        const settings = {
            shifts,
            salary: parseInt(editingSalary) || 0,
            ratePerLitre: parseFloat(ratePerLitre) || 0,
            defaultLitre: parseFloat(defaultLitre) || 1
        };
        updateWorkerSettings(settings);
    };

    const toggleShift = (shift) => {
        const newShifts = { ...shifts, [shift]: !shifts[shift] };
        setShifts(newShifts);
        // Immediate save for toggles
        updateWorkerSettings({
            shifts: newShifts,
            salary: parseInt(editingSalary) || 0,
            ratePerLitre: parseFloat(ratePerLitre) || 0,
            defaultLitre: parseFloat(defaultLitre) || 1
        });
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
        return <View style={styles.container}>{children}</View>;
    };

    const monthName = now.toLocaleDateString('en-US', { month: 'long' });

    return (
        <BackgroundWrapper>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.header}>Payments & Settings</Text>
                    <Text style={styles.subHeader}>For: {workerMeta.name}</Text>

                    <Text style={styles.sectionTitle}>Shift Configuration</Text>
                    <View style={[styles.configContainer, isMilk && styles.milkCard]}>
                        <View style={styles.shiftToggleRow}>
                            <View style={styles.shiftLabelGroup}>
                                <Ionicons name="sunny" size={20} color="#FFA000" />
                                <Text style={styles.toggleLabel}>Morning Shift</Text>
                            </View>
                            <Switch
                                value={shifts.morning}
                                onValueChange={() => toggleShift('morning')}
                                trackColor={{ false: "#767577", true: "#ffcc80" }}
                                thumbColor={shifts.morning ? "#FFA000" : "#f4f3f4"}
                            />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.shiftToggleRow}>
                            <View style={styles.shiftLabelGroup}>
                                <Ionicons name="moon" size={20} color="#3F51B5" />
                                <Text style={styles.toggleLabel}>Evening Shift</Text>
                            </View>
                            <Switch
                                value={shifts.evening}
                                onValueChange={() => toggleShift('evening')}
                                trackColor={{ false: "#767577", true: "#9fa8da" }}
                                thumbColor={shifts.evening ? "#3F51B5" : "#f4f3f4"}
                            />
                        </View>
                    </View>

                    <Text style={styles.sectionTitleWithOptions}>Cost Settings</Text>

                    <View style={styles.controlsRow}>
                        <View style={styles.controlGroup}>
                            <Text style={styles.label}>Month</Text>
                            <View style={[styles.inputContainer, isMilk && styles.milkCard]}>
                                <Text style={styles.inputValue}>{monthName}</Text>
                            </View>
                        </View>

                        {!isMilk && (
                            <View style={styles.controlGroup}>
                                <Text style={styles.label}>Base Salary</Text>
                                <View style={[styles.inputContainer, styles.editableInput]}>
                                    <Text style={styles.currencySymbol}>₹</Text>
                                    <TextInput
                                        value={editingSalary}
                                        onChangeText={setEditingSalary}
                                        keyboardType="numeric"
                                        onEndEditing={handleSave}
                                        style={styles.textInput}
                                    />
                                </View>
                            </View>
                        )}

                        {isMilk && (
                            <View style={styles.controlGroup}>
                                <Text style={styles.label}>Rate / Litre</Text>
                                <View style={[styles.inputContainer, styles.editableInput, isMilk && styles.milkCard]}>
                                    <Text style={styles.currencySymbol}>₹</Text>
                                    <TextInput
                                        value={ratePerLitre}
                                        onChangeText={setRatePerLitre}
                                        keyboardType="numeric"
                                        onEndEditing={handleSave}
                                        style={styles.textInput}
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    {isMilk && (
                        <View style={styles.rowSingle}>
                            <Text style={styles.label}>Default Daily Litres</Text>
                            <View style={[styles.inputContainer, styles.editableInput, isMilk && styles.milkCard]}>
                                <Ionicons name="beaker" size={16} color="#333" style={{ marginRight: 5 }} />
                                <TextInput
                                    value={defaultLitre}
                                    onChangeText={setDefaultLitre}
                                    keyboardType="numeric"
                                    onEndEditing={handleSave}
                                    style={styles.textInput}
                                />
                                <Text style={styles.unitText}>L</Text>
                            </View>
                            <Text style={styles.hint}>Used when marking generic 'Present'</Text>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>Calculated Breakdown</Text>
                    <View style={styles.breakdownRow}>
                        {!isMilk ? (
                            <>
                                <View style={styles.breakdownCard}>
                                    <Text style={styles.breakdownLabel}>Total Shifts</Text>
                                    <Text style={styles.breakdownValue}>{stats.maxShifts}</Text>
                                    <Text style={styles.breakdownSub}>possible</Text>
                                </View>
                                <View style={styles.breakdownCard}>
                                    <Text style={styles.breakdownLabel}>Completed</Text>
                                    <Text style={styles.breakdownValue}>{stats.totalPresentShifts}</Text>
                                    <Text style={styles.breakdownSub}>shifts</Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={[styles.breakdownCard, styles.milkCard]}>
                                    <Text style={styles.breakdownLabel}>Working Days</Text>
                                    <Text style={styles.breakdownValue}>{stats.workingDays}</Text>
                                    <Text style={styles.breakdownSub}>days (excl Sun)</Text>
                                </View>
                                <View style={[styles.breakdownCard, styles.milkCard]}>
                                    <Text style={styles.breakdownLabel}>Total Milk</Text>
                                    <Text style={styles.breakdownValue}>{stats.totalLitres}</Text>
                                    <Text style={styles.breakdownSub}>Litres</Text>
                                </View>
                            </>
                        )}
                    </View>

                    <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>Total Payable</Text>
                        <Text style={styles.totalValue}>₹{stats.totalSalary}</Text>

                        <TouchableOpacity style={styles.payButton} onPress={() => Alert.alert('Payment', 'Record Payment feature coming soon!')}>
                            <Text style={styles.payButtonText}>Record Payment</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
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
        backgroundColor: 'rgba(255,255,255,0.7)'
    },
    milkCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: '#81C784'
    },
    content: {
        padding: 20
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5
    },
    subHeader: {
        fontSize: 16,
        color: '#7E57C2',
        marginBottom: 20,
        fontWeight: '600'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
        color: '#333'
    },
    sectionTitleWithOptions: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 20,
        color: '#333'
    },
    configContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 5
    },
    shiftToggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15
    },
    shiftLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    toggleLabel: {
        fontSize: 16,
        color: '#333'
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 15
    },
    controlsRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20
    },
    rowSingle: {
        marginBottom: 20
    },
    controlGroup: {
        flex: 1
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8
    },
    inputContainer: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee'
    },
    editableInput: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    currencySymbol: {
        fontSize: 16,
        color: '#333',
        marginRight: 5
    },
    inputValue: {
        fontSize: 16,
        color: '#333'
    },
    textInput: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        fontWeight: 'bold'
    },
    unitText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5
    },
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 5
    },
    breakdownRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 30
    },
    breakdownCard: {
        flex: 1,
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fff'
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10
    },
    breakdownValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5
    },
    breakdownSub: {
        fontSize: 12,
        color: '#999'
    },
    totalCard: {
        backgroundColor: '#7E57C2',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center'
    },
    totalLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        marginBottom: 5
    },
    totalValue: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20
    },
    payButton: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center'
    },
    payButtonText: {
        color: '#7E57C2',
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default PaymentsScreen;
