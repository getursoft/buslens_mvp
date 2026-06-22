import React from 'react';
import { SlidersHorizontal, RefreshCw, Clock, Award, Star } from 'lucide-react';

interface FilterSidebarProps {
  priceRange: number;
  setPriceRange: (p: number) => void;
  selectedBusTypes: string[];
  toggleBusType: (type: string) => void;
  selectedDepartureTime: string;
  setSelectedDepartureTime: (time: string) => void;
  selectedAmenities: string[];
  toggleAmenity: (amenity: string) => void;
  minRating: number;
  setMinRating: (r: number) => void;
  onClearAll: () => void;
  // New props requested
  selectedArrivalTime: string;
  setSelectedArrivalTime: (time: string) => void;
  selectedBoardingPoints: string[];
  setSelectedBoardingPoints: (points: string[]) => void;
  selectedDroppingPoints: string[];
  setSelectedDroppingPoints: (points: string[]) => void;
  selectedSeatingType: 'all' | 'sleeper' | 'seater';
  setSelectedSeatingType: (type: 'all' | 'sleeper' | 'seater') => void;
  selectedAcNonAc: 'all' | 'ac' | 'non-ac';
  setSelectedAcNonAc: (type: 'all' | 'ac' | 'non-ac') => void;
  allRouteBoardingPoints: string[];
  allRouteDroppingPoints: string[];
}

