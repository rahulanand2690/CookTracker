import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateSalary } from '../utils/salaryCalculator';

export const AppContext = createContext();

const WORKER_TYPES = {
    cook: { name: 'Cook', icon: 'chef-hat' },
    maid: { name: 'Maid', icon: 'broom' },
    milk: { name: 'Milk', icon: 'cup' }
};

const INITIAL_WORKER_STATE = {
    attendance: {},
    salary: 0,
    shifts: { morning: true, evening: true } // Default to both enabled
};

export const AppProvider = ({ children }) => {
    const [workers, setWorkers] = useState({
        cook: { ...INITIAL_WORKER_STATE, salary: 6000 },
        maid: { ...INITIAL_WORKER_STATE, salary: 3000 },
        milk: { ...INITIAL_WORKER_STATE, salary: 1500 }
    });
    const [activeWorkerId, setActiveWorkerId] = useState('cook');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const storedWorkers = await AsyncStorage.getItem('tracker_workers_v2'); // Increment version to force fresh or migrated read

            if (storedWorkers) {
                setWorkers(JSON.parse(storedWorkers));
            } else {
                // Fallback or Migration
                const oldWorkers = await AsyncStorage.getItem('tracker_workers');
                if (oldWorkers) {
                    const parsed = JSON.parse(oldWorkers);
                    // Migrate old data to include defaults for shifts if missing
                    const migrated = {};
                    Object.keys(parsed).forEach(key => {
                        migrated[key] = {
                            ...INITIAL_WORKER_STATE,
                            ...parsed[key],
                            shifts: parsed[key].shifts || { morning: true, evening: true }
                        };
                    });
                    setWorkers(migrated);
                }
            }
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setIsLoading(false);
        }
    };

    const saveWorkers = async (newWorkers) => {
        setWorkers(newWorkers);
        await AsyncStorage.setItem('tracker_workers_v2', JSON.stringify(newWorkers));
    };

    const updateAttendance = (date, status) => {
        const currentWorker = workers[activeWorkerId];
        const newAttendance = { ...currentWorker.attendance, [date]: status };

        if (status.morning === undefined && status.evening === undefined) {
            delete newAttendance[date];
        }

        const newWorkers = {
            ...workers,
            [activeWorkerId]: {
                ...currentWorker,
                attendance: newAttendance
            }
        };
        saveWorkers(newWorkers);
    };

    const updateWorkerSettings = (salary, shifts) => {
        const numSalary = parseInt(salary) || 0;
        const newWorkers = {
            ...workers,
            [activeWorkerId]: {
                ...workers[activeWorkerId],
                salary: numSalary,
                shifts: shifts
            }
        };
        saveWorkers(newWorkers);
    };

    const getStatsForMonth = (year, month) => {
        const currentWorker = workers[activeWorkerId];

        // Filter attendance for specific month
        const currentMonthAttendance = Object.keys(currentWorker.attendance)
            .filter(date => {
                const [y, m] = date.split('-');
                return parseInt(y) === year && parseInt(m) === month;
            })
            .reduce((obj, key) => {
                obj[key] = currentWorker.attendance[key];
                return obj;
            }, {});

        const stats = calculateSalary(currentMonthAttendance, year, month, currentWorker.shifts);

        // Calculate Daily Rate based on Enabled Shifts
        // If 1 shift/day: maxPossibleShifts = workingDays
        // If 2 shifts/day: maxPossibleShifts = workingDays * 2

        let shiftsPerDay = 0;
        if (currentWorker.shifts.morning) shiftsPerDay++;
        if (currentWorker.shifts.evening) shiftsPerDay++;

        // Avoid division by zero
        if (shiftsPerDay === 0) shiftsPerDay = 1;

        const maxShifts = stats.workingDays * shiftsPerDay;
        const payPerShift = maxShifts > 0 ? currentWorker.salary / maxShifts : 0;

        const totalPayable = stats.totalPresentShifts * payPerShift;

        return {
            ...stats,
            monthlySalary: currentWorker.salary,
            totalSalary: Math.round(totalPayable) || 0,
            maxShifts
        };
    };

    return (
        <AppContext.Provider value={{
            workers,
            activeWorkerId,
            activeWorker: workers[activeWorkerId],
            workerMeta: WORKER_TYPES[activeWorkerId],
            WORKER_TYPES,
            setActiveWorkerId,
            updateAttendance,
            updateWorkerSettings,
            getStatsForMonth,
            isLoading
        }}>
            {children}
        </AppContext.Provider>
    );
};
