import { Button } from '@components';
import styles from './TableFooter.module.css';

const TableFooter = ({ currentPage, totalPages, resultsLabel, sortLabel, onPageChange }) => {
    
    const pageNumbers = [];
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, startPage + 2);
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    return(
        <div className={ styles['wrapper'] }>
            <div className={ styles['info'] }>
                <h3>{ resultsLabel }</h3>
                <h3>{ sortLabel }</h3>
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
    );
};

export default TableFooter;
