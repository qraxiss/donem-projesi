import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // CHANGE !!
import axios from "axios";

function Home({ userEmail }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState({ tfidf: [], bert: [] });
    const [loading, setLoading] = useState(false);
    const [userLibrary, setUserLibrary] = useState([]); // CHANGE !!
    const navigate = useNavigate(); // CHANGE !!

    useEffect(() => { // CHANGE !!
        if (userEmail) {
            fetchUserLibrary();
        }
    }, [userEmail]);

    const fetchUserLibrary = async () => { // CHANGE !!
        try {
            const res = await axios.get("http://localhost:8000/library", {
                headers: { "User-Email": userEmail }
            });
            setUserLibrary(res.data.books);
        } catch (err) {
            console.error("Error fetching user library:", err);
        }
    };

    const isInLibrary = (book) => { // CHANGE !!
        return userLibrary.some(
            libBook => libBook.book_title === book["Book-Title"] &&
                libBook.book_author === book["Book-Author"]
        );
    };

    const searchBooks = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:8000/recommend", {
                params: { query, n: 5 },
            });
            setResults({
                tfidf: res.data.tfidf_recommendations,
                bert: res.data.bert_recommendations,
            });
        } catch (err) {
            console.error("API error:", err);
        }
        setLoading(false);
    };

    const addToLibrary = async (book) => { // CHANGE !!
        if (!userEmail) {
            alert("Please login to add books to your library");
            return;
        }

        try {
            await axios.post("http://localhost:8000/library/add", {
                book_title: book["Book-Title"],
                book_author: book["Book-Author"]
            }, {
                headers: { "User-Email": userEmail }
            });
            alert("Book added to library!");
            fetchUserLibrary(); // CHANGE !! Refresh library after adding
        } catch (err) {
            console.error("Error adding book:", err);
            alert("Failed to add book");
        }
    };

    const viewReviews = (book) => { // CHANGE !!
        navigate("/book/reviews", { state: { book } });
    };

    return (
        <>
            <div className="search">
                <input
                    type="text"
                    placeholder="Search for books..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button onClick={searchBooks}>Search</button>
            </div>

            {loading && <p className="loading">Loading...</p>}

            {!loading && (
                <main className="results">
                    <section>
                        <h2>BERT Recommendations</h2>
                        <div className="cards">
                            {results.bert.map((book, idx) => (
                                <div className="card" key={`bert-${idx}`}>
                                    <h3>{book["Book-Title"]}</h3>
                                    <p><strong>Author:</strong> {book["Book-Author"]}</p>
                                    <p><strong>Similarity:</strong> {book["Similarity"].toFixed(3)}</p>
                                    {book.average_rating > 0 && ( // CHANGE !!
                                        <div className="rating-display-card">
                                            <span className="stars-small">{"⭐".repeat(Math.round(book.average_rating))}</span>
                                            <span className="rating-text">{book.average_rating.toFixed(1)} ({book.total_ratings} reviews)</span>
                                        </div>
                                    )}
                                    <div className="card-actions"> {/* CHANGE !! */}
                                        {userEmail && !isInLibrary(book) && (
                                            <button onClick={() => addToLibrary(book)}>Add to Library</button>
                                        )}
                                        <button
                                            className="view-reviews-btn"
                                            onClick={() => viewReviews(book)}
                                        >
                                            View Reviews
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2>TF-IDF Recommendations</h2>
                        <div className="cards">
                            {results.tfidf.map((book, idx) => (
                                <div className="card" key={`tfidf-${idx}`}>
                                    <h3>{book["Book-Title"]}</h3>
                                    <p><strong>Author:</strong> {book["Book-Author"]}</p>
                                    <p><strong>Similarity:</strong> {book["Similarity"].toFixed(3)}</p>
                                    {book.average_rating > 0 && ( // CHANGE !!
                                        <div className="rating-display-card">
                                            <span className="stars-small">{"⭐".repeat(Math.round(book.average_rating))}</span>
                                            <span className="rating-text">{book.average_rating.toFixed(1)} ({book.total_ratings} reviews)</span>
                                        </div>
                                    )}
                                    <div className="card-actions"> {/* CHANGE !! */}
                                        {userEmail && !isInLibrary(book) && (
                                            <button onClick={() => addToLibrary(book)}>Add to Library</button>
                                        )}
                                        <button
                                            className="view-reviews-btn"
                                            onClick={() => viewReviews(book)}
                                        >
                                            View Reviews
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            )}
        </>
    );
}

export default Home;
