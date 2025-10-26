import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import styles from './Products.module.css';
import { Button, Modal, InputField, TableHeader, TableFooter } from '@components';
import { useProducts, useToast, useStocks, useCategories, useAnalytics } from '@contexts';
import { useDataFilter, usePagination } from '@hooks';
import { PRODUCT_FILTER_CONFIG } from '@utils';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ITEMS_PER_PAGE = 10;

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryPage = parseInt(searchParams.get('page') || '1', 10);
    const querySort = searchParams.get('sort') || 'Sort by: Name (A-Z)';
    const querySearch = searchParams.get('search') || '';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
    
    const { 
        fetchProductAnalytics,         
        getProductAnalyticsData,
        chartOptions,
        isLoading: analyticsLoading,    
        error: analyticsError           
    } = useAnalytics();

    const [analyticsProduct, setAnalyticsProduct] = useState(null);

    const [formData, setFormData] = useState({
        label: '',
        price: '',
        category_id: '',
        subcategory_id: '',
        description: '',
        stock_quantity: '',
        stock_threshold: '',
        image_url: ''
    });

    const { products, refreshProducts, loading, addProduct, updateProduct, deleteProduct, featureProduct } = useProducts();
    const { lowStockProducts } = useStocks();
    const { showToast } = useToast();
    const { 
        categories, 
        getActiveCategories, 
        getActiveSubcategories, 
        fetchSubcategories, 
        fetchCategories,
        getCategoryById 
    } = useCategories();

    const {
        data: filteredProducts,
        searchValue,
        sortValue,
        handleSearchChange,
        handleSortChange,
        sortOptions,
    } = useDataFilter(products || [], PRODUCT_FILTER_CONFIG);

    const {
        currentPage,
        totalPages,
        currentItems: paginatedProducts,
        handlePageChange,
        resetPagination,
    } = usePagination(filteredProducts, ITEMS_PER_PAGE, queryPage);

    const [categoriesLoaded, setCategoriesLoaded] = useState(false);
    const [selectedTimeRange, setSelectedTimeRange] = useState('All Time');

    useEffect(() => {
        const loadCategories = async () => {
            try {
                await fetchCategories();
                setCategoriesLoaded(true);
            } catch (error) {
                console.error('Failed to load categories:', error);
                showToast('Failed to load categories', 'error');
            }
        };

        loadCategories();
    }, []);

    useEffect(() => {
        if (searchValue !== querySearch) {
            handleSearchChange(querySearch);
        }
    }, [querySearch]);

    useEffect(() => {
        if (sortValue !== querySort) {
            handleSortChange(querySort);
        }
    }, [querySort]);

    useEffect(() => {
        if (currentPage !== queryPage) {
            handlePageChange(queryPage);
        }
    }, [queryPage]);

    const updateSearchParams = ({ page, sort, search }) => {
        const params = new URLSearchParams(searchParams);
        if (page !== undefined) params.set('page', page);
        if (sort !== undefined) params.set('sort', sort);
        if (search !== undefined) params.set('search', search);
        setSearchParams(params);
    };

    const handleSearchChangeWrapped = (value) => {
        handleSearchChange(value);
        resetPagination();
        updateSearchParams({ search: value, page: 1 });
    };

    const handleSortChangeWrapped = (sort) => {
        handleSortChange(sort);
        resetPagination();
        updateSearchParams({ sort, page: 1 });
    };

    const handlePageChangeWrapped = (page) => {
        handlePageChange(page);
        updateSearchParams({ page });
    };

    const handleSearch = () => {
        resetPagination();
        updateSearchParams({ search: searchValue, page: 1 });
    };

    const handleClearSearch = () => {
        handleSearchChange('');
        resetPagination();
        updateSearchParams({ search: '', page: 1 });
    };

    const handleOpenDeleteModal = (product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (productToDelete) {
            await deleteProduct(productToDelete.id);
            setDeleteModalOpen(false);
            setProductToDelete(null);
        }
        await refreshProducts();
    };

    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setProductToDelete(null);
    };

    const handleFeatureProduct = async (productId, isFeatured) => {
        await featureProduct(productId, isFeatured);
    };

    const handleOpenAddModal = () => {
        setFormData({
            label: '',
            price: '',
            category_id: '',
            subcategory_id: '',
            description: '',
            stock_quantity: '',
            stock_threshold: '',
            image_url: ''
        });
        setImageFile(null);
        setImagePreview(null);
        setModalType('add');
        setIsModalOpen(true);
    };

    const handleOpenAnalyticsModal = async (product, timeRange = 'All Time') => {
        setAnalyticsProduct(product);
        setSelectedTimeRange(timeRange);
        const productId = product.id || product.product_id;

        const days = timeRange === 'Last Week' ? 7 : timeRange === 'Last Month' ? 30 : null;
        const chartData = await fetchProductAnalytics(productId, days);

        setAnalyticsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            label: product.label || '',
            price: product.price || '',
            category_id: product.category_id || '',
            subcategory_id: product.subcategory_id || '',
            description: product.description || '',
            stock_quantity: product.stock_quantity !== undefined ? product.stock_quantity : '',
            stock_threshold: product.stock_threshold !== undefined ? product.stock_threshold : '',
            image_url: product.image_url || ''
        });
        setImageFile(null);
        setImagePreview(null);
        if (product.image_url) {
            setImagePreview(`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}`);
        }
        
        if (product.category_id) {
            fetchSubcategories(product.category_id);
        }
        
        setModalType('edit');
        setIsModalOpen(true);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = async (e) => {
        const categoryId = e.target.value;
        setFormData(prev => ({ 
            ...prev, 
            category_id: categoryId,
            subcategory_id: ''
        }));
        
        if (categoryId) {
            await fetchSubcategories(categoryId);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/products/upload-image', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const data = await response.json();
        return data.image_url;
    };

    const handleSubmit = async () => {
        try {
            setIsUploadingImage(true);
            
            let imageUrl = formData.image_url;
            
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            const productData = {
                ...formData,
                image_url: imageUrl,
                price: parseFloat(formData.price),
                stock_quantity: parseInt(formData.stock_quantity),
                stock_threshold: parseInt(formData.stock_threshold)
            };

            if (modalType === 'add') {
                await addProduct(productData);
            } else {
                await updateProduct(selectedProduct.id, productData);
            }

            setIsModalOpen(false);
            setFormData({
                label: '',
                price: '',
                category_id: '',
                subcategory_id: '',
                description: '',
                stock_quantity: '',
                stock_threshold: '',
                image_url: ''
            });
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            showToast(`Failed to ${modalType} product: ${error.message}`, 'error');
        } finally {
            await refreshProducts();
            setIsUploadingImage(false);
        }
    };

    const getCategoryDisplay = (product) => {
        const activeCategories = getActiveCategories();
        
        const category = activeCategories.find(cat => cat.id === product.category_id);
        const categoryName = category?.name || product.category || 'N/A';
        const activeSubcategories = getActiveSubcategories(product.category_id);
        const subcategory = activeSubcategories.find(sub => sub.id === product.subcategory_id);
        const subcategoryName = subcategory?.name || product.subcategory || 'N/A';
        
        return `${categoryName} / ${subcategoryName}`;
    };

    if (loading) {
        return (
            <div className={styles['wrapper']}>
                <div className={styles['section']}>
                    <div className={styles['empty-table']}>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <p>Loading products...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['wrapper']}>
            <div className={styles['section']}>
                <h2>Overview</h2>
                <div className={styles['overview']}>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Total Products</h3>
                        </div>
                        <h2>{products?.length || 0}</h2>
                    </div>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Out of Stock</h3>
                        </div>
                        <h2>{products?.filter(p => p.stock_quantity <= 0).length || 0}</h2>
                    </div>
                    <div className={styles['overview-item']}>
                        <div className={styles['overview-item-header']}>
                            <h3>Low Stock</h3>
                        </div>
                        <h2>{lowStockProducts?.length || 0}</h2>
                    </div>
                </div>
            </div>

            <div className={styles['section']}>
                <div className={styles['section-header']}>
                    <h2>Products</h2>
                    <Button
                        type="primary"
                        icon="fa-solid fa-plus"
                        iconPosition="left"
                        label="Add Product"
                        action={handleOpenAddModal}
                    />
                </div>
                
                <TableHeader
                    currentSort={sortValue}
                    searchInput={searchValue}
                    onSortChange={handleSortChangeWrapped}
                    onSearchChange={handleSearchChangeWrapped}
                    onSearch={handleSearch}
                    sortOptions={sortOptions}
                    withPagination={true}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedProducts.length} out of ${filteredProducts.length} results`}
                    sortLabel={sortValue}
                    onPageChange={handlePageChangeWrapped}
                />
                
                <div className={styles['table']}>
                    <div className={styles['table-wrapper']}>
                        <div className={styles['table-header']} style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}>
                            <h3></h3>
                            <h3></h3>
                            <h3>Product ID</h3>
                            <h3>Label</h3>
                            <h3>Category/Subcategory</h3>
                            <h3>Price</h3>
                            <h3>Stock</h3>
                            <h3>Modified At</h3>
                            <h3>Actions</h3>
                        </div>
                        
                        {!products ? (
                            <div className={styles['empty-table']}>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            </div>
                        ) : paginatedProducts.length > 0 ? (
                            paginatedProducts.map(product => (
                                <div 
                                    key={product.id} 
                                    className={styles['table-rows']} 
                                    style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}
                                >
                                    <div className={styles['table-cell']}>
                                        {product.image_url ? (
                                            <img 
                                                src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}`}
                                                alt={product.label}
                                            />
                                        ) : '—'}
                                    </div>
                                    <div className={styles['table-cell']} style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div className={styles['table-cell']}>
                                        {
                                            !product.is_featured ? (
                                                <Button
                                                    type="icon"
                                                    icon="fa-regular fa-star"
                                                    action={() => handleFeatureProduct(product.id, true) }
                                                    externalStyles={styles['featured-button']}
                                                    title="Feature product"
                                                />
                                            ) : (
                                                <Button
                                                    type="icon"
                                                    icon="fa-solid fa-star"
                                                    action={() => handleFeatureProduct(product.id, false) }
                                                    externalStyles={styles['featured-button']}
                                                    title="Un-feature product"
                                                />
                                            )
                                        }
                                        </div>
                                    </div>
                                    <div className={styles['table-cell']}>{product.id}</div>
                                    <div className={styles['table-cell']}>{product.label}</div>
                                    <div className={styles['table-cell']}>
                                        {getCategoryDisplay(product)}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        ₱{parseFloat(product.price).toLocaleString('en-PH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        <span className={
                                            product.stock_quantity <= 0 
                                                ? styles['stock-out'] 
                                                : product.stock_quantity <= product.stock_threshold 
                                                    ? styles['stock-low'] 
                                                    : styles['stock-ok']
                                        }>
                                            {product.stock_quantity}
                                        </span>
                                        &nbsp;/ {product.stock_threshold}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        {new Date(product.modified_at).toLocaleDateString()}
                                    </div>
                                    <div className={styles['table-cell']}>
                                        <Button
                                            type="icon"
                                            icon="fa-solid fa-chart-simple"
                                            action={() => handleOpenAnalyticsModal(product)}
                                        />
                                        <Button
                                            type="icon"
                                            icon="fa-solid fa-pen"
                                            action={() => handleOpenEditModal(product)}
                                        />
                                        <Button
                                            type="icon"
                                            icon="fa-solid fa-trash-can"
                                            action={() => handleOpenDeleteModal(product)}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles['empty-table']}>
                                {searchValue ? (
                                    <div className={styles['empty']}>
                                        <h3>No products found matching "{searchValue}"</h3>
                                        <Button 
                                            type="secondary" 
                                            label="Clear Search" 
                                            action={handleClearSearch}
                                        />
                                    </div>
                                ) : (
                                    <p>No products found</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <TableFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedProducts.length} out of ${filteredProducts.length} results`}
                    sortLabel={sortValue}
                    onPageChange={handlePageChangeWrapped}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                label={modalType === 'add' ? 'Add Product' : 'Edit Product'}
            >
                <div className={styles['inputs-container']}>
                    <div className={styles['input-wrapper']}>
                        <label>Product Name</label>
                        <InputField
                            name="label"
                            hint="The product label..."
                            value={formData.label}
                            onChange={handleInputChange}
                            isSubmittable={false}
                        />
                    </div>
                    
                    <div className={styles['input-wrapper']}>
                        <label>Price</label>
                        <InputField
                            type="number"
                            name="price"
                            hint="The product price..."
                            value={formData.price}
                            onChange={handleInputChange}
                            isSubmittable={false}
                        />
                    </div>

                    <div className={styles['input-wrapper']}>
                        <label>Category</label>
                        <select 
                            name="category_id" 
                            value={formData.category_id}
                            onChange={handleCategoryChange}
                        >
                            <option value="">Select category</option>
                            {getActiveCategories().map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className={styles['input-wrapper']}>
                        <label>Sub-category</label>
                        <select 
                            name="subcategory_id" 
                            value={formData.subcategory_id}
                            onChange={handleInputChange}
                            disabled={!formData.category_id}
                        >
                            <option value="">Select subcategory</option>
                            {formData.category_id && getActiveSubcategories(formData.category_id).map(subcategory => (
                                <option key={subcategory.id} value={subcategory.id}>
                                    {subcategory.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles['input-wrapper']}>
                        <label>Description</label>
                        <textarea
                            name='description'
                            value={formData.description}
                            onChange={ handleInputChange }
                            placeholder="Product description..."
                        />
                    </div>

                    <div className={styles['input-wrapper']}>
                        <label>Stock Quantity</label>
                        <InputField
                            type="number"
                            name="stock_quantity"
                            hint="Current stock quantity..."
                            value={ formData.stock_quantity }
                            onChange={handleInputChange}
                            isSubmittable={false}
                        />
                    </div>

                    <div className={styles['input-wrapper']}>
                        <label>Stock Threshold</label>
                        <InputField
                            type="number"
                            name="stock_threshold"
                            hint="Low stock warning threshold..."
                            value={formData.stock_threshold}
                            onChange={handleInputChange}
                            isSubmittable={false}
                        />
                    </div>

                    <div className={styles['input-wrapper']}>
                        <label>Product Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <div className={styles['image-preview']}>
                                <img src={imagePreview} alt="Preview" />
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles['modal-ctas']}>
                    <Button
                        type="secondary"
                        label="Cancel"
                        action={() => setIsModalOpen(false)}
                    />
                    <Button
                        type="primary"
                        label={isUploadingImage ? 'Uploading...' : (modalType === 'add' ? 'Add Product' : 'Update Product')}
                        action={handleSubmit}
                        disabled={isUploadingImage}
                    />
                </div>
            </Modal>

            <Modal
                isOpen={deleteModalOpen}
                onClose={handleCancelDelete}
                label="Delete Product"
            >
                {productToDelete && (
                    <>
                        <p className={styles['modal-info']}>
                            Are you sure you want to delete <strong>{productToDelete.label}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className={styles['modal-ctas']}>
                            <Button
                                type="secondary"
                                label="Cancel"
                                action={handleCancelDelete}
                            />
                            <Button
                                type="primary"
                                label="Delete"
                                action={handleConfirmDelete}
                                externalStyles={styles['modal-warn']}
                            />
                        </div>
                    </>
                )}
            </Modal>

            <Modal
                isOpen={analyticsModalOpen}
                onClose={() => setAnalyticsModalOpen(false)}
                label={`Sales Analytics: ${analyticsProduct?.label || ''}`}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Filter by Time Range:</h3>
                    <Button
                        id="time-range-dropdown"
                        type="secondary"
                        label={`Time Range: ${selectedTimeRange}`}
                        dropdownPosition="right"
                        options={[
                            {
                                label: 'Last Week',
                                action: async () => {
                                    await handleOpenAnalyticsModal(analyticsProduct, 'Last Week');
                                },
                            },
                            {
                                label: 'Last Month',
                                action: async () => {
                                    await handleOpenAnalyticsModal(analyticsProduct, 'Last Month');
                                },
                            },
                            {
                                label: 'All Time',
                                action: async () => {
                                    await handleOpenAnalyticsModal(analyticsProduct, 'All Time');
                                },
                            },
                        ]}
                    />
                </div>

                {analyticsLoading ? (
                    <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span style={{ marginLeft: '10px' }}>Loading analytics...</span>
                    </div>
                ) : analyticsError ? (
                    <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <i className="fa-solid fa-exclamation-triangle" style={{ color: '#dc3545', fontSize: '2rem' }}></i>
                            <p>Error loading analytics: {analyticsError}</p>
                            <button onClick={() => handleOpenAnalyticsModal(analyticsProduct, selectedTimeRange)}>
                                Retry
                            </button>
                        </div>
                    </div>
                ) : analyticsProduct ? (
                    <div style={{ minHeight: 300 }}>
                        <Line
                            data={getProductAnalyticsData(analyticsProduct.id || analyticsProduct.product_id) || { labels: [], datasets: [] }}
                            options={chartOptions}
                        />
                    </div>
                ) : (
                    <p>Loading analytics...</p>
                )}
            </Modal>
        </div>
    );
};

export default Products;
