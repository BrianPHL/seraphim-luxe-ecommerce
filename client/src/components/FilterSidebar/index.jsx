import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@components';
import { useCategories } from '@contexts';
import styles from './FilterSidebar.module.css';

const FilterSidebar = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { getActiveCategories, getActiveSubcategories } = useCategories();
    const [priceRange, setPriceRange] = useState({
        min: searchParams.get('price_min') || '',
        max: searchParams.get('price_max') || ''
    });
    const [selectedAttributes, setSelectedAttributes] = useState({
        colors: searchParams.get('colors')?.split(',').filter(Boolean) || []
    });
    
    const categories = getActiveCategories();
    const selectedCategoryId = searchParams.get('category_id') ? 
        parseInt(searchParams.get('category_id')) : null;
    
    const subcategories = selectedCategoryId ? 
        getActiveSubcategories(selectedCategoryId) : [];
    
    // Available attributes with metadata - only Silver and Gold
    const availableColors = [
        { id: 'Gold', label: 'Gold' },
        { id: 'Silver', label: 'Silver' }
    ];
    
    // Sync state with URL params when they change
    useEffect(() => {
        setPriceRange({
            min: searchParams.get('price_min') || '',
            max: searchParams.get('price_max') || ''
        });
        
        setSelectedAttributes({
            colors: searchParams.get('colors')?.split(',').filter(Boolean) || []
        });
    }, [searchParams]);
    
    const applyFilters = () => {
        const params = new URLSearchParams(searchParams);
        
        if (priceRange.min) params.set('price_min', priceRange.min);
        else params.delete('price_min');
        
        if (priceRange.max) params.set('price_max', priceRange.max);
        else params.delete('price_max');
        
        if (selectedAttributes.colors.length > 0) 
            params.set('colors', selectedAttributes.colors.join(','));
        else params.delete('colors');
        
        // Reset to page 1 when filters change
        params.set('page', '1');
        
        setSearchParams(params);
    };
    
    const resetFilters = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('category_id');
        params.delete('subcategory_id');
        params.delete('price_min');
        params.delete('price_max');
        params.delete('colors');
        params.set('page', '1');
        setSearchParams(params);
        
        setPriceRange({ min: '', max: '' });
        setSelectedAttributes({ colors: [] });
    };
    
    const handleCategoryChange = (categoryId) => {
        const params = new URLSearchParams(searchParams);
        if (categoryId) {
            params.set('category_id', categoryId);
            params.delete('subcategory_id'); // Reset subcategory when category changes
        } else {
            params.delete('category_id');
            params.delete('subcategory_id');
        }
        params.set('page', '1');
        setSearchParams(params);
    };
    
    const handleSubcategoryChange = (subcategoryId) => {
        const params = new URLSearchParams(searchParams);
        if (subcategoryId) {
            params.set('subcategory_id', subcategoryId);
        } else {
            params.delete('subcategory_id');
        }
        params.set('page', '1');
        setSearchParams(params);
    };
    
    const toggleAttribute = (type, value) => {
        setSelectedAttributes(prev => {
            const currentValues = [...prev[type]];
            const index = currentValues.indexOf(value);
            
            if (index === -1) {
                currentValues.push(value);
            } else {
                currentValues.splice(index, 1);
            }
            
            return {
                ...prev,
                [type]: currentValues
            };
        });
    };

    // Count active filters
    const getActiveFilterCount = () => {
        let count = 0;
        if (searchParams.get('category_id')) count++;
        if (searchParams.get('subcategory_id')) count++;
        if (searchParams.get('price_min') || searchParams.get('price_max')) count++;
        count += selectedAttributes.colors.length;
        return count;
    };
    
    const activeFilterCount = getActiveFilterCount();
    
    return (
        <div className={styles['filter-sidebar']}>
            <div className={styles['filter-header']}>
                <h2>Filter Products</h2>
                <span>
                    {activeFilterCount > 0 
                        ? `${activeFilterCount} ${activeFilterCount === 1 ? 'Filter' : 'Filters'} Applied` 
                        : 'No Filters Applied'}
                </span>
            </div>
            
            <div className={styles['filter-section']}>
                <h3>Categories</h3>
                <div className={styles['category-list']}>
                    <div 
                        className={`${styles['category-item']} ${!selectedCategoryId ? styles['active'] : ''}`}
                        onClick={() => handleCategoryChange(null)}
                    >
                        All Categories
                    </div>
                    {categories.map(category => (
                        <div 
                            key={category.id}
                            className={`${styles['category-item']} ${selectedCategoryId === category.id ? styles['active'] : ''}`}
                            onClick={() => handleCategoryChange(category.id)}
                        >
                            {category.name}
                        </div>
                    ))}
                </div>
            </div>
            
            {selectedCategoryId && subcategories.length > 0 && (
                <div className={styles['filter-section']}>
                    <h3>Subcategories</h3>
                    <div className={styles['subcategory-list']}>
                        <div 
                            className={`${styles['subcategory-item']} ${!searchParams.get('subcategory_id') ? styles['active'] : ''}`}
                            onClick={() => handleSubcategoryChange(null)}
                        >
                            All Subcategories
                        </div>
                        {subcategories.map(subcategory => (
                            <div 
                                key={subcategory.id}
                                className={`${styles['subcategory-item']} ${parseInt(searchParams.get('subcategory_id')) === subcategory.id ? styles['active'] : ''}`}
                                onClick={() => handleSubcategoryChange(subcategory.id)}
                            >
                                {subcategory.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className={styles['filter-section']}>
                <h3>Price Range</h3>
                <div className={styles['price-inputs']}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <input 
                            type="number" 
                            placeholder="Min" 
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <span>-</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <input 
                            type="number" 
                            placeholder="Max" 
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            </div>
            
            <div className={styles['filter-section']}>
                <h3>Metal</h3>
                <div className={styles['attribute-list']}>
                    {availableColors.map(color => (
                        <div 
                            key={color.id}
                            className={`${styles['attribute-item']} ${selectedAttributes.colors.includes(color.id) ? styles['selected'] : ''}`}
                            onClick={() => toggleAttribute('colors', color.id)}
                            data-color={color.id}
                        >
                            <span className={styles['checkbox']}>
                                {selectedAttributes.colors.includes(color.id) && <i className="fa-solid fa-check"></i>}
                            </span>
                            {color.label}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className={styles['filter-actions']}>
                <Button
                    type="primary"
                    label="Apply Filters"
                    action={applyFilters}
                />
                <Button
                    type="secondary"
                    label="Reset Filters"
                    action={resetFilters}
                />
            </div>
        </div>
    );
};

export default FilterSidebar;