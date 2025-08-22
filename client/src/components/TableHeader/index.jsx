import { Button, InputField } from '@components';
import styles from './TableHeader.module.css';

const TableHeader = ({ tableName, currentPage, totalPages, resultsLabel, sortLabel, searchValue, onPageChange, onSortChange, onSearchChange, onSearchSubmit }) => {

    if (tableName !== 'motorcycles' && tableName !== 'parts-and-accessories' && tableName !== 'products' && tableName !== 'reservations' && tableName !== 'installments') return null;
    if (currentPage === undefined || totalPages === undefined || !onPageChange) return null;

    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, startPage + 2);
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    const getSortOptions = () => {
        if (tableName === 'reservations') {
            return [
                {
                    label: 'Sort by: Latest',
                    action: () => { onSortChange('Sort by: Latest') },
                },
                {
                    label: 'Sort by: Oldest',
                    action: () => { onSortChange('Sort by: Oldest') },
                },
                {
                    label: 'Sort by: Status (Pending First)',
                    action: () => { onSortChange('Sort by: Status (Pending First)') },
                },
                {
                    label: 'Sort by: Status (Cancelled First)',
                    action: () => { onSortChange('Sort by: Status (Cancelled First)') },
                }
            ];
        } else if (tableName === 'installments') {
            return [
                {
                    label: 'Sort by: Latest',
                    action: () => { onSortChange('Sort by: Latest') },
                },
                {
                    label: 'Sort by: Oldest',
                    action: () => { onSortChange('Sort by: Oldest') },
                },
                {
                    label: 'Sort by: Amount (High to Low)',
                    action: () => { onSortChange('Sort by: Amount (High to Low)') },
                },
                {
                    label: 'Sort by: Amount (Low to High)',
                    action: () => { onSortChange('Sort by: Amount (Low to High)') },
                }
            ];
        }

        return [
            {
                label: 'Sort by: Price (Low to High)',
                action: () => { onSortChange('Sort by: Price (Low to High)') },
            },
            {
                label: 'Sort by: Price (High to Low)',
                action: () => { onSortChange('Sort by: Price (High to Low)') },
            },
            {
                label: 'Name: A-Z',
                action: () => { onSortChange('Name: A-Z') },
            },
            {
                label: 'Name: Z-A',
                action: () => { onSortChange('Name: Z-A') },
            }
        ];
    };

    const getSearchPlaceholder = () => {
        switch (tableName) {
            case 'reservations':
                return 'Search for reservations...';
            case 'motorcycles':
                return 'Search for motorcycles...';
            case 'products':
                return 'Search for products...';
            case 'installments':
                return 'Search installment requests...';
            default:
                return 'Search for parts & accessories...';
        }
    };

    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['top'] }>
                <Button
                    id='sort-by-dropdown'
                    label='Sort by'
                    type='secondary'
                    options={getSortOptions()}
                />
                <InputField
                    hint={getSearchPlaceholder()}
                    type='text'
                    onChange={onSearchChange}
                    action={onSearchSubmit}
                    isSubmittable={true}
                    value={searchValue}
                />
            </div>
            <div className={ styles['divider'] }></div>
            <div className={ styles['bottom'] }>
                <div className={ styles['info'] }>
                    <h3>{resultsLabel}</h3>
                    <h3>{sortLabel}</h3>
                </div>
                <div className={ styles['pagination'] }>
                    <Button
                        type="icon-outlined"
                        action={ () => onPageChange(currentPage - 1) }
                        icon="fa-solid fa-angle-left"
                        disabled={ currentPage === 1 }
                    />
                    { pageNumbers.map(page => (
                        <Button
                            key={ page }
                            type='secondary'
                            label={ String(page) }
                            action={ () => onPageChange(page) }
                            isActive={ currentPage === page }
                        />
                    ))}
                    <Button
                        type="icon-outlined"
                        action={ () => onPageChange(currentPage + 1) }
                        icon="fa-solid fa-angle-right"
                        disabled={ currentPage === totalPages }
                    />
                </div>
            </div>
        </div>
    );
};

export default TableHeader;
