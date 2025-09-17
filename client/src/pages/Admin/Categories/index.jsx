import { useState } from 'react';
import styles from './Categories.module.css';
import { Button, Modal, InputField } from '@components';
import { useCategories } from '@contexts';

const Categories = () => {

    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ modalType, setModalType ] = useState('');
    const [ selectedItem, setSelectedItem ] = useState(null);
    const [ activeTab, setActiveTab ] = useState('categories');
    const [ selectedCategory, setSelectedCategory ] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sort_order: 0,
        is_active: true
    });
    const {
        categories,
        subcategories,
        loading,
        fetchSubcategories,
        createCategory,
        createSubcategory,
        updateCategory,
        updateSubcategory,
        deleteCategory,
        deleteSubcategory,
        getSubcategoriesByCategory
    } = useCategories();

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const openModal = (type, item = null, category = null) => {
        
        setModalType(type);
        setSelectedItem(item);
        
        if (category !== null) {
            setSelectedCategory(category);
        }
        
        if (item) {
            setFormData({
                name: item.name,
                description: item.description || '',
                sort_order: item.sort_order,
                is_active: item.is_active
            });
        } else {
            setFormData({
                name: '',
                description: '',
                sort_order: 0,
                is_active: true
            });
        }
        
        setIsModalOpen(true);
    };
    
    const handleSubmit = async () => {
        try {
            switch (modalType) {
                case 'add-category':
                    await createCategory(formData);
                    break;
                case 'edit-category':
                    await updateCategory(selectedItem.id, formData);
                    break;
                case 'add-subcategory':
                    await createSubcategory(selectedCategory.id, formData);
                    await fetchSubcategories(selectedCategory.id);
                    break;
                case 'edit-subcategory':
                    await updateSubcategory(selectedItem.id, formData);
                    await fetchSubcategories(selectedCategory.id);
                    break;
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error("Admin Categories page handleSubmit function error: ", err);
        }
    };

    const handleDelete = async (type, item) => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        
        try {
            if (type === 'category') {
                await deleteCategory(item.id);
            } else {
                await deleteSubcategory(item.id);
            }
        } catch (err) {
            console.error("Admin Categories page handleDelete function error: ", err);
        }
    };

    const viewSubcategories = async (category) => {
        setSelectedCategory(category);
        setActiveTab('subcategories');
        await fetchSubcategories(category.id);
    };

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.loading}>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>

            {activeTab === 'categories' && (
                <div className={styles.section}>
                    <div className={styles.header}>
                        <h2>Categories</h2>
                        <Button
                            type="primary"
                            icon="fa-solid fa-plus"
                            iconPosition="left"
                            label="Add Category"
                            action={() => openModal('add-category')}
                        />
                    </div>

                    { !categories
                        ? <div className={ styles['grid-container'] }>
                            <h2>No categories available.</h2>
                        </div>
                        : <div className={ styles['grid'] }>
                            { categories.map(category => (
                                <div key={category.id} className={styles.card}>
                                    <div className={styles.cardContent}>
                                        <h3>{category.name}</h3>
                                        <p>{category.product_count} products</p>
                                        {!category.is_active && <span className={styles.inactive}>Inactive</span>}
                                    </div>
                                    <div className={ styles['divider'] }></div>
                                    <div className={styles.cardActions}>
                                        <Button type="secondary" label="View" iconPosition="left" icon="fa-solid fa-folder-open" action={() => viewSubcategories(category)} />
                                        <Button type="secondary" label="Add Subcategory" iconPosition="left" icon="fa-solid fa-plus" action={() => openModal('add-subcategory', null, category)} />
                                        <Button type="secondary" label="Edit" iconPosition="left" icon="fa-solid fa-pen" action={() => openModal('edit-category', category)} />
                                        <Button type="secondary" label="Delete" iconPosition="left" icon="fa-solid fa-trash" action={() => handleDelete('category', category)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            )}

            {activeTab === 'subcategories' && selectedCategory && (
                <div className={styles.section}>
                    <div className={styles.header}>
                        <div>
                            <Button
                                type="icon-outlined"
                                icon="fa-solid fa-arrow-left"
                                action={() => setActiveTab('categories')}
                            />
                            <h2>{selectedCategory.name} Subcategories</h2>
                        </div>
                        <Button
                            type="primary"
                            label="Add Subcategory"
                            icon="fa-solid fa-plus"
                            iconPosition="left"
                            action={() => openModal('add-subcategory', null, selectedCategory)}
                        />
                    </div>

                    
                    { getSubcategoriesByCategory(selectedCategory.id).length === 0
                        ? <div className={ styles['grid-container'] }>
                            <h2>No subcategories available under this category.</h2>
                        </div>
                        : 
                        <div className={styles.grid}>
                        { getSubcategoriesByCategory(selectedCategory.id).map(subcategory => (
                            <div key={subcategory.id} className={styles.card}>
                                <div className={styles.cardContent}>
                                    <h3>{subcategory.name}</h3>
                                    <p>{subcategory.product_count} products</p>
                                    {!subcategory.is_active && <span className={styles.inactive}>Inactive</span>}
                                </div>
                                <div className={styles.cardActions}>
                                    <Button type="secondary" label="Edit" iconPosition="left" icon="fa-solid fa-pen" action={() => openModal('edit-subcategory', subcategory)} />
                                    <Button type="secondary" label="Delete" iconPosition="left" icon="fa-solid fa-trash" action={() => handleDelete('subcategory', subcategory)} />
                                </div>
                            </div>
                        ))}
                        </div>
                    }
                    </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} label={getModalTitle()}>
                <div className={styles.form}>
                    <InputField
                        name="name"
                        hint="Name..."
                        value={formData.name}
                        onChange={handleInputChange}
                        isSubmittable={false}
                    />
                    
                    <textarea
                        name="description"
                        placeholder="Description (optional)..."
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                    />
                    
                    <InputField
                        type="number"
                        name="sort_order"
                        hint="Sort order..."
                        value={formData.sort_order}
                        onChange={handleInputChange}
                        isSubmittable={false}
                    />
                    
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                        />
                        Active
                    </label>
                </div>

                <div className={styles.modalActions}>
                    <Button type="secondary" label="Cancel" action={() => setIsModalOpen(false)} />
                    <Button type="primary" label="Save" action={handleSubmit} disabled={!formData.name.trim()} />
                </div>
            </Modal>
        </div>
    );

    function getModalTitle() {
        switch (modalType) {
            case 'add-category': return 'Add Category';
            case 'edit-category': return 'Edit Category';
            case 'add-subcategory': return 'Add Subcategory';
            case 'edit-subcategory': return 'Edit Subcategory';
            default: return 'Modal';
        }
    }
};

export default Categories;
