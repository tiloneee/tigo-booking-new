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
        return <Building className="w-4 h-4 text-copper-accent" />;
      case 'city':
        return <MapPin className="w-4 h-4 text-copper-accent" />;
      case 'amenity':
        return <Sparkles className="w-4 h-4 text-copper-accent" />;
      default:
        return <Search className="w-4 h-4 text-copper-accent" />;
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-copper-accent/70" />
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
          className="w-full pl-10 pr-4 py-3 bg-walnut-darkest/60 border border-copper-accent/30 rounded-lg text-cream-light placeholder-cream-light/50 font-cormorant text-vintage-base focus:outline-none focus:border-copper-accent focus:ring-2 focus:ring-copper-accent/20 transition-all duration-300"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-copper-accent/30 border-t-copper-accent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute w-full bg-walnut-dark/95 backdrop-blur-md border border-copper-accent/50 rounded-lg mt-2 shadow-2xl shadow-walnut-darkest/50 max-h-64 overflow-y-auto z-[9999]"
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
              className="w-full flex items-center px-4 py-3 text-left hover:bg-copper-accent/20 focus:bg-copper-accent/20 transition-all duration-200 border-b border-copper-accent/10 last:border-b-0 first:rounded-t-lg last:rounded-b-lg group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-copper-accent/10 mr-3 group-hover:bg-copper-accent/20 transition-colors duration-200">
                {getIconForType(suggestion.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-cream-light font-cormorant text-vintage-base font-medium truncate">
                  {suggestion.text}
                </div>
                <div className="text-cream-light/60 font-cormorant text-vintage-sm">
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
