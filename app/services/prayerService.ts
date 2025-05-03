import { City, DailyPrayerData, NextPrayer, PrayerTime, WeeklyPrayerData } from "../types";
import { cities } from "../data/cities";

// API'nin çalışması için örnek veri oluşturuyoruz (gerçek projede bu API'den gelecek)
const generateMockPrayerTime = (cityId: number, dayOffset: number = 0): PrayerTime => {
    // Şehir ID'sine göre sabit bir base değer oluştur
    const baseMinute = (cityId * 7) % 30;

    // Gün farkına göre değerleri güncelle
    const dayShift = dayOffset * 2;

    return {
        fajr: `0${4 + (baseMinute % 2)}:${(15 + baseMinute + dayShift) % 60}`.padStart(5, '0'),
        sunrise: `0${6 + (baseMinute % 3)}:${(30 + baseMinute + dayShift) % 60}`.padStart(5, '0'),
        dhuhr: `${12 + (baseMinute % 2)}:${(15 + baseMinute + dayShift) % 60}`.padStart(5, '0'),
        asr: `${15 + (baseMinute % 2)}:${(45 + baseMinute + dayShift) % 60}`.padStart(5, '0'),
        maghrib: `${18 + (baseMinute % 3)}:${(10 + baseMinute + dayShift) % 60}`.padStart(5, '0'),
        isha: `${20 + (baseMinute % 2)}:${(30 + baseMinute + dayShift) % 60}`.padStart(5, '0'),
    };
};

const formatDate = (dateOffset: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + dateOffset);
    return date.toISOString().split('T')[0];
};

const formatHijriDate = (dateOffset: number = 0): string => {
    // Örnek için basit bir hesaplama
    const date = new Date();
    date.setDate(date.getDate() + dateOffset);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = 1445; // 2023/2024 Hicri yılı (basit örnek)

    const hijriMonths = [
        "Muharrem", "Safer", "Rebiülevvel", "Rebiülahir",
        "Cemaziyelevvel", "Cemaziyelahir", "Recep", "Şaban",
        "Ramazan", "Şevval", "Zilkade", "Zilhicce"
    ];

    return `${day} ${hijriMonths[month % 12]} ${year}`;
};

// Namaz vakitlerini getiren API
export const getPrayerTimes = async (cityId: number): Promise<WeeklyPrayerData> => {
    // Gerçek projede burada bir API çağrısı yapılacak
    // Şimdilik örnek veri döndürüyoruz
    const city = cities.find(c => c.id === cityId) || cities[0];

    const days: DailyPrayerData[] = [];

    // 7 günlük veri oluştur
    for (let i = 0; i < 7; i++) {
        days.push({
            date: formatDate(i),
            hijriDate: formatHijriDate(i),
            prayerTimes: generateMockPrayerTime(cityId, i)
        });
    }

    return {
        city,
        days
    };
};

// Bir sonraki namaz vaktini hesaplayan fonksiyon
export const getNextPrayer = (prayerTimes: PrayerTime): NextPrayer => {
    const prayers = [
        { name: "İmsak", time: prayerTimes.fajr },
        { name: "Güneş", time: prayerTimes.sunrise },
        { name: "Öğle", time: prayerTimes.dhuhr },
        { name: "İkindi", time: prayerTimes.asr },
        { name: "Akşam", time: prayerTimes.maghrib },
        { name: "Yatsı", time: prayerTimes.isha }
    ];

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeAsMinutes = currentHour * 60 + currentMinute;

    // Günün vakitlerini kontrol et
    for (const prayer of prayers) {
        const [hour, minute] = prayer.time.split(':').map(Number);
        const prayerTimeAsMinutes = hour * 60 + minute;

        if (prayerTimeAsMinutes > currentTimeAsMinutes) {
            // Kalan zamanı hesapla
            const remainingMinutes = prayerTimeAsMinutes - currentTimeAsMinutes;
            const remainingHours = Math.floor(remainingMinutes / 60);
            const remainingMins = remainingMinutes % 60;

            return {
                name: prayer.name,
                time: prayer.time,
                remainingTime: `${remainingHours} saat ${remainingMins} dakika`
            };
        }
    }

    // Eğer tüm vakitler geçtiyse bir sonraki günün imsak vaktini hesapla
    const [hour, minute] = prayers[0].time.split(':').map(Number);
    const tomorrowFajrAsMinutes = hour * 60 + minute + 24 * 60;
    const remainingMinutes = tomorrowFajrAsMinutes - currentTimeAsMinutes;
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;

    return {
        name: "İmsak (yarın)",
        time: prayers[0].time,
        remainingTime: `${remainingHours} saat ${remainingMins} dakika`
    };
}; 