export default function FilterSidebar({
  priceRange,
  setPriceRange,
  selectedBusTypes,
  toggleBusType,
  selectedDepartureTime,
  setSelectedDepartureTime,
  selectedAmenities,
  toggleAmenity,
  minRating,
  setMinRating,
  onClearAll,
  selectedArrivalTime,
  setSelectedArrivalTime,
  selectedBoardingPoints,
  setSelectedBoardingPoints,
  selectedDroppingPoints,
  setSelectedDroppingPoints,
  selectedSeatingType,
  setSelectedSeatingType,
  selectedAcNonAc,
  setSelectedAcNonAc,
  allRouteBoardingPoints,
  allRouteDroppingPoints,
}: FilterSidebarProps) {
  return (
    <aside className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-6 text-left" id="left-filters-panel">
      {/* Title bar with Clear All */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/80">
        <h3 className="font-extrabold text-[#0F172A] text-base">Filters</h3>
        <button
          onClick={onClearAll}
          className="text-xs font-bold text-blue-600 hover:text-blue-500 duration-150 transition-colors cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Price range selector slider */}
      <div className="space-y-3 pb-5 border-b border-slate-150/40">
        <h4 className="text-xs font-bold text-slate-700">Price range</h4>
        <div className="text-[11px] text-slate-500 font-semibold tracking-wide">
          ₹250 – ₹2500+
        </div>
        
        <div className="pt-2">
          <input
            type="range"
            min="250"
            max="2500"
            step="50"
            value={priceRange}
            onChange={(e) => setPriceRange(parseInt(e.target.value))}
            className="w-full h-1 bg-blue-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
            style={{
              background: 'linear-gradient(to right, #2563eb 0%, #2563eb 100%)'
            }}
            aria-label="Filter by maximum price range"
          />
        </div>
        
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
          <span>₹250</span>
          <span>₹2500+</span>
        </div>
      </div>

      {/* Seating Type Filter (Sleeper vs Seater) */}
      <div className="space-y-3 pb-5 border-b border-slate-150/40">
        <h4 className="text-xs font-bold text-slate-705">Seating Type</h4>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full">
          {[
            { id: 'all', label: 'All' },
            { id: 'sleeper', label: 'Sleeper' },
            { id: 'seater', label: 'Seater' }
          ].map((type) => (
            <button
              type="button"
              key={type.id}
              onClick={() => setSelectedSeatingType(type.id as any)}
              className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedSeatingType === type.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* AC / Non-AC Cabin Filter */}
      <div className="space-y-3 pb-5 border-b border-slate-150/40">
        <h4 className="text-xs font-bold text-slate-705">AC Cabin Type</h4>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full">
          {[
            { id: 'all', label: 'All' },
            { id: 'ac', label: 'AC' },
            { id: 'non-ac', label: 'Non-AC' }
          ].map((type) => (
            <button
              type="button"
              key={type.id}
              onClick={() => setSelectedAcNonAc(type.id as any)}
              className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedAcNonAc === type.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bus type checkboxes with counts */}
      <div className="space-y-3 pb-5 border-b border-slate-150/40">
        <h4 className="text-xs font-bold text-slate-700">Bus type checkboxes</h4>
        <div className="space-y-2.5">
          {[
            { id: 'AC Sleeper', count: 312 },
            { id: 'Non-AC Sleeper', count: 156 },
            { id: 'AC Seater', count: 89 },
            { id: 'Non-AC Seater', count: 45 },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none py-0.5"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedBusTypes.includes(item.id)}
                  onChange={() => toggleBusType(item.id)}
                  className="w-4.5 h-4.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-705 text-[11px]">{item.id}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{item.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Departure time vertically listed with radio button and counts */}
      <div className="space-y-3 pb-5 border-b border-slate-150/40">
        <h4 className="text-xs font-bold text-slate-700">Departure time</h4>
        <div className="space-y-2.5">
          {[
            { id: 'Any time', label: 'Any time' },
            { id: 'Before 6 AM', label: 'Before 6 AM' },
            { id: '6 AM - 12 PM', label: '6 AM – 12 PM' },
            { id: '12 PM - 6 PM', label: '12 PM – 6 PM' },
            { id: 'After 6 PM', label: 'After 6 PM' },
          ].map((slot) => (
            <label
              key={slot.id}
              className="flex items-center gap-2.5 text-xs text-slate-606 hover:text-slate-933 cursor-pointer select-none py-0.5"
            >
              <input
                type="radio"
                name="departureTime"
                checked={selectedDepartureTime === slot.id}
                onChange={() => setSelectedDepartureTime(slot.id)}
                className="w-4.5 h-4.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-semibold text-slate-705 text-[11px]">{slot.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Arrival time vertically listed with radio button and counts */}
      <div className="space-y-3 pb-5 border-b border-slate-150/40">
        <h4 className="text-xs font-bold text-slate-700">Arrival time</h4>
        <div className="space-y-2.5">
          {[
            { id: 'Any time', label: 'Any time' },
            { id: 'Before 6 AM', label: 'Before 6 AM' },
            { id: '6 AM - 12 PM', label: '6 AM – 12 PM' },
            { id: '12 PM - 6 PM', label: '12 PM – 6 PM' },
            { id: 'After 6 PM', label: 'After 6 PM' },
          ].map((slot) => (
            <label
              key={slot.id}
              className="flex items-center gap-2.5 text-xs text-slate-606 hover:text-slate-933 cursor-pointer select-none py-0.5"
            >
              <input
                type="radio"
                name="arrivalTime"
                checked={selectedArrivalTime === slot.id}
                onChange={() => setSelectedArrivalTime(slot.id)}
                className="w-4.5 h-4.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-semibold text-slate-705 text-[11px]">{slot.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Boarding Point Filter */}
      {allRouteBoardingPoints.length > 0 && (
        <div className="space-y-3 pb-5 border-b border-slate-150/40">
          <h4 className="text-xs font-bold text-slate-700">Boarding Point</h4>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {allRouteBoardingPoints.map((point) => {
              const isChecked = selectedBoardingPoints.includes(point);
              return (
                <label
                  key={point}
                  className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        setSelectedBoardingPoints(selectedBoardingPoints.filter((p) => p !== point));
                      } else {
                        setSelectedBoardingPoints([...selectedBoardingPoints, point]);
                      }
                    }}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-705 text-[11px] truncate block max-w-[190px]" title={point}>
                    {point}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Dropping Point Filter */}
      {allRouteDroppingPoints.length > 0 && (
        <div className="space-y-3 pb-5 border-b border-slate-150/40">
          <h4 className="text-xs font-bold text-slate-700">Dropping Point</h4>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {allRouteDroppingPoints.map((point) => {
              const isChecked = selectedDroppingPoints.includes(point);
              return (
                <label
                  key={point}
                  className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        setSelectedDroppingPoints(selectedDroppingPoints.filter((p) => p !== point));
                      } else {
                        setSelectedDroppingPoints([...selectedDroppingPoints, point]);
                      }
                    }}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-705 text-[11px] truncate block max-w-[190px]" title={point}>
                    {point}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Amenities checkboxes vertically with counts */}
      <div className="space-y-3 pb-5 border-b border-slate-150/40">
        <h4 className="text-xs font-bold text-slate-700">Amenities</h4>
        <div className="space-y-2.5">
          {[
            { id: 'liveTracking', label: 'Live Tracking', count: 312 },
            { id: 'chargingPort', label: 'Charging Point', count: 289 },
            { id: 'wifi', label: 'GPS', count: 345 }, // WiFi mapped as GPS in database to match image
            { id: 'waterBottle', label: 'Water Bottle', count: 210 },
            { id: 'blanket', label: 'Blanket', count: 155 },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none py-0.5"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(item.id)}
                  onChange={() => toggleAmenity(item.id)}
                  className="w-4.5 h-4.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-705 text-[11px]">{item.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{item.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum rating scores as pill buttons */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700">Ratings</h4>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full" id="rating-filter-pill">
          {[0, 4.0, 4.2, 4.5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setMinRating(star)}
              className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                minRating === star
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {star === 0 ? 'All' : `${star}★`}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
