import { useEffect, useState, useCallback } from 'react';
import { Button, InputField } from '@components';
import styles from './TableHeader.module.css';

const TableHeader = ({ 
    icon, 
    label, 
    currentSort, 
    searchInput, 
    onSortChange, 
    onSearchChange, 
    onSearchSubmit,
    currentPage,
    totalPages,
    resultsLabel,
    sortLabel,
    onPageChange,
    withPagination = false
}) => {

    const [ localSearchValue, setLocalSearchValue ] = useState(searchInput || '');
    const [ loading, setLoading ] = useState(false);

    useEffect(() => {
        
        setLoading(true);

        const timeoutId = setTimeout(() => {
            if (localSearchValue !== searchInput) {
                onSearchChange(localSearchValue);
            }
            setLoading(false);
        }, 500);


        return () => clearTimeout(timeoutId);
    }, [localSearchValue]);

    useEffect(() => {
        setLocalSearchValue(searchInput || '');
    }, [searchInput]);

    const handleSearchInputChange = useCallback((value) => {
        setLocalSearchValue(value);
    }, []);

    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, startPage + 2);
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    const sortOptions = [
        {
            label: 'Price (Low to High)',
            action: () => onSortChange('Sort by: Price (Low to High)')
        },
        {
            label: 'Price (High to Low)',
            action: () => onSortChange('Sort by: Price (High to Low)')
        },
        {
            label: 'Name (A-Z)',
            action: () => onSortChange('Sort by: Name (A-Z)')
        },
        {
            label: 'Name (Z-A)',
            action: () => onSortChange('Sort by: Name (Z-A)')
        },
        {
            label: 'Most Popular',
            action: () => onSortChange('Sort by: Popularity (Most Popular)')
        },
        {
            label: 'Least Popular',
            action: () => onSortChange('Sort by: Popularity (Least Popular)')
        },
        {
            label: 'Newest First',
            action: () => onSortChange('Sort by: Newest First')
        },
        {
            label: 'Oldest First',
            action: () => onSortChange('Sort by: Oldest First')
        }
    ];

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            onSearchSubmit();
        }
    };

    const getCurrentSortLabel = () => {
        const sortMapping = {
            'Sort by: Price (Low to High)': 'Price (Low to High)',
            'Sort by: Price (High to Low)': 'Price (High to Low)',
            'Sort by: Name (A-Z)': 'Name (A-Z)',
            'Sort by: Name (Z-A)': 'Name (Z-A)',
            'Sort by: Popularity (Most Popular)': 'Most Popular',
            'Sort by: Popularity (Least Popular)': 'Least Popular',
            'Sort by: Newest First': 'Newest First',
            'Sort by: Oldest First': 'Oldest First'
        };

        return sortMapping[currentSort] || 'Sort by';
    };

    return (
        <div className={styles['table-header']}>
            
            <div className={styles['container-top']}>
                <div className={ styles['status'] }>
                    {
                        (loading) ? (
                            <i className={ `fa-solid fa-spinner ${ styles['spinner'] }` }></i>
                        ) : (
                            <i className={ 'fa-solid fa-magnifying-glass' }></i>
                        )
                    }
                </div>
                <InputField
                    value={ localSearchValue }
                    hint={ `Search ${ label?.toLowerCase() }...` }
                    type={ 'text' }
                    onKeyPress={ () => { handleKeyPress } }
                    onChange={ (e) => handleSearchInputChange(e.target.value) }
                    isSubmittable={ false }
                />
                <Button
                    id='sort-dropdown'
                    type='secondary'
                    label={getCurrentSortLabel()}
                    icon='fa-solid fa-chevron-down'
                    iconPosition='right'
                    dropdownPosition='right'
                    options={sortOptions}
                    externalStyles={styles['sort-button']}
                />
            </div>
            <div className={ styles['divider-horizontal'] }></div>
            <div className={ styles['container-bottom'] }>
                <div className={ styles['info'] }>
                    <h3>{ resultsLabel }</h3>
                    <h3>{ sortLabel }</h3>
                </div>
                <div className={ styles['pagination'] }>
                    <Button
                        type="icon-outlined"
                        action={ () => onPageChange(currentPage - 1) }
                        icon="fa-solid fa-angle-left"
                        disabled={ currentPage === 1 }
                    />
                    { pageNumbers.map(page => (
                        <Button
                            key={ page }
                            type='secondary'
                            label={ String(page) }
                            action={ () => onPageChange(page) }
                            isActive={ currentPage === page }
                        />
                    ))}
                    <Button
                        type="icon-outlined"
                        action={ () => onPageChange(currentPage + 1) }
                        icon="fa-solid fa-angle-right"
                        disabled={ currentPage === totalPages }
                    />
                </div>
            </div>
        </div>
    );
};

export default TableHeader;
