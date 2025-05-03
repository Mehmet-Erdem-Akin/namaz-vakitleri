"use client";

import { useState, useEffect } from "react";
import { cities } from "./data/cities";
import { City, WeeklyPrayerData } from "./types";
import { getPrayerTimes } from "./services/prayerService";
import CitySelector from "./components/ui/CitySelector";
import PrayerTimeCard from "./components/ui/PrayerTimeCard";
import QiblaCompass from "./components/ui/QiblaCompass";

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City>(cities[5]); // Varsayılan olarak Ankara
  const [prayerData, setPrayerData] = useState<WeeklyPrayerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("daily");
  const [showQibla, setShowQibla] = useState<boolean>(false);

  useEffect(() => {
    const loadPrayerTimes = async () => {
      setLoading(true);
      try {
        const data = await getPrayerTimes(selectedCity.id);
        setPrayerData(data);
      } catch (error) {
        console.error("Namaz vakitleri yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPrayerTimes();
  }, [selectedCity]);

  const handleCityChange = (city: City) => {
    setSelectedCity(city);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleToggleQibla = () => {
    setShowQibla(!showQibla);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">Namaz Vakitleri</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CitySelector selectedCity={selectedCity} onCityChange={handleCityChange} />

          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTabChange("daily")}
                  className={`px-4 py-2 rounded-md ${activeTab === "daily"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                >
                  Günlük
                </button>
                <button
                  onClick={() => handleTabChange("weekly")}
                  className={`px-4 py-2 rounded-md ${activeTab === "weekly"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                >
                  Haftalık
                </button>
              </div>

              <button
                onClick={handleToggleQibla}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <span>{showQibla ? "Vakitleri Göster" : "Kıble Pusulası"}</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : showQibla ? (
              <QiblaCompass />
            ) : prayerData ? (
              <div>
                {activeTab === "daily" ? (
                  // Günlük görünüm - Sadece bugünü göster
                  <PrayerTimeCard data={prayerData.days[0]} isToday={true} />
                ) : (
                  // Haftalık görünüm - Tüm günleri göster
                  prayerData.days.map((day, index) => (
                    <PrayerTimeCard key={day.date} data={day} isToday={index === 0} />
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-600">
                Namaz vakitleri yüklenemedi. Lütfen tekrar deneyin.
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-600 mt-8">
            <p>Tüm vakitler bilgi amaçlıdır ve tahmini değerler içerebilir.</p>
            <p>
              © {new Date().getFullYear()} Namaz Vakitleri -
              <a href="#" className="text-blue-600 hover:underline ml-1">
                Hakkımızda
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
