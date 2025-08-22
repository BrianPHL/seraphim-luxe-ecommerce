import { Children, useEffect, useRef, useState } from 'react';
import { Button } from '@components';
import styles from './Carousel.module.css';

const Carousel = ({ children }) => {

    const [ activeIndex, setActiveIndex ] = useState(0);
    const [ isHovering, setIsHovering ] = useState(false);
    const autoPlayRef = useRef(null);
    const childrenArray = Children.toArray(children);
    const childCount = childrenArray['length'];

    const nextSlide = () => {
        setActiveIndex((prev) => (prev === childCount - 1 ? 0 : prev + 1));
    }

    const prevSlide = () => {
        setActiveIndex((prev) => (prev === 0 ? childCount - 1 : prev - 1));
    }

    const goToSlide = (index) => {
        setActiveIndex(index);
    }

    useEffect(() => {
        if (!isHovering && childCount > 1) {
            autoPlayRef['current'] = setInterval(nextSlide, 5000);
        }
        return () => {
            if (autoPlayRef['current']) clearInterval(autoPlayRef['current'])
        }
    }, [ isHovering, childCount ]);

    if (childCount === 0) return null;

    if (childCount === 1) return children;

    return (
        <div
            className={ styles['carousel'] }
            onMouseEnter={ () => setIsHovering(true) }
            onMouseLeave={ () => setIsHovering(false) }
        >
            { childrenArray.map((child, index) => (
                <div
                    key={index}
                    className={` ${ index === 0 ? styles['carousel-slide-first'] : styles['carousel-slide'] } 
                        ${ index === activeIndex ? styles['carousel-slide-active'] : null }
                    `}
                    style={{ transform: `translateX(${(index - activeIndex) * 100}%)` }}
                >
                    { child }
                </div>
            ))}
            { childCount > 1 && (
                <>
                    { isHovering && (
                        <>
                            <Button
                                type='icon-outlined'
                                icon='fa-solid fa-chevron-left'
                                action={ prevSlide }
                                externalStyles={ styles['carousel-prev_btn'] }
                            />
                            <Button
                                type='icon-outlined'
                                icon='fa-solid fa-chevron-right'
                                action={ nextSlide }
                                externalStyles={ styles['carousel-next_btn'] }
                            />
                        </>
                    )}
                    <div className={ styles['carousel-page_indicators'] }>
                        { childrenArray.map((_, index) => (
                            <button
                                key={ index }
                                className={`${ styles['carousel-page_indicator'] } ${ index === activeIndex ? styles['carousel-page_indicator-active'] : null }`}
                                onClick={ () => goToSlide(index) }
                                aria-label={ `Go to slide ${index + 1}` }
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Carousel;
