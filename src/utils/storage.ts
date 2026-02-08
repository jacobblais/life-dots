/**
 * Storage Module
 * Handles persistence of calendars and habits using localStorage.
 */

export type CalendarType = 'main' | 'habit_good' | 'habit_bad';

export interface CalendarConfig {
    id: string;
    name: string;
    type: CalendarType;
    created: number;
}

export interface HabitEntry {
    date: string; // YYYY-MM-DD
    completed: boolean;
}

const CALENDARS_KEY = 'life-dots-calendars';
const DATA_PREFIX = 'life-dots-data-';

/**
 * Helper: Get Date Key (YYYY-MM-DD)
 */
export const getDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Helper: Check if date has passed (yesterday or earlier)
 */
export const hasDatePassed = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return target < today;
};

/**
 * Get all calendars
 */
export const getCalendars = (): CalendarConfig[] => {
    try {
        const data = localStorage.getItem(CALENDARS_KEY);
        const calendars = data ? JSON.parse(data) : [];

        // Ensure Main calendar always exists
        if (!calendars.find((c: CalendarConfig) => c.id === 'main')) {
            const mainCalendar: CalendarConfig = {
                id: 'main',
                name: 'Life Calendar',
                type: 'main',
                created: Date.now()
            };
            calendars.unshift(mainCalendar);
            saveCalendars(calendars);
        }
        return calendars;
    } catch (error) {
        console.error('Failed to load calendars:', error);
        return [];
    }
};

/**
 * Save calendars list
 */
const saveCalendars = (calendars: CalendarConfig[]) => {
    localStorage.setItem(CALENDARS_KEY, JSON.stringify(calendars));
};

/**
 * Create a new calendar
 */
export const createCalendar = (name: string, type: CalendarType): CalendarConfig => {
    const calendars = getCalendars();
    const newCalendar: CalendarConfig = {
        id: `cal-${Date.now()}`,
        name,
        type,
        created: Date.now()
    };
    calendars.push(newCalendar);
    saveCalendars(calendars);
    return newCalendar;
};

/**
 * Delete a calendar
 */
export const deleteCalendar = (calendarId: string) => {
    if (calendarId === 'main') return; // Cannot delete main
    let calendars = getCalendars();
    calendars = calendars.filter(c => c.id !== calendarId);
    saveCalendars(calendars);
    localStorage.removeItem(`${DATA_PREFIX}${calendarId}`);
};

/**
 * Get data for a specific calendar
 */
const getCalendarData = (calendarId: string): any => {
    try {
        const data = localStorage.getItem(`${DATA_PREFIX}${calendarId}`);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        return {};
    }
};

/**
 * Save data for a specific calendar
 */
const saveCalendarData = (calendarId: string, data: any) => {
    localStorage.setItem(`${DATA_PREFIX}${calendarId}`, JSON.stringify(data));
};

// --- Habit specific ---

export const toggleHabit = (calendarId: string, date: Date): boolean => {
    const data = getCalendarData(calendarId);
    const dateKey = getDateKey(date);

    if (data[dateKey]) {
        delete data[dateKey];
    } else {
        data[dateKey] = true;
    }

    saveCalendarData(calendarId, data);
    return !!data[dateKey];
};

export const getHabitStatus = (calendarId: string, date: Date): boolean => {
    const data = getCalendarData(calendarId);
    const dateKey = getDateKey(date);
    return !!data[dateKey];
};

export const getAllHabitEntries = (calendarId: string): Record<string, boolean> => {
    return getCalendarData(calendarId);
};
