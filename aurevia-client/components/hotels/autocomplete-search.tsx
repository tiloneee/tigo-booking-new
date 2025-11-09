'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building, Sparkles } from 'lucide-react';
import { HotelApiService } from '@/lib/api/hotels';
import { AutocompleteResult } from '@/types/hotel';

interface AutocompleteSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AutocompleteSearch({
  value,
  onChange,
  placeholder = "Search by hotel name or city...",
  className = ""
}: AutocompleteSearchProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult['suggestions']>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const result = await HotelApiService.getAutocompleteSuggestions(query, 8);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: AutocompleteResult['suggestions'][0]) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'hotel':
        return <Building className="w-4 h-4 text-dark-brown" />;
      case 'city':
        return <MapPin className="w-4 h-4 text-dark-brown" />;
      case 'amenity':
        return <Sparkles className="w-4 h-4 text-dark-brown" />;
      default:
        return <Search className="w-4 h-4 text-dark-brown" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel':
        return 'Hotel';
      case 'city':
        return 'City';
      case 'amenity':
        return 'Amenity';
      default:
        return '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-creamy-yellow/70" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow for clicks
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-dark-brown/60 border border-terracotta-rose/30 rounded-lg text-creamy-yellow font-varela text-vintage-base focus:outline-none focus:border-terracotta-rose focus:ring-2 focus:ring-terracotta-rose/20 transition-all duration-300"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-terracotta-rose/30 border-t-terracotta-rose rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute w-full bg-dark-brown/95 backdrop-blur-md border border-terracotta-rose/50 rounded-lg mt-2 shadow-2xl shadow-terracotta-rose/50 max-h-64 overflow-y-auto z-[9999]"
          style={{ top: '100%' }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionClick(suggestion);
              }}
              className="w-full flex items-center px-4 py-3 text-left hover:bg-terracotta-rose/40 focus:bg-terracotta-rose/20 transition-all duration-200 border-b border-terracotta-rose/20 last:border-b-0 first:rounded-t-lg last:rounded-b-lg group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-terracotta-rose/70 to-terracotta-orange/80 mr-3 group-hover:bg-terracotta-rose/20 transition-colors duration-200">
                {getIconForType(suggestion.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-creamy-yellow font-varela text-vintage-base font-medium truncate">
                  {suggestion.text}
                </div>
                <div className="text-creamy-yellow/60 font-varela text-vintage-sm">
                  {getTypeLabel(suggestion.type)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
