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
    payments: [],
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

    const addPayment = (amount, date) => {
        const currentWorker = workers[activeWorkerId];
        const newPayments = [
            ...(currentWorker.payments || []),
            { amount, date, timestamp: Date.now() }
        ];

        const newWorkers = {
            ...workers,
            [activeWorkerId]: {
                ...currentWorker,
                payments: newPayments
            }
        };
        saveWorkers(newWorkers);
    };

    const getStatsForMonth = (year, month) => {
        const currentWorker = workers[activeWorkerId];

        // 1. Calculate Previous Balance (Up to start of this month)
        // Previous Balance = (Total Lifetime Salary) - (Total Lifetime Payments) [Before this month]

        let lifetimeSalary = 0;
        let lifetimePayments = 0;

        // Iterate through all attendance to calculate lifetime salary
        // This acts as a ledger replay. Optimization: Snapshot could be stored, but for now replay is fine.
        const allDates = Object.keys(currentWorker.attendance);
        const sortedDates = allDates.sort(); // String sort works for YYYY-MM-DD

        // We need to sum up salary for all months BEFORE data of 'year-month'
        // Actually, easier: Calculate ALL previous months' stats.

        // Simpler approach for "Previous Balance":
        // It's effectively: (Sum of all past months' Net Payables) - (Sum of all past months' Payments) ??
        // No, simplest: 
        // Total Value Generated (Lifetime) - Total Paid (Lifetime) = Current Balance.
        // To get "Previous Balance" (Balance at start of month), we calculate (Value - Paid) up to < YYYY-MM-01.

        const targetMonthStart = new Date(year, month - 1, 1); // Month is 1-indexed in arg, but Date is 0-indexed

        // Filter attendance before this month
        const pastAttendance = {};
        const currentMonthAttendance = {};

        Object.keys(currentWorker.attendance).forEach(date => {
            const [dY, dM, dD] = date.split('-').map(Number);
            const dDate = new Date(dY, dM - 1, dD);

            if (dDate < targetMonthStart) {
                pastAttendance[date] = currentWorker.attendance[date];
            } else if (dY === year && dM === month) {
                currentMonthAttendance[date] = currentWorker.attendance[date];
            }
        });

        // Calculate Salary for current month
        const currentMonthStats = calculateSalary(
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

        // To calculate accurate "Previous Balance", we technically need to calculate salary for EVERY past month.
        // Because salary is monthly based, not just daily rate (for Cook/Maid).
        // For Milk it is purely daily/volume based so simpler.
        // For fixed salary, we need to know how many previous months passed since... when? 
        // Assumption: If there is attendance in a month, salary applies? Or assume salary applies every month?
        // Let's stick to: Salary applies if there is ANY attendance or if it's explicitly generated?
        // For simplicity in this version: Previous Balance is derived from "Past Unpaid Due".

        // REVISED APPROACH for "Previous Balance":
        // Iterate all months present in attendance/payments up to current month.

        const allMonths = new Set();
        Object.keys(currentWorker.attendance).forEach(d => allMonths.add(d.substring(0, 7))); // YYYY-MM
        (currentWorker.payments || []).forEach(p => allMonths.add(p.date.substring(0, 7)));

        const sortedMonths = Array.from(allMonths).sort();

        let totalPastSalary = 0;
        let totalPastPayments = 0;

        sortedMonths.forEach(mStr => {
            const [mY, mM] = mStr.split('-').map(Number);
            // If month is BEFORE target month
            if (mY < year || (mY === year && mM < month)) {

                // Get attendance for this past month
                const mAttendance = Object.keys(currentWorker.attendance)
                    .filter(d => d.startsWith(mStr))
                    .reduce((obj, k) => { obj[k] = currentWorker.attendance[k]; return obj; }, {});

                const mStats = calculateSalary(
                    mAttendance,
                    mY,
                    mM,
                    currentWorker.shifts,
                    activeWorkerId,
                    {
                        ratePerLitre: currentWorker.ratePerLitre,
                        defaultLitre: currentWorker.defaultLitre,
                        salary: currentWorker.salary,
                        includeSundays: currentWorker.includeSundays
                    }
                );
                totalPastSalary += mStats.totalSalary;
            }
        });

        // Sum past payments
        (currentWorker.payments || []).forEach(p => {
            const [pY, pM] = p.date.split('-').map(Number);
            if (pY < year || (pY === year && pM < month)) {
                totalPastPayments += p.amount;
            }
        });

        const previousBalance = totalPastSalary - totalPastPayments;

        // Current Month Payments
        const currentPayments = (currentWorker.payments || [])
            .filter(p => {
                const [pY, pM] = p.date.split('-').map(Number);
                return pY === year && pM === month;
            })
            .reduce((sum, p) => sum + p.amount, 0);

        const netPayable = currentMonthStats.totalSalary + previousBalance - currentPayments;

        return {
            ...currentMonthStats,
            monthlySalary: currentWorker.salary,
            previousBalance,
            currentMonthPayments: currentPayments,
            netPayable
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
            updateWorkerSettings,
            addPayment,
            getStatsForMonth,
            isLoading
        }}>
            {children}
        </AppContext.Provider>
    );
};
