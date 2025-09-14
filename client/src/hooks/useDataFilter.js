import { useState, useEffect, useMemo } from 'react';

const useDataFilter = (data = [], filterConfig = {}) => {
    const [searchValue, setSearchValue] = useState('');
    const [sortValue, setSortValue] = useState('');
    
    const {
        searchFields = [],
        sortOptions = [],
        filterOptions = []
    } = filterConfig;

    useEffect(() => {
        if (sortOptions.length > 0 && !sortValue) {
            setSortValue(sortOptions[0].value);
        }
    }, [sortOptions, sortValue]);

    const filteredData = useMemo(() => {
        if (!searchValue.trim() || searchFields.length === 0) {
            return data;
        }

        const searchTerm = searchValue.toLowerCase().trim();
        
        return data.filter(item => {
            return searchFields.some(field => {
                const fieldValue = item[field];
                if (fieldValue === null || fieldValue === undefined) return false;
                return String(fieldValue).toLowerCase().includes(searchTerm);
            });
        });
    }, [data, searchValue, searchFields]);

    const sortedData = useMemo(() => {
        if (!sortValue) return filteredData;

        const sortOption = sortOptions.find(option => option.value === sortValue);
        if (!sortOption) return filteredData;

        const sortedArray = [...filteredData];

        if (sortOption.sortFunction) {
            return sortedArray.sort(sortOption.sortFunction);
        }

        if (sortOption.field) {
            const { field, type, direction } = sortOption;
            
            return sortedArray.sort((a, b) => {
                let aValue = a[field];
                let bValue = b[field];

                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                let comparison = 0;

                switch (type) {
                    case 'string':
                        comparison = String(aValue).localeCompare(String(bValue));
                        break;
                    case 'number':
                        comparison = Number(aValue) - Number(bValue);
                        break;
                    case 'date':
                        comparison = new Date(aValue) - new Date(bValue);
                        break;
                    default:
                        comparison = String(aValue).localeCompare(String(bValue));
                }

                return direction === 'desc' ? -comparison : comparison;
            });
        }

        return filteredData;
    }, [filteredData, sortValue, sortOptions]);

    const handleSearchChange = (value) => {
        setSearchValue(value || '');
    };

    const handleSortChange = (value) => {
        setSortValue(value || '');
    };

    const totalItems = data.length;
    const filteredItems = sortedData.length;

    return {
        data: sortedData,
        searchValue,
        sortValue,
        handleSearchChange,
        handleSortChange,
        sortOptions,
        totalItems,
        filteredItems
    };
};

export default useDataFilter;
