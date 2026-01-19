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
    ratePerLitre: 0,
    defaultLitre: 1,
    shifts: { morning: true, evening: true },
    includeSundays: false
};

export const AppProvider = ({ children }) => {
    const [workers, setWorkers] = useState({
        cook: { ...INITIAL_WORKER_STATE, salary: 6000, includeSundays: false },
        maid: { ...INITIAL_WORKER_STATE, salary: 3000, includeSundays: false },
        milk: { ...INITIAL_WORKER_STATE, salary: 0, ratePerLitre: 60, defaultLitre: 1, includeSundays: true }
    });
    const [activeWorkerId, setActiveWorkerId] = useState('cook');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const storedWorkers = await AsyncStorage.getItem('tracker_workers_v4'); // Increment version

            if (storedWorkers) {
                setWorkers(JSON.parse(storedWorkers));
            } else {
                // Fallback or Migration
                const oldWorkers = await AsyncStorage.getItem('tracker_workers_v2');
                if (oldWorkers) {
                    const parsed = JSON.parse(oldWorkers);
                    const migrated = {};
                    Object.keys(parsed).forEach(key => {
                        migrated[key] = {
                            ...INITIAL_WORKER_STATE,
                            ...parsed[key],
                            // Preserve existing values but ensure defaults for new fields
                            ratePerLitre: parsed[key].ratePerLitre || 0,
                            defaultLitre: parsed[key].defaultLitre || 1
                        };

                        // Milk specific defaults if migrating from fresh v2
                        if (key === 'milk') {
                            if (!parsed[key].ratePerLitre) migrated[key].ratePerLitre = 60;
                            migrated[key].includeSundays = true;
                        } else {
                            migrated[key].includeSundays = parsed[key].includeSundays || false;
                        }
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
        await AsyncStorage.setItem('tracker_workers_v4', JSON.stringify(newWorkers));
    };

    const updateAttendance = (date, status) => {
        const currentWorker = workers[activeWorkerId];
        const newAttendance = { ...currentWorker.attendance, [date]: status };

        // Clean up if completely unmarked (undefined)
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

    const updateWorkerSettings = (settings) => {
        // settings object contains whatever fields we want to update (salary, shifts, ratePerLitre, etc.)
        const newWorkers = {
            ...workers,
            [activeWorkerId]: {
                ...workers[activeWorkerId],
                ...settings
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

        // Pass worker type and specific settings to calculator
        const stats = calculateSalary(
            currentMonthAttendance,
            year,
            month,
            currentWorker.shifts,
            activeWorkerId,
            {
                ratePerLitre: currentWorker.ratePerLitre,
                defaultLitre: currentWorker.defaultLitre,
                salary: currentWorker.salary,
                includeSundays: currentWorker.includeSundays
            }
        );

        return {
            ...stats,
            monthlySalary: currentWorker.salary,
            // totalSalary comes from calculator now
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
