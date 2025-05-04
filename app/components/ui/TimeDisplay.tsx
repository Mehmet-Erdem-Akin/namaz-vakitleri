"use client";

import { useEffect, useState } from "react";
import { CurrentPrayer, NextPrayer } from "../../types";

interface TimeDisplayProps {
    currentPrayer: CurrentPrayer | null;
    nextPrayer: NextPrayer | null;
    countdown: string;
    isLoading: boolean;
}

const TimeDisplay = ({ currentPrayer, nextPrayer, countdown, isLoading }: TimeDisplayProps) => {
    const [isDaytime, setIsDaytime] = useState(true);
    const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');

    useEffect(() => {
        // Günün saatine göre görünümü belirle
        const updateTimeOfDay = () => {
            const currentHour = new Date().getHours();

            if (currentHour >= 5 && currentHour < 7) {
                setTimeOfDay('dawn'); // Şafak
                setIsDaytime(true);
            } else if (currentHour >= 7 && currentHour < 17) {
                setTimeOfDay('day'); // Gündüz
                setIsDaytime(true);
            } else if (currentHour >= 17 && currentHour < 19) {
                setTimeOfDay('dusk'); // Gün batımı
                setIsDaytime(true);
            } else {
                setTimeOfDay('night'); // Gece
                setIsDaytime(false);
            }
        };

        updateTimeOfDay();
        const interval = setInterval(updateTimeOfDay, 60000); // Her dakika kontrol et

        return () => clearInterval(interval);
    }, []);

    // Zaman bilgisine göre arkaplan renkleri
    const getBgColor = () => {
        switch (timeOfDay) {
            case 'dawn':
                return 'from-indigo-900 via-purple-600 to-pink-400';
            case 'day':
                return 'from-blue-600 via-blue-400 to-blue-200';
            case 'dusk':
                return 'from-indigo-800 via-purple-500 to-orange-300';
            case 'night':
                return 'from-gray-900 via-indigo-900 to-blue-900';
            default:
                return 'from-blue-600 via-blue-400 to-blue-200';
        }
    };

    // Glow efektleri için renkler
    const getGlowColor = () => {
        switch (timeOfDay) {
            case 'dawn':
                return 'rgba(236, 72, 153, 0.5)'; // pink
            case 'day':
                return 'rgba(59, 130, 246, 0.5)'; // blue
            case 'dusk':
                return 'rgba(249, 115, 22, 0.5)'; // orange
            case 'night':
                return 'rgba(139, 92, 246, 0.5)'; // purple
            default:
                return 'rgba(59, 130, 246, 0.5)'; // blue
        }
    };

    return (
        <div className={`relative h-60 rounded-xl overflow-hidden bg-gradient-to-b ${getBgColor()} shadow-lg mb-6`}>
            {/* Celestial object (sun or moon) */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className={`${isDaytime ? 'bg-yellow-300' : 'bg-gray-200'} rounded-full w-24 h-24 relative z-10`}
                    style={{
                        boxShadow: `0 0 60px 20px ${getGlowColor()}`,
                        animation: 'pulse 2s infinite ease-in-out'
                    }}
                >
                    {!isDaytime && (
                        <div className="absolute top-2 right-2 w-16 h-16 bg-gray-800 rounded-full opacity-90" />
                    )}
                </div>
            </div>

            {/* Stars for night */}
            {!isDaytime && (
                <div className="absolute inset-0">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-white rounded-full opacity-70"
                            style={{
                                width: `${Math.random() * 2 + 1}px`,
                                height: `${Math.random() * 2 + 1}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animation: `twinkle ${Math.random() * 5 + 3}s infinite ease-in-out`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Prayer time information */}
            <div className="absolute inset-x-0 bottom-0 py-4 px-6 bg-black bg-opacity-40 backdrop-blur-sm text-white">
                <div className="flex justify-between items-end">
                    <div>
                        {isLoading ? (
                            <div className="animate-pulse h-4 w-24 bg-gray-400 rounded mb-2" />
                        ) : currentPrayer ? (
                            <div>
                                <p className="text-sm text-gray-200">Mevcut Vakit</p>
                                <p className="text-xl font-semibold">{currentPrayer.name}</p>
                            </div>
                        ) : null}
                    </div>

                    <div className="text-right">
                        {isLoading ? (
                            <div className="animate-pulse h-4 w-24 bg-gray-400 rounded mb-2" />
                        ) : nextPrayer ? (
                            <div>
                                <p className="text-sm text-gray-200">Sonraki Vakit</p>
                                <p className="text-xl font-semibold">{nextPrayer.name}</p>
                                <p className="text-2xl font-bold font-mono">{countdown}</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeDisplay; 