import {
  City,
  CurrentPrayer,
  DailyPrayerData,
  NextPrayer,
  PrayerTime,
  PrayerTimingInfo,
  WeeklyPrayerData,
} from '../types';
import { cities } from '../data/cities';
import { fetchAllPrayerTimes, fetchNextPrayer } from './apiService';

// Türkçe tarih formatı
const formatDateLocalized = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Hicri tarih formatı - basitleştirilmiş örnek
const formatHijriDate = (dateOffset: number = 0): string => {
  // Gerçek hicri tarih hesaplamasını buraya ekleyebilirsiniz
  // Şimdilik örnek bir veri döndürüyoruz
  const date = new Date();
  date.setDate(date.getDate() + dateOffset);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = 1445; // 2023/2024 Hicri yılı (basit örnek)

  const hijriMonths = [
    'Muharrem',
    'Safer',
    'Rebiülevvel',
    'Rebiülahir',
    'Cemaziyelevvel',
    'Cemaziyelahir',
    'Recep',
    'Şaban',
    'Ramazan',
    'Şevval',
    'Zilkade',
    'Zilhicce',
  ];

  return `${day} ${hijriMonths[month % 12]} ${year}`;
};

/**
 * Namaz vakitlerini getiren ana fonksiyon
 * Bu fonksiyon artık gerçek API'ye bağlanıyor, API çalışmazsa mock veri kullanabilir
 */
export const getPrayerTimes = async (cityId: number): Promise<WeeklyPrayerData> => {
  const city = cities.find(c => c.id === cityId) || cities[0];
  const days: DailyPrayerData[] = [];

  try {
    // API'den bugünün verilerini al
    const todaysPrayerTimes = await fetchAllPrayerTimes(city.name);

    // Bugünü ekle
    days.push({
      date: new Date().toISOString().split('T')[0],
      hijriDate: formatHijriDate(0),
      prayerTimes: todaysPrayerTimes,
    });

    // Diğer günler için şimdilik mock veri kullanıyoruz
    // Gerçek bir API entegrasyonunda, sonraki günler için de API çağrısı yapılabilir
    for (let i = 1; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Mock veri oluştur - gelecekte bu kısım da API'den alınabilir
      const prayerTime: PrayerTime = {
        fajr: adjustTimeByMinutes(todaysPrayerTimes.fajr, -1 + i),
        sunrise: adjustTimeByMinutes(todaysPrayerTimes.sunrise, -1 + i),
        dhuhr: adjustTimeByMinutes(todaysPrayerTimes.dhuhr, 0 + i),
        asr: adjustTimeByMinutes(todaysPrayerTimes.asr, 1 + i),
        maghrib: adjustTimeByMinutes(todaysPrayerTimes.maghrib, 2 + i),
        isha: adjustTimeByMinutes(todaysPrayerTimes.isha, 1 + i),
      };

      days.push({
        date: date.toISOString().split('T')[0],
        hijriDate: formatHijriDate(i),
        prayerTimes: prayerTime,
      });
    }

    return { city, days };
  } catch (error) {
    console.error('API servis hatası, mock veri kullanılıyor:', error);
    // API başarısız olursa, mock veri kullan
    return generateMockWeeklyData(cityId);
  }
};

/**
 * API başarısız olursa kullanılacak mock veri
 */
const generateMockWeeklyData = (cityId: number): WeeklyPrayerData => {
  const city = cities.find(c => c.id === cityId) || cities[0];
  const days: DailyPrayerData[] = [];

  // 7 günlük veri oluştur
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    days.push({
      date: date.toISOString().split('T')[0],
      hijriDate: formatHijriDate(i),
      prayerTimes: generateMockPrayerTime(cityId, i),
    });
  }

  return { city, days };
};

/**
 * Mock namaz vakti oluştur
 */
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

/**
 * Zaman bilgisini dakika cinsinden ayarla
 */
const adjustTimeByMinutes = (timeStr: string, minuteChange: number): string => {
  if (!timeStr) return '';

  const [hours, minutes] = timeStr.split(':').map(Number);

  // Yeni zamanı hesapla
  let totalMinutes = hours * 60 + minutes + minuteChange;

  // Saat ve dakikayı tekrar oluştur
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;

  // Formatlı saat döndür
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
};

/**
 * Bir sonraki namaz vaktini hesapla
 * Bu fonksiyon API'den veri alamazsa local hesaplama yapar
 */
