import { useState, useMemo, useEffect } from 'react';

const useProductFilter = (allProducts, categoryFilter, initialSort, initialSearch) => {
	const [currentSort, setCurrentSort] = useState(initialSort || 'Sort by: Price (Low to High)');
	const [searchQuery, setSearchQuery] = useState(initialSearch || '');
	const [searchInput, setSearchInput] = useState(initialSearch || '');
	
	useEffect(() => {
		setCurrentSort(initialSort || 'Sort by: Price (Low to High)');
	}, [initialSort]);

	useEffect(() => {
		setSearchQuery(initialSearch || '');
		setSearchInput(initialSearch || '');
	}, [initialSearch]);  

	const categoryProducts = useMemo(() => {
		if (categoryFilter === 'Motorcycles') {
			return allProducts.filter(product => product.category === 'Motorcycles');
		} else {
			return allProducts.filter(product => product.category !== 'Motorcycles');
		}
	}, [allProducts, categoryFilter]);

	const filteredProducts = useMemo(() => {
		return categoryProducts.filter(product => 
			product.label.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}, [categoryProducts, searchQuery]);

	const sortedProducts = useMemo(() => {
		switch (currentSort) {
			case 'Sort by: Price (Low to High)':
				return [...filteredProducts].sort((a, b) =>
					Number(a.price.replace(/[^\d]/g, '')) - Number(b.price.replace(/[^\d]/g, ''))
				);
			case 'Sort by: Price (High to Low)':
				return [...filteredProducts].sort((a, b) =>
					Number(b.price.replace(/[^\d]/g, '')) - Number(a.price.replace(/[^\d]/g, ''))
				);
			case 'Name: A-Z':
				return [...filteredProducts].sort((a, b) => a.label.localeCompare(b.label));
			case 'Name: Z-A':
				return [...filteredProducts].sort((a, b) => b.label.localeCompare(a.label));
			default:
				return filteredProducts;
		}
	}, [ filteredProducts, currentSort] );

	const handleSortChange = (sort) => {
		setCurrentSort(sort);
	};

	const handleSearchChange = (event) => {
		setSearchInput(event.target.value);
	};

	const handleSearchSubmit = () => {
		setSearchQuery(searchInput);
	};

	return { sortedProducts, categoryProducts, currentSort, searchQuery, searchInput, handleSortChange, handleSearchChange, handleSearchSubmit, setSearchInput, setSearchQuery };
};

export default useProductFilter;
