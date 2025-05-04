'use client';

import { useState, useEffect } from 'react';
import { cities } from './data/cities';
import { City, PrayerTimingInfo, WeeklyPrayerData } from './types';
import { calculatePrayerTimings, getPrayerTimes, getNextPrayer } from './services/prayerService';
import TimeDisplay from './components/ui/TimeDisplay';
import CitySelector from './components/ui/CitySelector';
import NotificationControl from './components/ui/NotificationControl';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City>(cities[5]); // Varsayılan olarak Ankara
  const [prayerData, setPrayerData] = useState<WeeklyPrayerData | null>(null);
  const [prayerInfo, setPrayerInfo] = useState<PrayerTimingInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Başlangıçta URL'den şehir bilgisini al veya varsayılan kullan
  useEffect(() => {
    const cityCode = searchParams.get('city');
    if (cityCode) {
      const city = cities.find(c => c.code === cityCode);
      if (city) {
        setSelectedCity(city);
      }
    }
  }, [searchParams]);

  // Namaz vakitlerini yükle
  useEffect(() => {
    const loadPrayerTimes = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPrayerTimes(selectedCity.id);
        setPrayerData(data);

        // URL güncelleme işlemi artık select onChange'de yapılıyor
      } catch (error) {
        console.error('Namaz vakitleri yüklenirken hata oluştu:', error);
        setError('Namaz vakitleri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    loadPrayerTimes();
  }, [selectedCity, router]);

  // Namaz vakti bilgilerini hesapla ve geri sayım yap
  useEffect(() => {
    if (!prayerData) return;

    // Namaz vakti bilgilerini hesapla
    const updatePrayerInfo = () => {
      const timingInfo = calculatePrayerTimings(prayerData.days[0].prayerTimes);
      setPrayerInfo(timingInfo);

      // Sonraki namaz vaktine kadar olan süreyi hesapla
      const now = new Date();
      let targetTime: Date;

      // Hedef zamanı belirle
      const [endHour, endMinute] = timingInfo.nextPrayer.time.split(':').map(Number);
      targetTime = new Date();
      targetTime.setHours(endHour, endMinute, 0, 0);

      // Eğer hedef zaman bugünden önceyse (yarın için), 24 saat ekle
      if (targetTime < now) {
        targetTime.setTime(targetTime.getTime() + 24 * 60 * 60 * 1000);
      }

      // Kalan süreyi hesapla
      const diff = targetTime.getTime() - now.getTime();
      if (diff <= 0) {
        updatePrayerInfo(); // Süre doldu, yeniden hesapla
        return;
      }

      // Geri sayım formatını oluştur
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    // İlk güncelleme
    updatePrayerInfo();

    // Her saniye geri sayımı güncelle
    const countdownTimer = setInterval(() => {
      updatePrayerInfo();
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [prayerData]);

  // İl değişikliği işleyicisi
  const handleCityChange = (city: City) => {
    setSelectedCity(city);
    // URL'yi güncelle
    const newUrl = `/?city=${city.code}`;
    window.history.pushState({}, '', newUrl);
  };

  // Günlük vakitler kartı
  const DailyTimesCard = () => {
    if (!prayerData) return null;

    const todayData = prayerData.days[0];
    const prayerTimes = [
      { name: 'İmsak', time: todayData.prayerTimes.fajr },
      { name: 'Güneş', time: todayData.prayerTimes.sunrise },
      { name: 'Öğle', time: todayData.prayerTimes.dhuhr },
      { name: 'İkindi', time: todayData.prayerTimes.asr },
      { name: 'Akşam', time: todayData.prayerTimes.maghrib },
      { name: 'Yatsı', time: todayData.prayerTimes.isha },
    ];

    return (
      <div className="prayer-card">
        <div className="mb-3 text-center text-sm text-gray-500 dark:text-gray-400">
          {todayData.date} / {todayData.hijriDate}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {prayerTimes.map(prayer => {
            const isNext = prayerInfo?.nextPrayer.name === prayer.name;
            const isCurrent = prayerInfo?.currentPrayer.name === prayer.name;
            let boxClass = 'prayer-time-box ';
            boxClass += isNext ? 'next' : isCurrent ? 'current' : 'regular';

            return (
              <div key={prayer.name} className={boxClass}>
                <div className="text-xs text-gray-600 dark:text-gray-400">{prayer.name}</div>
                <div className="text-lg font-semibold">{prayer.time}</div>
                {isCurrent && (
                  <div className="text-xs text-green-600 font-medium">Şu anki vakit</div>
                )}
                {isNext && <div className="text-xs text-blue-600 font-medium">Sonraki vakit</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="card-container">
        {/* Şehir seçici */}
        <CitySelector selectedCity={selectedCity} onCityChange={handleCityChange} />

        {loading ? (
          <div className="flex justify-center items-center my-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">
            <p>{error}</p>
            <button
              onClick={() =>
                getPrayerTimes(selectedCity.id)
                  .then(setPrayerData)
                  .catch(e => setError(e.message))
              }
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Tekrar Dene
            </button>
          </div>
        ) : prayerData && prayerInfo ? (
          <>
            {/* Dinamik gökyüzü ve geri sayım */}
            <TimeDisplay
              currentPrayer={prayerInfo.currentPrayer}
              nextPrayer={prayerInfo.nextPrayer}
              countdown={countdown}
              isLoading={loading}
            />

            {/* Bildirim Kontrol Bileşeni */}
            <NotificationControl
              prayerTimes={prayerData?.days[0]?.prayerTimes}
              cityName={selectedCity.name}
            />

            {/* Günlük vakitler kartı */}
            <DailyTimesCard />

            {/* Footer bilgisi */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              <p className="mb-1">
                <span className="font-medium">{selectedCity.name}</span> ili için namaz vakitleri
              </p>
              <p className="text-xs">
                © {new Date().getFullYear()} Namaz Vakitleri •
                <a
                  href="https://collectapi.com/"
                  className="text-blue-500 ml-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CollectAPI
                </a>
              </p>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