export const getNextPrayer = async (
  prayerTimes: PrayerTime,
  cityName: string = 'istanbul'
): Promise<NextPrayer> => {
  try {
    // API'den bir sonraki namaz vaktini almayı dene
    const vakit = calculatePrayerTimings(prayerTimes).nextPrayer.name;

    // API'den veriyi al
    const nextPrayer = await fetchNextPrayer(cityName, vakit);
    return nextPrayer;
  } catch (error) {
    console.error("API'den veri alınamadı, lokal hesaplama kullanılıyor:", error);
    // API başarısız olursa, lokal hesaplamayı kullan
    return calculatePrayerTimings(prayerTimes).nextPrayer;
  }
};

/**
 * Zamanlama bilgilerini işle (mevcut ve sonraki namaz vakitleri)
 */
export const calculatePrayerTimings = (prayerTimes: PrayerTime): PrayerTimingInfo => {
  const prayers = [
    { name: 'İmsak', time: prayerTimes.fajr },
    { name: 'Güneş', time: prayerTimes.sunrise },
    { name: 'Öğle', time: prayerTimes.dhuhr },
    { name: 'İkindi', time: prayerTimes.asr },
    { name: 'Akşam', time: prayerTimes.maghrib },
    { name: 'Yatsı', time: prayerTimes.isha },
  ];

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeAsMinutes = currentHour * 60 + currentMinute;

  // Şimdi vakitleri dakika cinsinden diziye çevirelim
  const prayerTimesInMinutes = prayers.map(prayer => {
    const [hour, minute] = prayer.time.split(':').map(Number);
    return {
      name: prayer.name,
      time: prayer.time,
      timeInMinutes: hour * 60 + minute,
    };
  });

  // Sıradaki vakit
  let nextPrayerIndex = prayerTimesInMinutes.findIndex(p => p.timeInMinutes > currentTimeAsMinutes);

  // Eğer bugün için bir sonraki vakit yoksa, ilk vakti al (yarın sabah)
  if (nextPrayerIndex === -1) {
    nextPrayerIndex = 0;
    // Yarın için hesaplama
    const tomorrowFajrMinutes = prayerTimesInMinutes[0].timeInMinutes + 24 * 60;

    const remainingMinutes = tomorrowFajrMinutes - currentTimeAsMinutes;
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;

    const nextPrayer: NextPrayer = {
      name: `${prayers[0].name} (yarın)`,
      time: prayers[0].time,
      remainingTime: `${remainingHours} saat ${remainingMins} dakika`,
    };

    // Şu an aktif bir vakit yok, günün son vakti Yatsı'dan sonra
    const currentPrayer: CurrentPrayer = {
      name: 'Yatsı',
      startTime: prayers[5].time,
      endTime: prayers[0].time,
      remainingTime: '00:00:00',
      isActive: false,
    };

    return { currentPrayer, nextPrayer };
  }

  // Bir sonraki namaz vakti
  const nextPrayerTime = prayerTimesInMinutes[nextPrayerIndex];
  const remainingMinutes = nextPrayerTime.timeInMinutes - currentTimeAsMinutes;
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMins = remainingMinutes % 60;

  const nextPrayer: NextPrayer = {
    name: nextPrayerTime.name,
    time: nextPrayerTime.time,
    remainingTime: `${remainingHours} saat ${remainingMins} dakika`,
  };

  // Şu anki namaz vakti (önceki vakit)
  const currentPrayerIndex = nextPrayerIndex > 0 ? nextPrayerIndex - 1 : 5;
  const currentPrayerTime = prayerTimesInMinutes[currentPrayerIndex];
  const endTime = nextPrayerTime.time;

  // Şu anki vakit için kalan süre
  const currentRemainingMinutes = nextPrayerTime.timeInMinutes - currentTimeAsMinutes;
  const currentRemainingHours = Math.floor(currentRemainingMinutes / 60);
  const currentRemainingMins = currentRemainingMinutes % 60;
  const currentRemainingSecs = 0; // Varsayılan değer, gerçek projelerde daha hassas hesaplanabilir

  const formattedRemainingTime = `${currentRemainingHours.toString().padStart(2, '0')}:${currentRemainingMins.toString().padStart(2, '0')}:${currentRemainingSecs.toString().padStart(2, '0')}`;

  const currentPrayer: CurrentPrayer = {
    name: currentPrayerTime.name,
    startTime: currentPrayerTime.time,
    endTime: endTime,
    remainingTime: formattedRemainingTime,
    isActive: true,
  };

  return { currentPrayer, nextPrayer };
};

/**
 * Bir sonraki namaz vaktini lokal olarak hesapla
 */
export const getNextPrayerLocal = (prayerTimes: PrayerTime): NextPrayer => {
  return calculatePrayerTimings(prayerTimes).nextPrayer;
};
