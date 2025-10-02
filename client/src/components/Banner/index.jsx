import styles from './Banner.module.css';

const Banner = ({ type, imageURL, externalStyles }) => {

    // type: header, carousel, hero
    // header: about us, our collections, FAQs, wishlist, cart, checkout, contact us, privacy policy
    // carousel: home page carousel component images
    // hero: sign in & sign up

    
    const imageAlt = `${ type.charAt(0).toUpperCase() + type.slice(1) } banner image.`;
    console.log(type, imageURL, imageAlt);

    return (
        <img
            className={` ${ styles[`banner-${ type }`] } ${ externalStyles } `}
            src={ imageURL }
            alt={ type + " banner image." }
        />
    );

};

export default Banner;
