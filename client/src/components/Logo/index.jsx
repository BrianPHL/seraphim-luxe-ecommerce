import styles from './Logo.module.css';
import { useNavigate } from 'react-router';

const Logo = () => {

    const navigate = useNavigate();

    return (
        <div className={ styles['logo'] } onClick={ () =>  navigate('/') }>
            <h1 className={ styles['left'] }>MOTO</h1>
            <h2 className={ styles['right'] }>SWIFT</h2>
        </div>
    );
};

export default Logo;
