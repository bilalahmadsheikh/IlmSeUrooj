'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './SearchableSelect.module.css';

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
    icon = null
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Find the selected option's label
    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption?.label || placeholder;

    // Filter options based on search term
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
                setIsTyping(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlighted index when filtered options change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchTerm]);

    // Handle clicking anywhere on the wrapper (including arrow)
    const handleWrapperClick = (e) => {
        e.stopPropagation();
        if (!isOpen) {
            // First click - open dropdown, show all options
            setIsOpen(true);
            setSearchTerm('');
            setIsTyping(false);
        } else if (!isTyping) {
            // Second click while open - enable typing mode
            setIsTyping(true);
            setSearchTerm('');
            inputRef.current?.focus();
        }
    };

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        setIsTyping(true);
        if (!isOpen) setIsOpen(true);
    };

    const handleInputFocus = () => {
        // Don't auto-open on focus, let wrapper click handle it
    };

    const handleOptionClick = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
        setIsTyping(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredOptions[highlightedIndex]) {
                    handleOptionClick(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                setIsTyping(false);
                break;
            default:
                // Any other key press enables typing mode
                if (e.key.length === 1) {
                    setIsTyping(true);
                }
                break;
        }
    };

    // Determine what to display in the input
    const getInputValue = () => {
        if (isOpen && isTyping) {
            return searchTerm;
        }
        return displayLabel;
    };

    return (
        <div className={`${styles.container} ${isOpen ? styles.containerOpen : ''} ${className}`} ref={containerRef}>
            <div
                className={`${styles.inputWrapper} ${isOpen ? styles.open : ''}`}
                onClick={handleWrapperClick}
            >
                {icon && <span className={styles.icon}>{icon}</span>}
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.input}
                    value={getInputValue()}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={isOpen && isTyping ? 'Type to search...' : placeholder}
                    readOnly={!isTyping}
                />
                <span
                    className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                        setSearchTerm('');
                        setIsTyping(false);
                    }}
                >
                    ▼
                </span>
            </div>

            {isOpen && (
                <div
                    className={styles.dropdown}
                    onWheel={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {filteredOptions.length === 0 ? (
                        <div className={styles.noResults}>No results found</div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option.value}
                                className={`${styles.option} ${option.value === value ? styles.selected : ''
                                    } ${index === highlightedIndex ? styles.highlighted : ''}`}
                                onClick={() => handleOptionClick(option)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                {option.label}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
