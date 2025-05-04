"use client";

import { useState, useEffect, useRef } from "react";
import { City } from "../../types";
import { cities } from "../../data/cities";

interface CitySelectorProps {
    selectedCity: City;
    onCityChange: (city: City) => void;
}

export default function CitySelector({ selectedCity, onCityChange }: CitySelectorProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevScrollPos = useRef<number>(0);

    // Bileşen mount olduğunda scroll pozisyonunu sıfırla
    useEffect(() => {
        prevScrollPos.current = 0;
    }, []);

    // Dropdown kapandığında scroll pozisyonunu kaydet
    useEffect(() => {
        if (!dropdownOpen && scrollRef.current) {
            prevScrollPos.current = 0;
        }
    }, [dropdownOpen]);

    // Scroll pozisyonunu sakla/geri yükle
    useEffect(() => {
        if (dropdownOpen && scrollRef.current) {
            // Dropdown açıldığında önceki scroll pozisyonunu geri yükle
            scrollRef.current.scrollTop = prevScrollPos.current;

            // Scroll event listener ekle
            const handleScroll = () => {
                if (scrollRef.current) {
                    prevScrollPos.current = scrollRef.current.scrollTop;
                }
            };

            const scrollElement = scrollRef.current;
            scrollElement.addEventListener('scroll', handleScroll);

            // Temizlik fonksiyonu
            return () => {
                scrollElement.removeEventListener('scroll', handleScroll);
            };
        }
    }, [dropdownOpen]);

    const handleCitySelect = (city: City) => {
        onCityChange(city);
        setDropdownOpen(false);
    };

    return (
        <div className="mb-4 relative">
            <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex justify-between items-center"
            >
                <span>{selectedCity.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>

            {dropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden">
                    {/* Şehir listesi bölümü */}
                    <div
                        ref={scrollRef}
                        className="overflow-y-auto overscroll-contain"
                        style={{ maxHeight: "300px", willChange: "scroll-position" }}
                    >
                        {cities.map(city => (
                            <div
                                key={city.id}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-800"
                                onClick={() => handleCitySelect(city)}
                            >
                                {city.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 