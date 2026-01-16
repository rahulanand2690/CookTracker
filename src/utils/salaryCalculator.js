export const calculateSalary = (attendance, year, month, shiftsConfig) => {
    // Get days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    let sundays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        if (date.getDay() === 0) { // 0 is Sunday
            sundays++;
        }
    }

    const workingDays = daysInMonth - sundays;

    let morningCount = 0;
    let eveningCount = 0;

    Object.values(attendance).forEach((status) => {
        // Only count if shift is enabled AND marked true
        if (shiftsConfig.morning && status.morning === true) morningCount++;
        if (shiftsConfig.evening && status.evening === true) eveningCount++;
    });

    const totalPresentShifts = morningCount + eveningCount;

    return {
        workingDays,
        totalPresentShifts,
        morningCount,
        eveningCount
    };
};
