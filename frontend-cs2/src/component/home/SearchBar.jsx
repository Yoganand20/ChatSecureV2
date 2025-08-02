// components/SearchBar.jsx
import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ 
    placeholder = "Search...", 
    value, 
    onChange, 
    className = "" 
}) => {
    return (
        <div className={`relative ${className}`}>
            <input
            id="searchBar55"
                type="text"
                placeholder={placeholder}
                className="input input-bordered w-full pl-10 input-sm bg-base-200/50 backdrop-blur-sm"
                value={value}
                onChange={onChange}
            />
            <Search
                
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 pointer-events-none z-10"
            />
        </div>
    );
};

export default SearchBar;
