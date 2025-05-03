"use client";

import { useState } from "react";
import { cities } from "../../data/cities";
import { City } from "../../types";

interface CitySelectorProps {
    selectedCity: City;
    onCityChange: (city: City) => void;
}

const CitySelector = ({ selectedCity, onCityChange }: CitySelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleCitySelect = (city: City) => {
        onCityChange(city);
        setIsOpen(false);
        setSearchTerm("");
    };

    const filteredCities = searchTerm.length > 0
        ? cities.filter(city =>
            city.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : cities;

    return (
        <div className="relative mb-6 w-full max-w-md">
            <button
                type="button"
                onClick={handleToggle}
                className="flex items-center justify-between w-full px-4 py-3 text-left bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                tabIndex={0}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label="İl seçin"
            >
                <span className="flex items-center">
                    <span className="ml-3 block truncate font-medium">{selectedCity.name}</span>
                </span>
                <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-80 overflow-y-auto">
                    <div className="sticky top-0 z-10 bg-white p-2">
                        <input
                            type="text"
                            placeholder="İl ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="İl ara"
                        />
                    </div>
                    <ul
                        className="py-1"
                        role="listbox"
                        aria-labelledby="city-selector"
                    >
                        {filteredCities.map((city) => (
                            <li
                                key={city.id}
                                className={`cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-100 ${selectedCity.id === city.id ? "bg-blue-50 text-blue-700" : "text-gray-900"
                                    }`}
                                onClick={() => handleCitySelect(city)}
                                role="option"
                                aria-selected={selectedCity.id === city.id}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        handleCitySelect(city);
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <div className="flex items-center">
                                    <span
                                        className={`block truncate ${selectedCity.id === city.id ? "font-semibold" : "font-normal"
                                            }`}
                                    >
                                        {city.name}
                                    </span>
                                </div>

                                {selectedCity.id === city.id && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CitySelector; 