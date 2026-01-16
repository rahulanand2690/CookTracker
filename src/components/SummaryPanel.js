import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SummaryPanel = ({ stats }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Monthly Summary</Text>

            <View style={styles.row}>
                <Text style={styles.label}>Working Days (excl. Sun):</Text>
                <Text style={styles.value}>{stats.workingDays}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Morning Shifts:</Text>
                <Text style={styles.value}>{stats.morningCount}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Evening Shifts:</Text>
                <Text style={styles.value}>{stats.eveningCount}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
                <Text style={styles.totalLabel}>Total Salary to Pay:</Text>
                <Text style={styles.totalValue}>₹ {stats.totalSalary}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        margin: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 10,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#27ae60',
    },
});

export default SummaryPanel;
