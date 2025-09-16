import styles from './Logo.module.css';
import { useNavigate } from 'react-router';
import { useTheme } from '@contexts';

const Logo = () => {

    const { theme } = useTheme();
    const navigate = useNavigate();
    const logoImageUrl = theme === 'dark'
        ? 'https://res.cloudinary.com/dfvy7i4uc/image/upload/seraphim-luxe-logo-dark_ca5azw.png'
        : 'https://res.cloudinary.com/dfvy7i4uc/image/upload/seraphim-luxe-logo-light_emmoup.png'

    return (
        <div className={ styles['logo'] } onClick={ () => navigate('/') }>
            <img className={ styles['logo-image'] } src={ logoImageUrl } alt={ `Seraphim Luxe logo for ${ theme } theme.` } />
            <div className={ styles['logo-text'] }>
                <h2 className={ styles['logo-text-left'] }>Seraphim</h2>
                <h2 className={ styles['logo-text-right'] }>Luxe</h2>
            </div>
        </div>
    );
};

export default Logo;
