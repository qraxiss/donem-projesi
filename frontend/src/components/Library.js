import React, { useState, useEffect } from "react";
import axios from "axios";

function Library({ userEmail }) {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saveMessage, setSaveMessage] = useState(""); // CHANGE !!

    useEffect(() => {
        fetchLibrary();
    }, [userEmail]);

    const fetchLibrary = async () => {
        try {
            const res = await axios.get("http://localhost:8000/library", {
                headers: { "User-Email": userEmail }
            });
            setBooks(res.data.books);
        } catch (err) {
            console.error("Error fetching library:", err);
        }
        setLoading(false);
    };

    const updateBook = async (bookTitle, bookAuthor, rating, comment) => {
        try {
            await axios.put("http://localhost:8000/library/update", {
                book_title: bookTitle,
                book_author: bookAuthor,
                rating,
                comment
            }, {
                headers: { "User-Email": userEmail }
            });
            setSaveMessage("Book updated successfully!"); // CHANGE !!
            setTimeout(() => setSaveMessage(""), 3000); // CHANGE !!
            fetchLibrary();
        } catch (err) {
            console.error("Error updating book:", err);
            alert("Failed to update book"); // CHANGE !!
        }
    };

    const removeBook = async (bookTitle, bookAuthor) => {
        if (!window.confirm("Are you sure you want to remove this book from your library?")) { // CHANGE !!
            return;
        }
        try {
            await axios.delete("http://localhost:8000/library/remove", {
                headers: { "User-Email": userEmail },
                data: { book_title: bookTitle, book_author: bookAuthor }
            });
            setSaveMessage("Book removed from library"); // CHANGE !!
            setTimeout(() => setSaveMessage(""), 3000); // CHANGE !!
            fetchLibrary();
        } catch (err) {
            console.error("Error removing book:", err);
            alert("Failed to remove book"); // CHANGE !!
        }
    };

    if (loading) return <p className="loading">Loading your library...</p>;

    return (
        <div className="library">
            <h2>My Library</h2>
            {saveMessage && ( // CHANGE !!
                <div className="save-message">{saveMessage}</div>
            )}
            {books.length === 0 ? (
                <p>Your library is empty. Start adding books from the search page!</p>
            ) : (
                <div className="library-grid">
                    {books.map((book, idx) => (
                        <LibraryCard
                            key={idx}
                            book={book}
                            onUpdate={updateBook}
                            onRemove={removeBook}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function LibraryCard({ book, onUpdate, onRemove }) {
    const [editing, setEditing] = useState(false);
    const [rating, setRating] = useState(book.rating || 0);
    const [comment, setComment] = useState(book.comment || "");

    const handleSave = () => {
        onUpdate(book.book_title, book.book_author, rating, comment);
        setEditing(false);
    };

    const handleCancel = () => {
        setRating(book.rating || 0);
        setComment(book.comment || "");
        setEditing(false);
    };

    return (
        <div className="library-card">
            <h3>{book.book_title}</h3>
            <p><strong>Author:</strong> {book.book_author}</p>

            {editing ? (
                <>
                    <div className="rating-input">
                        <label>Rating:</label>
                        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                            <option value={0}>No rating</option>
                            <option value={1}>⭐ (1 star)</option>
                            <option value={2}>⭐⭐ (2 stars)</option>
                            <option value={3}>⭐⭐⭐ (3 stars)</option>
                            <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
                            <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
                        </select>
                    </div>
                    <div className="comment-input">
                        <label>Your Notes:</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            placeholder="Add your personal notes about this book..."
                        />
                    </div>
                    <div className="button-group">
                        <button className="save-btn" onClick={handleSave}>Save</button>
                        <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
                    </div>
                </>
            ) : (
                <>
                    <div className="book-details">
                        <p className="rating-display">
                            <strong>Your Rating:</strong> {rating > 0 ? "⭐".repeat(rating) + ` (${rating}/5)` : "Not rated yet"}
                        </p>
                        {comment ? (
                            <div className="comment-display">
                                <strong>Your Notes:</strong>
                                <p>{comment}</p>
                            </div>
                        ) : (
                            <p className="no-comment">No notes added yet</p>
                        )}
                    </div>
                    <div className="button-group">
                        <button className="edit-btn" onClick={() => setEditing(true)}>
                            {rating > 0 || comment ? "Edit" : "Add Rating & Notes"}
                        </button>
                        <button className="remove-btn" onClick={() => onRemove(book.book_title, book.book_author)}>Remove</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default Library;