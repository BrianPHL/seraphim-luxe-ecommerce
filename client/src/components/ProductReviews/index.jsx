import { useState, useEffect } from 'react';
import { useToast} from '@contexts';
import { Button, InputField, Modal } from '@components';
import styles from './ProductReviews.module.css';


const ProductReviews = ({
    productId,
    productName = '',
    currentUserId = null,
    initialReviews = [],
    initialStats = { averageRating: 0, totalReviews: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
    canUserReview = false,
    onStatsUpdate = null
}) => {
    
    const [reviews, setReviews] = useState(initialReviews);
    const [reviewStats, setReviewStats] = useState(initialStats);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [filterBy, setFilterBy] = useState('all');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ rating: 0, review_title: '', review_text: '' });
    const [formErrors, setFormErrors] = useState({});
    const [userHelpfulVotes, setUserHelpfulVotes] = useState([]);
    const { showToast } = useToast();

    const StarRating = ({ value = 0, onChange = null, readOnly = false, size = 'medium', showValue = false }) => {
        const [hoverValue, setHoverValue] = useState(0);
        const isInteractive = !readOnly && onChange;
        const displayValue = hoverValue || value;

        return (
            <div className={`${styles['star-rating']} ${styles[`star-${size}`]} ${isInteractive ? styles['interactive'] : ''}`}>
                <div className={styles['stars-container']}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`${styles['star']} ${star <= displayValue ? styles['filled'] : styles['empty']}`}
                            onClick={() => isInteractive && onChange(star)}
                            onMouseEnter={() => isInteractive && setHoverValue(star)}
                            onMouseLeave={() => isInteractive && setHoverValue(0)}
                            disabled={!isInteractive}
                            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                        >
                            <i className={star <= displayValue ? 'fa-solid fa-star' : 'fa-regular fa-star'}></i>
                        </button>
                    ))}
                </div>
                {showValue && <span className={styles['rating-value']}>{value.toFixed(1)}</span>}
            </div>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const safeString = dateString.replace(/-/g, '/').replace('T', ' ').replace('Z', '');
        const date = new Date(safeString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const sortReviews = (reviews, sortType) => {
        const sortedReviews = [...reviews];
        switch (sortType) {
            case 'newest': return sortedReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case 'oldest': return sortedReviews.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case 'highest': return sortedReviews.sort((a, b) => b.rating - a.rating);
            case 'lowest': return sortedReviews.sort((a, b) => a.rating - b.rating);
            case 'helpful': return sortedReviews.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
            default: return sortedReviews;
        }
    };

    const filterReviews = (reviews, filterType) => {
        if (filterType === 'all') return reviews;
        return reviews.filter(review => review.rating === parseInt(filterType));
    };

    const validateForm = () => {
        const newErrors = {};
        if (formData.rating === 0) newErrors.rating = 'Please select a rating';
        if (formData.review_text.length < 10) newErrors.review_text = 'Review must be at least 10 characters long';
        if (formData.review_text.length > 2000) newErrors.review_text = 'Review must be less than 2000 characters';
        if (formData.review_title.length > 100) newErrors.review_title = 'Title must be less than 100 characters';
        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const processedReviews = sortReviews(filterReviews(reviews, filterBy), sortBy);

    useEffect(() => {
        if (!productId) return;
        setLoading(true);
        fetch(`/api/reviews/${productId}?user_id=${currentUserId}`)
            .then(res => res.json())
            .then(data => {
                setReviews(data.reviews || []);
                setUserHelpfulVotes(data.userHelpfulVotes || []);
                const stats = {
                    averageRating: Number(data.average) || 0,
                    totalReviews: data.reviews?.length || 0,
                    ratingDistribution: data.reviews?.reduce((acc, r) => {
                        acc[r.rating] = (acc[r.rating] || 0) + 1;
                        return acc;
                    }, { 1:0, 2:0, 3:0, 4:0, 5:0 }) || { 1:0, 2:0, 3:0, 4:0, 5:0 }
                };
                setReviewStats(stats);
                if (typeof onStatsUpdate === 'function') {
                    onStatsUpdate({
                        averageRating: stats.averageRating,
                        totalReviews: stats.totalReviews
                    });
                }
                setLoading(false);
            });
    }, [productId]);

    const handleSubmitReview = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: productId,
                user_id: currentUserId,
                rating: formData.rating,
                review_text: formData.review_text,
                review_title: formData.review_title
            })
        })
        .then(res => res.json())
        .then(() => {
            setShowReviewModal(false);
            setFormData({ rating: 0, review_title: '', review_text: '' });
            return fetch(`/api/reviews/${productId}?user_id=${currentUserId}`).then(res => res.json());
        })
        .then(data => {
            setReviews(data.reviews || []);
            const stats = {
                averageRating: Number(data.average) || 0,
                totalReviews: data.reviews?.length || 0,
                ratingDistribution: data.reviews?.reduce((acc, r) => {
                    acc[r.rating] = (acc[r.rating] || 0) + 1;
                    return acc;
                }, { 1:0, 2:0, 3:0, 4:0, 5:0 }) || { 1:0, 2:0, 3:0, 4:0, 5:0 }
            };
            setReviewStats(stats);
            if (typeof onStatsUpdate === 'function') {
                onStatsUpdate({
                    averageRating: stats.averageRating,
                    totalReviews: stats.totalReviews
                });
            }
            setLoading(false);
        });
    };

    const handleMarkHelpful = (reviewId) => {
        if (!currentUserId) {
            showToast('Please sign in to mark reviews as helpful.','error');
            return;
        }
        if (userHelpfulVotes.includes(reviewId)) return;

        fetch('/api/reviews/helpful', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ review_id: reviewId, user_id: currentUserId })
        })
        .then(res => res.json())
        .then((data) => {
            if (data.success) {
                setReviews(prev =>
                    prev.map(r =>
                        r.id === reviewId
                            ? { ...r, helpful_count: (r.helpful_count || 0) + 1 }
                            : r
                    )
                );
                setUserHelpfulVotes(prev => [...prev, reviewId]);
            }
        });
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleOpenReviewModal = () => setShowReviewModal(true);
    
    const handleCloseReviewModal = () => {
        setShowReviewModal(false);
        setFormData({ rating: 0, review_title: '', review_text: '' });
        setFormErrors({});
    };

    const ReviewSummary = () => (
        <div className={styles['review-summary-row']}>
            <div className={styles['summary-left']}>
                <div className={styles['summary-stars-row']}>
                    {[...Array(5)].map((_, i) => (
                        <i
                            key={i}
                            className={`fa-solid fa-star ${i < Math.round(reviewStats.averageRating) ? styles['filled-star'] : styles['empty-star']}`}
                        ></i>
                    ))}
                    <span className={styles['summary-average']}>
                        <u>{Number(reviewStats.averageRating).toFixed(2)}</u>
                    </span>
                </div>
                <div className={styles['summary-count-below']}>
                    {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}
                </div>
            </div>
            <div className={styles['summary-center']}>
                <h3 className={styles['summary-title']}>Reviews</h3>
                <div className={styles['summary-bars']}>
                    {[5,4,3,2,1].map(rating => {
                        const count = reviewStats.ratingDistribution[rating] || 0;
                        const percent = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                        return (
                            <div key={rating} className={styles['summary-bar-row']}>
                                <span className={styles['summary-bar-stars']}>
                                    {[...Array(rating)].map((_,i) => <i key={i} className={`fa-solid fa-star ${styles['summary-bar-star']}`}></i>)}
                                </span>
                                <div className={styles['summary-bar-bg']}>
                                    <div className={styles['summary-bar-fill']} style={{width: percent + '%'}}></div>
                                </div>
                                <span className={styles['summary-bar-count']}>{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className={styles['summary-right']}>
                {canUserReview && !showReviewModal && (
                    <Button
                        type="primary"
                        label="Write a review"
                        action={handleOpenReviewModal}
                        externalStyles={styles['summary-write-btn']}
                    />
                )}
            </div>
        </div>
    );

    const ReviewCard = ({ review }) => {
        const maxLength = 300;
        const [showFullText, setShowFullText] = useState(false);
        const isLongReview = review.review_text && review.review_text.length > maxLength;
        const displayText = showFullText || !isLongReview 
            ? review.review_text 
            : review.review_text?.substring(0, maxLength) + '...';
        const voted = userHelpfulVotes.includes(review.id);

        return (
            <div className={styles['review-card']}>
                <div className={styles['review-header']}>
                    <div className={styles['reviewer-info']}>
                        <span className={styles['reviewer-initial']}>
                            {(review.reviewer_name || 'A').charAt(0).toUpperCase()
                        }</span>
                        <span>
                            <span className={styles['reviewer-name']}>
                                {review.reviewer_name || 'Anonymous'}
                            </span>
                            <span className={styles['review-date']}>
                                {formatDate(review.created_at)}
                            </span>
                        </span>
                        <span className={styles['reviewer-stars']}>
                            {[...Array(5)].map((_, i) => (
                                <i
                                    key={i}
                                    className={`fa-solid fa-star ${i < review.rating ? styles['filled-star'] : styles['empty-star']}`}
                                ></i>
                            ))}
                        </span>
                    </div>
                </div>
                {review.review_title && <h6 className={styles['review-title']}>{review.review_title}</h6>}
                {review.review_text && (
                    <div className={styles['review-content']}>
                        <p className={styles['review-text']}>{displayText}</p>
                        {isLongReview && (
                            <button className={styles['read-more-button']} onClick={() => setShowFullText(!showFullText)}>
                                {showFullText ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </div>
                )}
                <div className={styles['review-footer']}>
                    <button
                        className={`${styles['helpful-button']} ${voted ? styles['voted-button'] : ''}`}
                        onClick={() => handleMarkHelpful(review.id)}
                        disabled={voted || !currentUserId} 
                    >
                        <i className="fa-solid fa-thumbs-up"></i>
                        Helpful ({review.helpful_count || 0})
                        {voted && <span className={styles['voted-text']}>Voted</span>}
                    </button>
                </div>
            </div>
        );
    };

    const reviewsToShow = reviews.length > 0 ? processedReviews : [];

    return (
        <div className={styles['product-reviews']}>
            <ReviewSummary />
            
            {/* Filter & Sort Controls */}
            <div className={styles['reviews-controls-row']}>
                {/* Filter by rating */}
                <div className={styles['filter-controls-group']}>
                    <span className={styles['filter-label']}>Filter by rating:</span>
                    <button
                        className={filterBy === 'all' ? styles['filter-active'] : styles['filter-btn']}
                        onClick={() => setFilterBy('all')}
                    >
                        All
                    </button>
                    {[5,4,3,2,1].map(rating => (
                        <button
                            key={rating}
                            className={filterBy === String(rating) ? styles['filter-active'] : styles['filter-btn']}
                            onClick={() => setFilterBy(String(rating))}
                        >
                            {[...Array(rating)].map((_,i) => (
                                <i key={i} className={`fa-solid fa-star ${styles['filter-star']}`}></i>
                            ))}
                            
                        </button>
                    ))}
                </div>
                
                {/* Sort by */}
                <div className={styles['sort-controls-group']}>
                    <span className={styles['sort-label']}>Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className={styles['sort-select']}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                        <option value="helpful">Most Helpful</option>
                    </select>
                </div>
            </div>
            
            {/* Review Form Modal */}
            <Modal
                isOpen={showReviewModal}
                onClose={handleCloseReviewModal}
                label="Write a Review"
            >
                <div className={styles['review-form-container']}>
                    <div className={styles['form-header']}>
                        <h4 className={styles['form-title']}>Write a Review</h4>
                        {productName && <p className={styles['product-name']}>for {productName}</p>}
                    </div>
                    <form onSubmit={handleSubmitReview}>
                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>
                                Rating <span className={styles['required']}>*</span>
                            </label>
                            <div className={styles['rating-input']}>
                                <StarRating
                                    value={formData.rating}
                                    onChange={(rating) => handleInputChange('rating', rating)}
                                    size="large"
                                />
                                <span className={styles['rating-text']}>
                                    {formData.rating > 0 && (
                                        <>
                                            {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                                            {formData.rating === 1 && ' - Poor'}
                                            {formData.rating === 2 && ' - Fair'}
                                            {formData.rating === 3 && ' - Good'}
                                            {formData.rating === 4 && ' - Very Good'}
                                            {formData.rating === 5 && ' - Excellent'}
                                        </>
                                    )}
                                </span>
                            </div>
                            {formErrors.rating && <span className={styles['error-message']}>{formErrors.rating}</span>}
                        </div>
                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>Review Title (Optional)</label>
                            <InputField
                                type="text"
                                hint="Summarize your review in a few words..."
                                isSubmittable={false}
                                value={formData.review_title}
                                onChange={(e) => handleInputChange('review_title', e.target.value)}
                                externalStyles={`${styles['review-title-input']} ${formErrors.review_title ? styles['input-error'] : ''}`}
                            />
                            <div className={styles['char-counter']}>{formData.review_title.length}/100</div>
                            {formErrors.review_title && <span className={styles['error-message']}>{formErrors.review_title}</span>}
                        </div>
                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>
                                Your Review <span className={styles['required']}>*</span>
                            </label>
                            <textarea
                                className={`${styles['review-textarea']} ${formErrors.review_text ? styles['input-error'] : ''}`}
                                placeholder="Share your experience with this product..."
                                value={formData.review_text}
                                onChange={(e) => handleInputChange('review_text', e.target.value)}
                                rows={6}
                            />
                            <div className={styles['char-counter']}>{formData.review_text.length}/2000</div>
                            {formErrors.review_text && <span className={styles['error-message']}>{formErrors.review_text}</span>}
                        </div>
                        <div className={styles['form-actions']}>
                            <Button type="secondary" label="Cancel" action={handleCloseReviewModal} disabled={loading} />
                            <button
                                type="submit"
                                className={styles['submit-btn']}
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
            
            {/* Reviews List */}
            {reviewsToShow.length > 0 ? (
                <div className={styles['reviews-list-section']}>
                    {reviewsToShow.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            ) : (
                <div className={styles['reviews-list-section']}>
                    <div className={styles['no-reviews-placeholder']}>
                        <i className="fa-regular fa-face-frown" style={{fontSize: '2rem', color: 'var(--tg-secondary)', marginBottom: '0.5rem'}}></i>
                        <p>No reviews yet. Be the first to share your experience!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductReviews;