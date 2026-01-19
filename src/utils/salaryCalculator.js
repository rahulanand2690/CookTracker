export const calculateSalary = (attendance, year, month, shiftsConfig, workerType, settings) => {
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
    let totalLitres = 0;

    Object.values(attendance).forEach((status) => {
        // COOK/MAID LOGIC (Simple Present/Absent)
        if (workerType !== 'milk') {
            if (shiftsConfig.morning && status.morning === true) morningCount++;
            if (shiftsConfig.evening && status.evening === true) eveningCount++;
        }
        // MILK LOGIC (Quantity based)
        else {
            if (shiftsConfig.morning) {
                if (typeof status.morning === 'number') totalLitres += status.morning;
                else if (status.morning === true) totalLitres += settings.defaultLitre;
            }
            if (shiftsConfig.evening) {
                if (typeof status.evening === 'number') totalLitres += status.evening;
                else if (status.evening === true) totalLitres += settings.defaultLitre;
            }
        }
    });

    const totalPresentShifts = morningCount + eveningCount;

    // Output Calculation
    let totalSalary = 0;
    let maxShifts = 0;

    if (workerType === 'milk') {
        totalSalary = Math.round(totalLitres * settings.ratePerLitre);
    } else {
        // Cook/Maid Logic
        let shiftsPerDay = 0;
        if (shiftsConfig.morning) shiftsPerDay++;
        if (shiftsConfig.evening) shiftsPerDay++;
        if (shiftsPerDay === 0) shiftsPerDay = 1;

        maxShifts = workingDays * shiftsPerDay;
        const payPerShift = maxShifts > 0 ? settings.salary / maxShifts : 0;
        totalSalary = Math.round(totalPresentShifts * payPerShift);
    }

    return {
        workingDays,
        totalPresentShifts,
        morningCount, // Unused for milk mostly
        eveningCount,
        totalLitres,  // Specific to milk
        totalSalary,
        maxShifts
    };
};
