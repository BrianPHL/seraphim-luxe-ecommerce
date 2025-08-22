import styles from './NotFound.module.css';
import { ReturnButton, Button } from '@components';
import { useNavigate } from 'react-router';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['header'] }>
                <ReturnButton />
                <h1>Looks like you've hit a roadblock!</h1>
            </div>
            <div className={ styles['info'] }>
                <div className={ styles['info-header'] }>
                    <h2>404</h2>
                    <h3>Looks Like You Took A Wrong Turn!</h3>
                </div>
                <p>The page you're looking for has ridden off into the sunset or taken a detour. Let's get you back on track.</p>
                <div className={ styles['ctas'] }>
                    <Button
                        type='primary'
                        label='Back Home'
                        action={ () => navigate('/') }
                    />
                    <Button
                        type='secondary'
                        label='Explore our Motorcycles'
                        action={ () => navigate('/motorcycles') }
                    />
                    <Button
                        type='secondary'
                        label='Explore our Parts & Accessories'
                        action={ () => navigate('/parts-and-accessories') }
                    />
                </div>
            </div>
        </div>
    );
};

export default NotFound;
