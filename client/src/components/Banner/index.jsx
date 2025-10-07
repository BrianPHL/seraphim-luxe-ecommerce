import styles from './Banner.module.css';

const Banner = ({ data, externalStyles }) => {

    if (data.length === 0) return;

    const { page, type, image_url } = data[0];
    const imageAlt = `${ type.charAt(0).toUpperCase() + type.slice(1) } banner image.`;

    return (
        <img
            className={` ${ styles[`banner-${ type }`] } ${ externalStyles } `}
            src={ image_url }
            alt={ type + " banner image." }
        />
    );

};

export default Banner;
