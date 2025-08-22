import { Button, ReturnButton } from '@components';
import styles from './AboutUs.module.css';

const AboutUs = () => {

    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['banner'] }></div>
            <div className={ styles['header'] }>
                <ReturnButton />
                <h1>About Seraphim Luxe</h1>
            </div>
            <div className={ styles['about'] }>
                <section className={ styles['info-section'] }>
                    <h2>Driven by Style, Fueled by Expression</h2>
                    <div className={ styles['divider'] }></div>
                    <p>At Seraphim Luxe, we believe that every accessory should be meaningful, versatile, and timeless. Whether you're expressing your daily style, making a statement, or seeking the perfect complement to your personality, our mission is to provide you with top-quality unisex jewelry and accessories to enhance your personal expression.</p>
                </section>
                <section className={ styles['info-section'] }>
                    <h2>Who We Are</h2>
                    <div className={ styles['divider'] }></div>
                    <p>Founded with a passion for inclusive fashion and a commitment to excellence, Seraphim Luxe has grown into a trusted name in the accessories industry. We cater to style enthusiasts of all preferences, offering a wide selection of unisex jewelry and premium accessories to ensure that your personal style shines at its best.</p>
                </section>
                <section className={ styles['info-section'] }>
                    <h2>Our Mission</h2>
                    <div className={ styles['divider'] }></div>
                    <p>We aim to bridge the gap between individuals and the best unisex accessories available. At Seraphim Luxe, we don't just sell accessories—we build connections, foster a community of style-conscious individuals, and ensure that every product meets the highest standards of quality and craftsmanship.</p>
                </section>
                <section className={ styles['info-section'] }>
                    <h2>Our Vision</h2>
                    <div className={ styles['divider'] }></div>
                    <p>At Seraphim Luxe, we envision a world where every individual has access to high-quality unisex accessories and jewelry, ensuring authentic self-expression and confidence in every moment. Our goal is to become the leading hub for style enthusiasts, setting the standard for inclusivity, innovation, and customer satisfaction.</p>
                </section>
            </div>

            <div className={ styles['meet-the-team'] }>
                <div className={ styles['header'] }>
                    <h2>Meet the Team</h2>
                    <div className={ styles['divider'] }></div>
                    <p>We are a team of style enthusiasts, designers, and customer support experts dedicated to giving you the best shopping experience possible. Every recommendation we make is backed by years of experience and a true passion for fashion and self-expression.</p>
                </div>
                <div className={ styles['container'] }>
                    <div className={ styles['card'] }>
                        <img src="" alt="" />
                        <div className={ styles['info'] }>
                            <h3>Pasco, Brian Lawrence C.</h3>
                            <h4>Full-stack Developer & UI/UX Designer</h4>
                        </div>
                    </div>
                    <div className={ styles['card'] }>
                        <img src="" alt="" />
                        <div className={ styles['info'] }>
                            <h3>Ramos, Gerald Elli T.</h3>
                            <h4>Leader & Front-end Developer</h4>
                        </div>
                    </div>
                    <div className={ styles['card'] }>
                        <img src="" alt="" />
                        <div className={ styles['info'] }>
                            <h3>Erandio, Cymon Railey A.</h3>
                            <h4>Front-end Developer</h4>
                        </div>
                    </div>
                    <div className={ styles['card'] }>
                        <img src="" alt="" />
                        <div className={ styles['info'] }>
                            <h3>Ganapin, Aidan</h3>
                            <h4>Front-end Developer</h4>
                        </div>
                    </div>
                    <div className={ styles['card'] }>
                        <img src="" alt="" />
                        <div className={ styles['info'] }>
                            <h3>Soliven, Sean Calvin</h3>
                            <h4>Front-end Developer</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;

