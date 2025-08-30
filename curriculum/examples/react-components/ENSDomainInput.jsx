// ENS Domain Input Component
// React component for ENS domain input with validation and suggestions

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { validateENSName } from '../shared-utilities/ens-helpers';

const ENSDomainInput = ({
  value,
  onChange,
  onValidate,
  placeholder = "Enter ENS domain (e.g., vitalik.eth)",
  disabled = false,
  className = "",
  showSuggestions = true,
  maxSuggestions = 5,
  debounceMs = 300
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState({ valid: true, errors: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Debounced validation
  const debouncedValidate = useCallback(
    debounce((name) => {
      const result = validateENSName(name);
      setValidation(result);
      onValidate && onValidate(result);
      setIsValidating(false);
    }, debounceMs),
    [debounceMs, onValidate]
  );

  // Handle input changes
  const handleInputChange = (e) => {
    const newValue = e.target.value.toLowerCase();
    setInputValue(newValue);
    onChange && onChange(newValue);
    
    if (newValue.length >= 3) {
      setIsValidating(true);
      debouncedValidate(newValue);
      
      if (showSuggestions) {
        generateSuggestions(newValue);
      }
    } else {
      setValidation({ valid: true, errors: [] });
      setSuggestions([]);
    }
  };

  // Generate domain suggestions
  const generateSuggestions = async (baseName) => {
    if (!showSuggestions || baseName.length < 2) return;
    
    setIsLoadingSuggestions(true);
    
    try {
      // Simulate API call for suggestions
      const mockSuggestions = [
        `${baseName}01`,
        `${baseName}02`, 
        `${baseName}03`,
        `my${baseName}`,
        `${baseName}app`
      ].slice(0, maxSuggestions);
      
      // Add .eth suffix
      const ethSuggestions = mockSuggestions.map(suggestion => `${suggestion}.eth`);
      
      setSuggestions(ethSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    onChange && onChange(suggestion);
    setSuggestions([]);
    
    // Validate the selected suggestion
    const result = validateENSName(suggestion);
    setValidation(result);
    onValidate && onValidate(result);
  };

  // Update input value when prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  // Clear suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setSuggestions([]);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className={`ens-domain-input ${className}`}>
      <div className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`domain-input ${validation.valid ? 'valid' : 'invalid'}`}
        />
        
        {isValidating && (
          <div className="validation-indicator validating">
            <span className="spinner"></span>
            Checking...
          </div>
        )}
        
        {!isValidating && inputValue && (
          <div className={`validation-indicator ${validation.valid ? 'valid' : 'invalid'}`}>
            {validation.valid ? '✓' : '✗'}
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {!validation.valid && validation.errors.length > 0 && (
        <div className="validation-errors">
          {validation.errors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {isLoadingSuggestions && (
            <div className="suggestion-item loading">
              <span className="spinner"></span>
              Loading suggestions...
            </div>
          )}
          
          {!isLoadingSuggestions && suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
      
      <style jsx>{`
        .ens-domain-input {
          position: relative;
          width: 100%;
          max-width: 400px;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .domain-input {
          width: 100%;
          padding: 12px 40px 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }

        .domain-input:focus {
          outline: none;
          border-color: #4f46e5;
        }

        .domain-input.valid {
          border-color: #10b981;
        }

        .domain-input.invalid {
          border-color: #ef4444;
        }

        .domain-input:disabled {
          background-color: #f9fafb;
          cursor: not-allowed;
        }

        .validation-indicator {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          font-weight: bold;
        }

        .validation-indicator.valid {
          color: #10b981;
        }

        .validation-indicator.invalid {
          color: #ef4444;
        }

        .validation-indicator.validating {
          color: #6b7280;
          font-size: 14px;
          font-weight: normal;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #e1e5e9;
          border-radius: 50%;
          border-top-color: #4f46e5;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .validation-errors {
          margin-top: 8px;
          padding: 8px 12px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
        }

        .error-message {
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .error-message:last-child {
          margin-bottom: 0;
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 4px;
        }

        .suggestion-item {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.15s ease;
        }

        .suggestion-item:hover {
          background-color: #f9fafb;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item.loading {
          color: #6b7280;
          cursor: default;
        }

        .suggestion-item.loading:hover {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
};

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

ENSDomainInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onValidate: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  showSuggestions: PropTypes.bool,
  maxSuggestions: PropTypes.number,
  debounceMs: PropTypes.number
};

export default ENSDomainInput;
