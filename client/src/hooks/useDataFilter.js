import { useState, useEffect, useMemo } from 'react';

const useDataFilter = (allProducts, categoryFilter, initialSort, initialSearch) => {
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
			case 'Sort by: Popularity (Most Popular)':
				return [...filteredProducts].sort((a, b) => {
					const aPopularity = (a.views_count || 0) + (a.orders_count || 0) * 3; // Weight orders more than views
					const bPopularity = (b.views_count || 0) + (b.orders_count || 0) * 3;
					return bPopularity - aPopularity;
				});
			case 'Sort by: Popularity (Least Popular)':
				return [...filteredProducts].sort((a, b) => {
					const aPopularity = (a.views_count || 0) + (a.orders_count || 0) * 3;
					const bPopularity = (b.views_count || 0) + (b.orders_count || 0) * 3;
					return aPopularity - bPopularity;
				});
			case 'Sort by: Newest First':
				return [...filteredProducts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
			case 'Sort by: Oldest First':
				return [...filteredProducts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
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

export default useDataFilter;
