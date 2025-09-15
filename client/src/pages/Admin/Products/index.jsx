import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import styles from './Products.module.css';
import { Button, Modal, InputField, TableHeader, TableFooter } from '@components';
import { useProducts, useToast, useStocks, useCategories } from '@contexts';
import { useDataFilter, usePagination } from '@hooks';
import { PRODUCT_FILTER_CONFIG } from '@utils';

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

    // Initialize state from URL params ONLY - no bidirectional sync
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

    // These handlers manage BOTH state and URL updates in one place
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

    const handleOpenEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            label: product.label || '',
            price: product.price || '',
            category_id: product.category_id || '',
            subcategory_id: product.subcategory_id || '',
            description: product.description || '',
            stock_quantity: product.stock_quantity || '',
            stock_threshold: product.stock_threshold || '',
            image_url: product.image_url || ''
        });
        setImageFile(null);
        setImagePreview(null);
        if (product.image_url) {
            setImagePreview(`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}`);
        }
        setModalType('edit');
        setIsModalOpen(true);
    };

    const handleInputChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'category_id' && value) {
            fetchSubcategories(value);
            setFormData(prev => ({
                ...prev,
                subcategory_id: ''
            }));
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
        const activeSubcategories = getActiveSubcategories();
        
        const category = activeCategories.find(cat => cat.id === product.category_id);
        const subcategory = activeSubcategories.find(sub => sub.id === product.subcategory_id);
        
        const categoryName = category?.name || product.category || 'N/A';
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
                            value={formData.category_id}
                            onChange={(e) => handleInputChange('category_id', e.target.value)}
                        >
                            <option value="">Select Category</option>
                            {getActiveCategories().map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles['input-wrapper']}>
                        <label>Subcategory</label>
                        <select
                            value={formData.subcategory_id}
                            onChange={(e) => handleInputChange('subcategory_id', e.target.value)}
                            disabled={!formData.category_id}
                        >
                            <option value="">Select Subcategory</option>
                            {getActiveSubcategories()
                                .filter(sub => sub.category_id === parseInt(formData.category_id))
                                .map(subcategory => (
                                    <option key={subcategory.id} value={subcategory.id}>
                                        {subcategory.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className={styles['input-wrapper']}>
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Product description..."
                        />
                    </div>

                    <div className={styles['input-wrapper']}>
                        <label>Stock Quantity</label>
                        <InputField
                            type="number"
                            name="stock_quantity"
                            hint="Current stock quantity..."
                            value={formData.stock_quantity}
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
        </div>
    );
};

export default Products;
