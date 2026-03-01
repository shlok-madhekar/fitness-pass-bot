export interface UserData {
    firstName: string;
    lastName: string;
    dateOfBirth: string; // YYYY-MM-DD
}

export interface PassData {
    code: string;
    generatedAt: number; // Unix timestamp
}

const USER_DATA_KEY = 'fitness_bot_user';
const PASS_DATA_KEY = 'fitness_bot_pass';

export function saveUserData(data: UserData) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
    }
}

export function getUserData(): UserData | null {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(USER_DATA_KEY);
        return data ? JSON.parse(data) : null;
    }
    return null;
}

export function savePassData(data: PassData) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(PASS_DATA_KEY, JSON.stringify(data));
    }
}

export function getPassData(): PassData | null {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(PASS_DATA_KEY);
        return data ? JSON.parse(data) : null;
    }
    return null;
}

export function isPassValid(pass: PassData | null): boolean {
    if (!pass) return false;
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    return Date.now() - pass.generatedAt < THREE_DAYS_MS;
}
