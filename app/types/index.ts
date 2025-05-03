export interface City {
    id: number;
    name: string;
    code: string;
}

export interface PrayerTime {
    fajr: string;     // İmsak
    sunrise: string;  // Güneş
    dhuhr: string;    // Öğle
    asr: string;      // İkindi
    maghrib: string;  // Akşam
    isha: string;     // Yatsı
}

export interface DailyPrayerData {
    date: string;
    hijriDate: string;
    prayerTimes: PrayerTime;
}

export interface WeeklyPrayerData {
    city: City;
    days: DailyPrayerData[];
}

export interface NextPrayer {
    name: string;
    time: string;
    remainingTime: string;
} 