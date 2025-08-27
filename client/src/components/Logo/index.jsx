import styles from './Logo.module.css';
import { useNavigate } from 'react-router';

const Logo = () => {

    const navigate = useNavigate();

    return (
        <div className={ styles['logo'] } onClick={ () => navigate('/') }>
            <h2 className={ styles['logo-left'] }>Seraphim</h2>
            <h2 className={ styles['logo-right'] }>Luxe</h2>
        </div>
    );
};

export default Logo;
