import styles from './Banner.module.css';

const Banner = ({ type, page, imageURL, externalStyles }) => {
    
    if (!page || !type) return;

    const imageAlt = `${ type.charAt(0).toUpperCase() + type.slice(1) } banner image.`;
    const imagePlaceholder = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';

    return (
        <img
            className={` ${ styles[`banner-${ type }`] } ${ externalStyles } `}
            src={ !imageURL ? imagePlaceholder : imageURL }
            alt={ type + " banner image." }
        />
    );

};

export default Banner;
