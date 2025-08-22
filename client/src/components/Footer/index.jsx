import { Logo, Button, InputField, Anchor } from '@components';
import styles from './Footer.module.css';

const Footer = () => {

    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['top'] }>
                <div className={ styles['top-left'] }>
                    <div className={ styles['top-left-links'] }>
                        <h3>Quick Links</h3>
                        <nav>
                            <Anchor
                                label="Home"
                                link="/"
                                isNested={ false }
                            />
                            <Anchor
                                label="Motorcycles"
                                link="/motorcycles"
                                isNested={ false }
                            />
                            <Anchor
                                label="Parts & Accessories"
                                link="/parts-and-accessories"
                                isNested={ false }
                            />
                            <Anchor
                                label="My Account"
                                link="/my-account"
                                isNested={ false }
                            />
                        </nav>
                    </div>
                    <div className={ styles['top-left-links'] }>
                        <h3>Company</h3>
                        <nav>
                            <Anchor
                                label="About us"
                                link="/about-us"
                                isNested={ false }
                            />
                            <Anchor
                                label="contact@seraphim-luxe.com"
                                link="#"
                                isNested={ false }
                            />
                        </nav>
                    </div>
                    <div className={ styles['top-left-links'] }>
                        <h3>Legal</h3>
                        <nav>
                            <Anchor
                                label="Terms & Conditions"
                                link="/terms-and-conditions"
                                isNested={ false }
                            />
                            <Anchor
                                label="Privacy Policy"
                                link="privacy-policy"
                                isNested={ false }
                            />
                        </nav>
                    </div>    
                </div>
                <div className={ styles['top-right'] }>
                    <div className={ styles['newsletter'] }>
                        <div className={ styles['newsletter-header'] }>
                            <h2>Stay Updated</h2>
                            <h3>Get the latest Seraphim Luxe updates delivered to your inbox.</h3>
                        </div>
                        <InputField
                            hint="Your email address..."
                            type="email"
                            icon="fa-solid fa-paper-plane"
                            action={ () => {} }
                            isSubmittable={ false }
                        />
                    </div>
                    <div className={ styles['socials'] }>
                        <Button
                            type='icon-outlined'
                            icon='fa-brands fa-facebook'
                            action={ () => { window.location.href = "https://www.facebook.com" } }
                        />
                        <Button
                            type='icon-outlined'
                            icon='fa-brands fa-x-twitter'
                            action={ () => { window.location.href = "https://www.facebook.com" } }
                        />
                        <Button
                            type='icon-outlined'
                            icon='fa-brands fa-instagram'
                            action={ () => { window.location.href = "https://www.facebook.com" } }
                        />
                    </div>
                </div>
            </div>
            <span className={ styles['divider'] } />
            <div className={ styles['bottom'] }>
                <div className={ styles['bottom-left'] }>
                    <h5>© 2025 Seraphim Luxe. All rights reserved.</h5>
                    <h5>Designed in <span className={ styles['link'] } onClick={ () => { window.location.href = "https://www.figma.com" } }>Figma</span>, built with <span className={ styles['link'] } onClick={ () => { window.location.href = "https://www.react.dev" } }>React.js</span>, running on <span className={ styles['link'] } onClick={ () => { window.location.href = "https://www.railway.com" } }>Railway</span>.</h5>
                </div>
                <div className={ styles['bottom-right'] }>
                    <Logo />  
                    <h3>Style Without Boundaries</h3>
                </div>
            </div>
        </div>  
    );
}

export default Footer;