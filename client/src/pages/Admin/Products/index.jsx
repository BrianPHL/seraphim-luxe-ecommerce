import { useState } from 'react';
import { useSearchParams } from 'react-router';
import styles from './Products.module.css';
import { Button, Modal, InputField, TableHeader, TableFooter } from '@components';
import { useProducts, useToast, useStocks } from '@contexts';
import { useProductFilter, usePagination } from '@hooks';

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryPage = parseInt(searchParams.get('page') || '1', 10);
    const querySort = searchParams.get('sort') || 'Sort by: Price (Low to High)';
    const querySearch = searchParams.get('search') || '';
    const ITEMS_PER_PAGE = 10;

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
        category: '',
        subcategory: '',
        description: '',
        stock_quantity: '',
        stock_threshold: '',
        image_url: ''
    });

    const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
        const { lowStockProducts } = useStocks();
    const { showToast } = useToast();

    const {
        sortedProducts,
        currentSort,
        searchQuery,
        searchInput,
        handleSortChange: onSortChange,
        handleSearchChange,
        handleSearchSubmit,
        setSearchInput,
        setSearchQuery
    } = useProductFilter(products, null, querySort, querySearch);

    const {
        currentPage,
        totalPages,
        currentItems: paginatedProducts,
        handlePageChange,
        resetPagination
    } = usePagination(sortedProducts, ITEMS_PER_PAGE, queryPage);

    const updateSearchParams = ({ page, sort, search }) => {
        const params = new URLSearchParams(searchParams);

        if (page !== undefined) params.set('page', page);
        if (sort !== undefined) params.set('sort', sort);
        if (search !== undefined) params.set('search', search);

        setSearchParams(params);
    };

    const handleOpenDeleteModal = (product) => {
        setProductToDelete(product);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (productToDelete) {
            deleteProduct(productToDelete.product_id);
            setDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setProductToDelete(null);
    };

    const handleSortChange = (sort) => {
        onSortChange(sort);
        updateSearchParams({ sort, page: 1 });
    };

    const handleSearch = () => {
        handleSearchSubmit();
        updateSearchParams({ search: searchInput, page: 1 });
    };

    const handlePageChangeWrapped = (page) => {
        handlePageChange(page);
        updateSearchParams({ page });
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!validTypes.includes(file.type)) {
            showToast('Please select a valid image file (JPEG, PNG, GIF, or WEBP)', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image file must be smaller than 5MB', 'error');
            return;
        }

        setImageFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const uploadImage = async () => {
        if (!imageFile) return null;

        try {
            setIsUploadingImage(true);
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await fetch('/api/products/upload-image', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to upload image');
            }

            return data.image_url;
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast(`Failed to upload image: ${error.message}`, 'error');
            return null;
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleOpenAddModal = () => {
        setFormData({
            label: '',
            price: '',
            category: '',
            subcategory: '',
            description: '',
            stock_quantity: '0',
            stock_threshold: '5',
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
            label: product.label,
            price: product.price,
            category: product.category,
            subcategory: product.subcategory,
            description: product.description || '',
            stock_quantity: product.stock_quantity,
            stock_threshold: product.stock_threshold,
            image_url: product.image_url
        });
        setImageFile(null);
        setImagePreview(null);
        setModalType('edit');
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            let updatedFormData = { ...formData };
            
            if (imageFile) {
                const imageUrl = await uploadImage();
                if (imageUrl) {
                    updatedFormData.image_url = imageUrl;
                }
            }
            
            if (modalType === 'add') {
                await addProduct(updatedFormData);
            } else if (modalType === 'edit' && selectedProduct) {
                await updateProduct({
                    ...updatedFormData,
                    product_id: selectedProduct.product_id
                });
            }
            setIsModalOpen(false);
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

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
                    tableName="products"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    resultsLabel={`Showing ${paginatedProducts.length} out of ${sortedProducts.length} products`}
                    sortLabel={currentSort}
                    searchValue={searchInput}
                    onPageChange={handlePageChangeWrapped}
                    onSortChange={handleSortChange}
                    onSearchChange={handleSearchChange}
                    onSearchSubmit={handleSearch}
                />
                
                <div className={styles['table']}>
                    <div className={styles['table-wrapper']}>
                        <div className={styles['table-header']} style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                            <h3></h3>
                            <h3>product_id</h3>
                            <h3>label</h3>
                            <h3>category/subcategory</h3>
                            <h3>price</h3>
                            <h3>stock</h3>
                            <h3>modifed_at</h3>
                            <h3>actions</h3>
                        </div>
                        
                        {loading ? (
                            <div className={styles['empty-table']}>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            </div>
                        ) : paginatedProducts.length > 0 ? (
                            paginatedProducts.map(product => (
                                <div 
                                    key={product.product_id} 
                                    className={styles['table-rows']} 
                                    style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
                                >
                                    <div className={styles['table-cell']}>
                                        {product.image_url ? (
                                            <img 
                                                src={`https://res.cloudinary.com/dfvy7i4uc/image/upload/${product.image_url}`}
                                                alt={product.label}
                                            />
                                        ) : '—'}
                                    </div>
                                    <div className={styles['table-cell']}>{product.product_id}</div>
                                    <div className={styles['table-cell']}>{product.label}</div>
                                    <div className={styles['table-cell']}>
                                        {product.category} / {product.subcategory}
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
                                {searchQuery ? (
                                    <div className={styles['empty']}>
                                        <h3>No products found matching "{searchQuery}"</h3>
                                        <Button 
                                            type="secondary" 
                                            label="Clear Search" 
                                            action={() => {
                                                setSearchInput('');
                                                setSearchQuery('');
                                                resetPagination();
                                                updateSearchParams({ search: '', page: 1 });
                                            }}
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
                    resultsLabel={`Showing ${paginatedProducts.length} out of ${sortedProducts.length} products`}
                    sortLabel={currentSort}
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
                            name="category" 
                            value={formData.category}
                            onChange={handleInputChange}
                        >
                            <option value="">Select category</option>
                            <option value="motorcycles">Motorcycles</option>
                            <option value="parts">Parts</option>
                            <option value="accessories">Accessories</option>
                        </select>
                    </div>
                    
                    <div className={styles['input-wrapper']}>
                        <label>Subcategory</label>
                        <InputField
                            name="subcategory"
                            hint="The product subcategory..."
                            value={formData.subcategory}
                            onChange={handleInputChange}
                            isSubmittable={false}
                        />
                    </div>
                    
                    <div className={styles['input-wrapper']}>
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter description"
                        />
                    </div>
                    
                    <div className={styles['input-wrapper']}>
                        <label>Stock Quantity</label>
                        <InputField
                            type="number"
                            name="stock_quantity"
                            hint="Product stock quantity..."
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
                            hint="Product stock threshold..."
                            value={formData.stock_threshold}
                            onChange={handleInputChange}
                            isSubmittable={false}
                        />
                    </div>
                    
                    <div className={styles['input-wrapper']}>
                        <label>Product Image</label>
                        {/* Show current image or preview */}
                        {(imagePreview || formData.image_url) && (
                            <div className={styles['image-preview']}>
                                {isUploadingImage ? (
                                    <div style={{ display: 'grid', placeContent: 'center', height: '200px' }}>
                                        <i style={{ color: 'var(--accent-base)' }} className="fa-solid fa-spinner fa-spin"></i>
                                    </div>
                                ) : (
                                    <img 
                                        src={imagePreview || 
                                            (formData.image_url ? 
                                                `https://res.cloudinary.com/dfvy7i4uc/image/upload/${formData.image_url}` : 
                                                '')} 
                                        alt="Product preview" 
                                        style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }}
                                    />
                                )}
                            </div>
                        )}
                        
                        <InputField
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                            hint="Select product image..."
                            isSubmittable={false}
                        />
                        <p className={styles['upload-hint']}>
                            Recommended: Square image (1:1). Max size: 5MB. Formats: JPEG, PNG, GIF, WEBP
                        </p>

                    </div>
                </div>
                
                <div className={styles['modal-ctas']}>
                    <Button 
                        type="secondary" 
                        label="Cancel" 
                        action={() => {
                            setIsModalOpen(false);
                            setImageFile(null);
                            setImagePreview(null);
                        }} 
                    />
                    <Button 
                        type="primary" 
                        label={modalType === 'add' ? 'Add Product' : 'Save Changes'} 
                        action={handleSubmit}
                        disabled={isUploadingImage}
                    />
                </div>
            </Modal>

            <Modal 
                label='Product Deletion Confirmation' 
                isOpen={deleteModalOpen} 
                onClose={handleCancelDelete}
            >
                <p className={styles['modal-info']}>
                    Are you sure you want to delete <strong>{productToDelete?.label}</strong>? This action is irreversible!
                </p>
                <div className={styles['modal-ctas']}>
                    <Button
                        label='Cancel'
                        type='secondary'
                        action={handleCancelDelete}
                    />
                    <Button
                        label='Confirm'
                        type='primary'
                        action={handleConfirmDelete}
                        externalStyles={styles['modal-warn']}
                    />
                </div>
            </Modal>

        </div>
    );
};

export default Products;