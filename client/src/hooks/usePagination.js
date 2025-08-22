import { useState, useMemo, useEffect } from 'react';

const usePagination = (items, itemsPerPage = 10, initialPage = 1) => {

    const [currentPage, setCurrentPage] = useState(initialPage);

	useEffect(() => {
		setCurrentPage(initialPage);
	}, [initialPage]);

    const totalPages = useMemo(() => {
      return Math['max'](1, Math['ceil'](items['length'] / itemsPerPage));
    }, [items, itemsPerPage]);

    const currentItems = useMemo(() => {
      
        const startIndex = (currentPage - 1) * itemsPerPage;

        return items['slice'](startIndex, startIndex + itemsPerPage);
    
    }, [items, currentPage, itemsPerPage]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    } 

    const resetPagination = () => setCurrentPage(1);
    
    return { currentPage, totalPages, currentItems, handlePageChange, resetPagination };
  
};

export default usePagination;
