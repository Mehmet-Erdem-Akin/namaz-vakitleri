'use client';

import { useEffect, useState } from 'react';
import { CurrentPrayer, DailyPrayerData, NextPrayer, PrayerTimingInfo } from '../../types';
import { calculatePrayerTimings, getNextPrayerLocal } from '../../services/prayerService';

interface PrayerTimeCardProps {
  data: DailyPrayerData;
  isToday: boolean;
  getNextPrayerFunc?: () => Promise<NextPrayer>;
}

const PrayerTimeCard = ({ data, isToday, getNextPrayerFunc }: PrayerTimeCardProps) => {
  const [prayerInfo, setPrayerInfo] = useState<PrayerTimingInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<string>('00:00:00');

  // Türkçe tarih formatı
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    }).format(date);
  };

  // Gerçek zamanlı saat güncellemesi ve namaz vakti hesaplaması
  useEffect(() => {
    if (isToday) {
      // İlk yükleme
      updatePrayerInfo();

      // Dakikalık güncelleme için zamanlayıcı
      const minuteTimer = setInterval(() => {
        setCurrentTime(new Date());
        updatePrayerInfo();
      }, 60000); // Her dakika güncelle

      return () => clearInterval(minuteTimer);
    }
  }, [isToday, data.prayerTimes]);

  // Geri sayım zamanlayıcısı
  useEffect(() => {
    if (!isToday || !prayerInfo) return;

    // Geri sayımı güncelleyen fonksiyon
    const updateCountdown = () => {
      if (!prayerInfo) return;

      const now = new Date();
      let targetTime: Date;

      // Hedef zamanı belirle
      const [endHour, endMinute] = prayerInfo.nextPrayer.time.split(':').map(Number);
      targetTime = new Date();
      targetTime.setHours(endHour, endMinute, 0, 0);

      // Eğer hedef zaman bugünden önceyse (yarın için), 24 saat ekle
      if (targetTime < now) {
        targetTime.setTime(targetTime.getTime() + 24 * 60 * 60 * 1000);
      }

      // Kalan süreyi hesapla
      const diff = targetTime.getTime() - now.getTime();
      if (diff <= 0) {
        // Süre doldu, namaz vakti bilgisini yeniden hesapla
        updatePrayerInfo();
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
    updateCountdown();

    // Her saniye geri sayımı güncelle
    const countdownTimer = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownTimer);
  }, [isToday, prayerInfo]);

  // Namaz vakti bilgilerini günceller
  const updatePrayerInfo = async () => {
    if (!isToday) return;

    setLoading(true);
    try {
      // API kullanarak sonraki namaz vaktini al
      if (getNextPrayerFunc) {
        const apiNextPrayer = await getNextPrayerFunc();

        // Tüm vakitleri hesapla (hem mevcut hem sonraki)
        const localPrayerInfo = calculatePrayerTimings(data.prayerTimes);

        // API verisiyle güncelle
        setPrayerInfo({
          currentPrayer: localPrayerInfo.currentPrayer,
          nextPrayer: apiNextPrayer,
        });
      } else {
        // Lokal hesaplama yap
        const localPrayerInfo = calculatePrayerTimings(data.prayerTimes);
        setPrayerInfo(localPrayerInfo);
      }
    } catch (error) {
      console.error('Namaz vakti hesaplanırken hata:', error);
      // Hata durumunda lokal hesaplama yap
      const localPrayerInfo = calculatePrayerTimings(data.prayerTimes);
      setPrayerInfo(localPrayerInfo);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-lg shadow-md p-4 mb-4 ${isToday ? 'bg-white border-l-4 border-blue-500' : 'bg-gray-50'}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{isToday ? 'Bugün' : formatDate(data.date)}</h3>
          <p className="text-sm text-gray-600">{data.hijriDate}</p>
        </div>

        {isToday && (
          <div className="mt-2 md:mt-0">
            <div className="text-sm text-gray-600">{currentTime.toLocaleTimeString('tr-TR')}</div>
            {loading ? (
              <div className="text-blue-600 font-medium">
                <small>Hesaplanıyor...</small>
              </div>
            ) : prayerInfo ? (
              <div>
                <div className="text-blue-600 font-medium">
                  Sonraki: {prayerInfo.nextPrayer.name} - {prayerInfo.nextPrayer.time}
                </div>
                <div className="text-center mt-1">
                  <div className="text-xs text-gray-500">Kalan Süre</div>
                  <div className="text-lg font-semibold text-green-600">{countdown}</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Mevcut Vakit: <span className="font-medium">{prayerInfo.currentPrayer.name}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <TimeBox
          label="İmsak"
          time={data.prayerTimes.fajr}
          isNext={isToday && prayerInfo?.nextPrayer.name === 'İmsak'}
          isCurrent={isToday && prayerInfo?.currentPrayer.name === 'İmsak'}
        />
        <TimeBox
          label="Güneş"
          time={data.prayerTimes.sunrise}
          isNext={isToday && prayerInfo?.nextPrayer.name === 'Güneş'}
          isCurrent={isToday && prayerInfo?.currentPrayer.name === 'Güneş'}
        />
        <TimeBox
          label="Öğle"
          time={data.prayerTimes.dhuhr}
          isNext={isToday && prayerInfo?.nextPrayer.name === 'Öğle'}
          isCurrent={isToday && prayerInfo?.currentPrayer.name === 'Öğle'}
        />
        <TimeBox
          label="İkindi"
          time={data.prayerTimes.asr}
          isNext={isToday && prayerInfo?.nextPrayer.name === 'İkindi'}
          isCurrent={isToday && prayerInfo?.currentPrayer.name === 'İkindi'}
        />
        <TimeBox
          label="Akşam"
          time={data.prayerTimes.maghrib}
          isNext={isToday && prayerInfo?.nextPrayer.name === 'Akşam'}
          isCurrent={isToday && prayerInfo?.currentPrayer.name === 'Akşam'}
        />
        <TimeBox
          label="Yatsı"
          time={data.prayerTimes.isha}
          isNext={isToday && prayerInfo?.nextPrayer.name === 'Yatsı'}
          isCurrent={isToday && prayerInfo?.currentPrayer.name === 'Yatsı'}
        />
      </div>
    </div>
  );
};

interface TimeBoxProps {
  label: string;
  time: string;
  isNext: boolean;
  isCurrent: boolean;
}

const TimeBox = ({ label, time, isNext, isCurrent }: TimeBoxProps) => {
  let className = 'p-2 rounded text-center ';

  if (isNext) {
    className += 'bg-blue-100 border border-blue-300';
  } else if (isCurrent) {
    className += 'bg-green-100 border border-green-300';
  } else {
    className += 'bg-gray-100';
  }

  return (
    <div className={className}>
      <div className="text-xs text-gray-600">{label}</div>
      <div
        className={`font-semibold ${isNext ? 'text-blue-700' : isCurrent ? 'text-green-700' : 'text-gray-800'}`}
      >
        {time}
      </div>
      {isCurrent && <div className="text-xs mt-1 text-green-600 font-medium">Mevcut</div>}
    </div>
  );
};

export default PrayerTimeCard;
