"use client";

import { useEffect, useState } from "react";
import { DailyPrayerData, NextPrayer } from "../../types";
import { getNextPrayer } from "../../services/prayerService";

interface PrayerTimeCardProps {
    data: DailyPrayerData;
    isToday: boolean;
}

const PrayerTimeCard = ({ data, isToday }: PrayerTimeCardProps) => {
    const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Türkçe tarih formatı
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
        }).format(date);
    };

    // Gerçek zamanlı saat güncellemesi
    useEffect(() => {
        if (isToday) {
            const timer = setInterval(() => {
                setCurrentTime(new Date());
                setNextPrayer(getNextPrayer(data.prayerTimes));
            }, 60000); // Her dakika güncelle

            // İlk yükleme
            setNextPrayer(getNextPrayer(data.prayerTimes));

            return () => clearInterval(timer);
        }
    }, [isToday, data.prayerTimes]);

    return (
        <div className={`rounded-lg shadow-md p-4 mb-4 ${isToday ? "bg-white border-l-4 border-blue-500" : "bg-gray-50"}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold">
                        {isToday ? "Bugün" : formatDate(data.date)}
                    </h3>
                    <p className="text-sm text-gray-600">{data.hijriDate}</p>
                </div>

                {isToday && (
                    <div className="mt-2 md:mt-0">
                        <div className="text-sm text-gray-600">
                            {currentTime.toLocaleTimeString('tr-TR')}
                        </div>
                        {nextPrayer && (
                            <div className="text-blue-600 font-medium">
                                Sonraki: {nextPrayer.name} - {nextPrayer.time}
                                <div className="text-xs">({nextPrayer.remainingTime})</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                <TimeBox label="İmsak" time={data.prayerTimes.fajr} isNext={isToday && nextPrayer?.name === "İmsak"} />
                <TimeBox label="Güneş" time={data.prayerTimes.sunrise} isNext={isToday && nextPrayer?.name === "Güneş"} />
                <TimeBox label="Öğle" time={data.prayerTimes.dhuhr} isNext={isToday && nextPrayer?.name === "Öğle"} />
                <TimeBox label="İkindi" time={data.prayerTimes.asr} isNext={isToday && nextPrayer?.name === "İkindi"} />
                <TimeBox label="Akşam" time={data.prayerTimes.maghrib} isNext={isToday && nextPrayer?.name === "Akşam"} />
                <TimeBox label="Yatsı" time={data.prayerTimes.isha} isNext={isToday && nextPrayer?.name === "Yatsı"} />
            </div>
        </div>
    );
};

interface TimeBoxProps {
    label: string;
    time: string;
    isNext: boolean;
}

const TimeBox = ({ label, time, isNext }: TimeBoxProps) => (
    <div className={`p-2 rounded text-center ${isNext ? "bg-blue-100 border border-blue-300" : "bg-gray-100"}`}>
        <div className="text-xs text-gray-600">{label}</div>
        <div className={`font-semibold ${isNext ? "text-blue-700" : "text-gray-800"}`}>{time}</div>
    </div>
);

export default PrayerTimeCard; 