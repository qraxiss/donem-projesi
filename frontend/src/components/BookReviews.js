import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function BookReviews({ userEmail }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { book } = location.state || {};
    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!book) {
            navigate("/");
            return;
        }
        fetchReviews();
    }, [book]);

    const fetchReviews = async () => {
        try {
            const res = await axios.get("http://localhost:8000/book/reviews", {
                params: {
                    book_title: book["Book-Title"],
                    book_author: book["Book-Author"]
                },
                headers: userEmail ? { "User-Email": userEmail } : {}
            });
            setReviewData(res.data);
        } catch (err) {
            console.error("Error fetching reviews:", err);
        }
        setLoading(false);
    };

    if (!book) return null;
    if (loading) return <p className="loading">Loading reviews...</p>;

    return (
        <div className="reviews-container">
            <button onClick={() => navigate(-1)} className="back-button">
                ← Back to Search
            </button>

            <div className="book-header">
                <h2>{book["Book-Title"]}</h2>
                <p className="book-author">by {book["Book-Author"]}</p>
            </div>

            {reviewData && (
                <>
                    <div className="rating-summary">
                        <h3>Community Rating</h3>
                        {reviewData.total_ratings > 0 ? (
                            <>
                                <div className="average-rating">
                                    <span className="rating-number">{reviewData.average_rating}</span>
                                    <span className="stars">{"⭐".repeat(Math.round(reviewData.average_rating))}</span>
                                </div>
                                <p className="rating-count">Based on {reviewData.total_ratings} rating{reviewData.total_ratings > 1 ? 's' : ''}</p>
                            </>
                        ) : (
                            <p className="no-ratings">No ratings yet</p>
                        )}
                    </div>

                    <div className="reviews-section">
                        <h3>User Reviews</h3>
                        {reviewData.reviews.length > 0 ? (
                            <div className="reviews-list">
                                {reviewData.reviews.map((review, idx) => (
                                    <div key={idx} className="review-card">
                                        <div className="review-header">
                                            <span className="reviewer-email">{review.email}</span>
                                            {review.rating && (
                                                <span className="review-rating">{"⭐".repeat(review.rating)}</span>
                                            )}
                                        </div>
                                        {review.comment && (
                                            <p className="review-comment">{review.comment}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-reviews">No reviews yet. Be the first to add this book to your library and review it!</p>
                        )}
                    </div>

                    {reviewData.in_user_library && (
                        <div className="user-notice">
                            <p>📚 This book is in your library. Go to <button onClick={() => navigate("/library")} className="link-button">My Library</button> to add your own review!</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default BookReviews;