import { City, DailyPrayerData, NextPrayer, PrayerTime, WeeklyPrayerData } from "../types";
import { API_CONFIG } from "../config/apiConfig";

// API_KEY güvenli config dosyasından alınıyor
const API_KEY = API_CONFIG.COLLECT_API_KEY;

/**
 * Türkçe karakterleri İngilizce eşdeğerleriyle değiştirir
 */
const replaceTurkishChars = (str: string): string => {
    return str
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ç/g, 'c')
        .replace(/ö/g, 'o')
        .replace(/İ/g, 'I')
        .replace(/Ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/Ş/g, 'S')
        .replace(/Ç/g, 'C')
        .replace(/Ö/g, 'O');
};

/**
 * Şehir adını API için hazırlar - Türkçe karakterleri İngilizceye dönüştürür
 */
const normalizeCity = (cityName: string): string => {
    // Türkçe küçük harflere çevir (toLowerCase Türkçe karakterlerde sorun çıkarabilir)
    const turkishToLower = (str: string): string => {
        return str
            .replace(/İ/g, 'i')
            .replace(/I/g, 'ı')
            .replace(/Ğ/g, 'ğ')
            .replace(/Ü/g, 'ü')
            .replace(/Ş/g, 'ş')
            .replace(/Ö/g, 'ö')
            .replace(/Ç/g, 'ç')
            .toLowerCase();
    };

    // Önce Türkçe küçük harfe çevir, sonra İngilizce karakterlere dönüştür
    const lowerCity = turkishToLower(cityName);
    const englishChars = replaceTurkishChars(lowerCity);

    // URL için encode et
    return encodeURIComponent(englishChars);
};

/**
 * collectapi.com API'sini kullanarak tüm namaz vakitlerini getirir
 */
export const fetchAllPrayerTimes = async (city: string): Promise<PrayerTime> => {
    try {
        const normalizedCity = normalizeCity(city);
        const response = await fetch(`https://api.collectapi.com/pray/all?data.city=${normalizedCity}`, {
            method: 'GET',
            headers: {
                'Authorization': `apikey ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error('API response was not successful');
        }

        // API'den gelen veriyi dönüştür
        const prayerTimes: PrayerTime = {
            fajr: data.result.find((item: any) => item.vakit === "İmsak")?.saat || "",
            sunrise: data.result.find((item: any) => item.vakit === "Güneş")?.saat || "",
            dhuhr: data.result.find((item: any) => item.vakit === "Öğle")?.saat || "",
            asr: data.result.find((item: any) => item.vakit === "İkindi")?.saat || "",
            maghrib: data.result.find((item: any) => item.vakit === "Akşam")?.saat || "",
            isha: data.result.find((item: any) => item.vakit === "Yatsı")?.saat || "",
        };

        return prayerTimes;
    } catch (error) {
        console.error("API'den namaz vakitleri alınamadı:", error);
        throw error;
    }
};

/**
 * collectapi.com API'sini kullanarak bir sonraki namaz vaktini getirir
 */
export const fetchNextPrayer = async (city: string, prayerName: string): Promise<NextPrayer> => {
    try {
        const normalizedCity = normalizeCity(city);
        const response = await fetch(`https://api.collectapi.com/pray/single?ezan=${prayerName}&data.city=${normalizedCity}`, {
            method: 'GET',
            headers: {
                'Authorization': `apikey ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error('API response was not successful');
        }

        // API'den gelen veriyi dönüştür
        const nextPrayer: NextPrayer = {
            name: prayerName,
            time: data.result[0].time || "",
            remainingTime: `${data.result[0].hour} saat ${data.result[0].min} dakika`
        };

        return nextPrayer;
    } catch (error) {
        console.error("API'den sonraki namaz vakti alınamadı:", error);
        throw error;
    }
}; 