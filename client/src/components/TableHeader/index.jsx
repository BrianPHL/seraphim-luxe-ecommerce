import { Button } from '@components';
import styles from './TableHeader.module.css';

const TableHeader = ({ 
    icon, 
    label, 
    currentSort, 
    searchInput, 
    onSortChange, 
    onSearchChange, 
    onSearchSubmit 
}) => {

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
        // Create a mapping of sort values to labels
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
            <div className={styles['header-left']}>
                <i className={icon}></i>
                <h2>{label}</h2>
            </div>
            
            <div className={styles['header-right']}>
                <div className={styles['search-container']}>
                    <input
                        type="text"
                        placeholder={`Search ${label?.toLowerCase()}...`}
                        value={searchInput}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className={styles['search-input']}
                    />
                    <i 
                        className="fa-solid fa-magnifying-glass"
                        onClick={onSearchSubmit}
                    ></i>
                </div>
                
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
        </div>
    );
};

export default TableHeader;
