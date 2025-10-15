import { useState, useEffect, useCallback } from 'react';
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
z
    const [selectedAttributes, setSelectedAttributes] = useState({
    metal_types: searchParams.get('metal_types')?.split(',').filter(Boolean) || []
    });

    const [availableSubcategories, setAvailableSubcategories] = useState([]);
    const [localCategories, setLocalCategories] = useState([]);
    
    const categories = getActiveCategories();
    const selectedCategoryId = searchParams.get('category_id') ? 
        parseInt(searchParams.get('category_id')) : null;
    
    const subcategories = selectedCategoryId ? 
        getActiveSubcategories(selectedCategoryId) : [];
    
    const availableColors = [
        { id: '1', label: 'Gold', value: 1 },
        { id: '0', label: 'Silver', value: 0 },
        { id: '2', label: 'Mixed Metals', value: 2 }
    ];

    const refreshData = useCallback(async () => {
        try {
            const catResponse = await fetch('/api/categories', {
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (catResponse.ok) {
                const freshCategories = await catResponse.json();
                setLocalCategories(freshCategories);
                
                const subcategoryPromises = freshCategories.map(category =>
                    fetch(`/api/categories/${category.id}/subcategories`, {
                        headers: { 'Cache-Control': 'no-cache' }
                    })
                    .then(response => response.ok ? response.json() : [])
                    .catch(error => {
                        console.error(`Error fetching subcategories for category ${category.id}:`, error);
                        return [];
                    })
                );

                const subcategoryResults = await Promise.all(subcategoryPromises);
                const allSubcategories = subcategoryResults.flat();
                const activeSubcategories = allSubcategories.filter(sub => sub.is_active);
                setAvailableSubcategories(activeSubcategories);
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }, []);
    
    useEffect(() => {
        if (categories.length > 0 && localCategories.length === 0) {
            setLocalCategories(categories);
            refreshData();
        }
    }, [categories, localCategories.length, refreshData]);

    useEffect(() => {
        const handleRefresh = async () => {
            if (!document.hidden) {
                await refreshData();
            }
        };

        window.addEventListener('focus', handleRefresh);
        const interval = setInterval(handleRefresh, 120000);

        return () => {
            window.removeEventListener('focus', handleRefresh);
            clearInterval(interval);
        };
    }, [refreshData]);

    useEffect(() => {
    setPriceRange({
        min: searchParams.get('price_min') || '',
        max: searchParams.get('price_max') || ''
    });
    
    setSelectedAttributes({
        metal_types: searchParams.get('metal_types')?.split(',').filter(Boolean) || []
    });
    }, [searchParams]);
    
    const applyFilters = () => {
        const params = new URLSearchParams(searchParams);
        
        if (priceRange.min) params.set('price_min', priceRange.min);
        else params.delete('price_min');
        
        if (priceRange.max) params.set('price_max', priceRange.max);
        else params.delete('price_max');
        
        if (selectedAttributes.metal_types.length > 0) 
            params.set('metal_types', selectedAttributes.metal_types.join(','));
        else params.delete('metal_types');
        
        params.set('page', '1');
        setSearchParams(params);
    };
    
    const resetFilters = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('category_id');
        params.delete('subcategory_id');
        params.delete('price_min');
        params.delete('price_max');
        params.delete('metal_types'); 
        params.set('page', '1');
        setSearchParams(params);
        
        setPriceRange({ min: '', max: '' });
        setSelectedAttributes({ metal_types: [] });
    };
    
    const handleCategoryChange = (categoryId) => {
        const params = new URLSearchParams(searchParams);
        
        if (categoryId) {
            params.set('category_id', categoryId);

            const currentSubcategories = searchParams.get('subcategory_id')?.split(',').filter(Boolean) || [];
            if (currentSubcategories.length > 0) {
                const validSubcategories = getActiveSubcategories(categoryId);
                const validSubcategoryIds = validSubcategories.map(sub => sub.id.toString());
                
                const validSelections = currentSubcategories.filter(id => 
                    validSubcategoryIds.includes(id)
                );
                
                if (validSelections.length > 0) {
                    params.set('subcategory_id', validSelections.join(','));
                } else {
                    params.delete('subcategory_id');
                }
            }
        } else {
            params.delete('category_id');
        }
        
        params.set('page', '1');
        setSearchParams(params);
    };
    
    const handleSubcategoryChange = (subcategoryItem) => {
        const params = new URLSearchParams(searchParams);
        const currentSubcategories = searchParams.get('subcategory_id')?.split(',').filter(Boolean) || [];
        const subcategoryIds = subcategoryItem.allIds || [subcategoryItem.id];
        
        const currentIdsSet = new Set(currentSubcategories);
        const anySelected = subcategoryIds.some(id => currentIdsSet.has(id.toString()));
        
        if (anySelected) {
            
            const updatedSubcategories = currentSubcategories.filter(id => 
                !subcategoryIds.includes(parseInt(id))
            );
            
            if (updatedSubcategories.length > 0) {
                params.set('subcategory_id', updatedSubcategories.join(','));
            } else {
                params.delete('subcategory_id');
            }
        } else {
            params.set('subcategory_id', [...currentSubcategories, ...subcategoryIds.map(id => id.toString())].join(','));
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

    const getSubcategoriesToDisplay = () => {
        if (selectedCategoryId && subcategories.length > 0) {
            return subcategories;
        } else if (selectedCategoryId) {
            return availableSubcategories.filter(sub =>
                sub.category_id === selectedCategoryId && sub.is_active !== false
            );
        } else {
            const uniqueSubcategories = [];
            const seenNames = new Set();

            availableSubcategories.forEach(sub => {
                if (!seenNames.has(sub.name)) {
                    seenNames.add(sub.name);
                    const allMatchingIds = availableSubcategories
                        .filter(s => s.name === sub.name)
                        .map(s => s.id);
                        
                    uniqueSubcategories.push({
                        ...sub,
                        allIds: allMatchingIds.length > 1 ? allMatchingIds : undefined
                    });
                }
            });

            return uniqueSubcategories;
        }
    };
    
    const subcategoriesToDisplay = getSubcategoriesToDisplay();
    
    const getActiveFilterCount = () => {
        let count = 0;

        if (searchParams.get('category_id')) count++;
        
        const selectedSubcategoryIds = searchParams.get('subcategory_id')?.split(',').filter(Boolean) || [];
        if (selectedSubcategoryIds.length > 0) {
            const selectedNames = new Set();
            
            for (const id of selectedSubcategoryIds) {
                const parsedId = parseInt(id);
                const subcategory = subcategoriesToDisplay.find(sub => 
                    sub.allIds ? sub.allIds.includes(parsedId) : sub.id === parsedId
                );
                
                if (subcategory) {
                    selectedNames.add(subcategory.name);
                }
            }
            
            count += selectedNames.size;
        }
        
        if (searchParams.get('price_min') || searchParams.get('price_max')) count++;
        count += selectedAttributes.metal_types.length; 
        
        return count;
    };
    
    const activeFilterCount = getActiveFilterCount();
    const displayCategories = categories;
    
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
                    {displayCategories.map(category => (
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
            
            <div className={styles['filter-section']}>
                <h3>Subcategories</h3>
                <div className={styles['attribute-list']}>
                    {subcategoriesToDisplay.map(subcategory => {
                        const selectedSubcategoryIds = searchParams.get('subcategory_id')?.split(',').filter(Boolean) || [];
                        
                        const isSelected = subcategory.allIds ? 
                            subcategory.allIds.some(id => selectedSubcategoryIds.includes(id.toString())) :
                            selectedSubcategoryIds.includes(subcategory.id.toString());
                        
                        return (
                            <div 
                                key={subcategory.id}
                                className={`${styles['attribute-item']} ${isSelected ? styles['selected'] : ''}`}
                                onClick={() => handleSubcategoryChange(subcategory)}
                            >
                                <span className={styles['checkbox']}>
                                    {isSelected && <i className="fa-solid fa-check"></i>}
                                </span>
                                {subcategory.name}
                            </div>
                        );
                    })}
                </div>
            </div>
            
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
                    {availableColors.map(metal => (
                        <div 
                            key={metal.id}
                            className={`${styles['attribute-item']} ${selectedAttributes.metal_types.includes(metal.id) ? styles['selected'] : ''}`}
                            onClick={() => toggleAttribute('metal_types', metal.id)}
                            data-metal={metal.id}
                        >
                            <span className={styles['checkbox']}>
                                {selectedAttributes.metal_types.includes(metal.id) && <i className="fa-solid fa-check"></i>}
                            </span>
                            {metal.label}
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