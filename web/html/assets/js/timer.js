// timer.js
// JFK Assassination Elapsed Time Display
// Calculates time elapsed since November 22, 1963 @ 12:30 PM CST
// Primary Sources Project - 2026-02-25

function updateTimer() {
    // JFK assassination: November 22, 1963 @ 12:30 PM CST (UTC-6)
    const incidentDate = new Date('1963-11-22T12:30:00-06:00');
    const now = new Date();
    const elapsed = now - incidentDate;

    // Calculate years, months, days
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25; // Account for leap years
    const msPerMonth = 1000 * 60 * 60 * 24 * 30.44; // Average days per month
    const msPerDay = 1000 * 60 * 60 * 24;

    const years = Math.floor(elapsed / msPerYear);
    const remainingAfterYears = elapsed % msPerYear;
    const months = Math.floor(remainingAfterYears / msPerMonth);
    const remainingAfterMonths = remainingAfterYears % msPerMonth;
    const days = Math.floor(remainingAfterMonths / msPerDay);

    // Update DOM elements
    const yearsEl = document.getElementById('timer-years');
    const monthsEl = document.getElementById('timer-months');
    const daysEl = document.getElementById('timer-days');

    if (yearsEl) yearsEl.textContent = years;
    if (monthsEl) monthsEl.textContent = months;
    if (daysEl) daysEl.textContent = days;
}

// Initialize timer on page load
document.addEventListener('DOMContentLoaded', updateTimer);
