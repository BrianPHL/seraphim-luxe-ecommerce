import styles from './Logo.module.css';
import { useNavigate } from 'react-router';
import { useTheme } from '@contexts';

const Logo = () => {

    const { theme } = useTheme();
    const navigate = useNavigate();

    return (
        <div className={ styles['logo'] } onClick={ () => navigate('/') }>
            <img className={ styles['logo-image'] } src={ `../../../assets/seraphim-luxe-logo-${ theme }.png` } alt={ `Seraphim Luxe logo for ${ theme } theme.` } />
            <div className={ styles['logo-text'] }>
                <h2 className={ styles['logo-text-left'] }>Seraphim</h2>
                <h2 className={ styles['logo-text-right'] }>Luxe</h2>
            </div>
        </div>
    );
};

export default Logo;
