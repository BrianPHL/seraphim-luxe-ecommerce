import styles from './Banner.module.css';

const Banner = ({ type, imageURL, externalStyles }) => {

    // type: header, carousel, hero
    // header: about us, our collections, FAQs, wishlist, cart, checkout, contact us, privacy policy
    // carousel: home page carousel component images
    // hero: sign in & sign up

    
    const imageAlt = `${ type.charAt(0).toUpperCase() + type.slice(1) } banner image.`;
    console.log(type, imageURL, imageAlt);
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
