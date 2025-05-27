from fastapi import FastAPI, Query, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import torch
from typing import Optional
import database  # CHANGE !!

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")  # CHANGE !!
async def startup_event():
    database.init_database()

# Load data
df = pd.read_csv('data/unique_books_example.csv')
df['combined_features'] = df['Book-Title'] + ' ' + df['Book-Author'] + ' ' + df['Publisher']

# TF-IDF setup
tfidf_vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf_vectorizer.fit_transform(df['combined_features'])

# BERT setup
bert_model = SentenceTransformer('all-MiniLM-L6-v2')
book_embeddings = bert_model.encode(df['combined_features'].tolist())

# Pydantic models for requests  # CHANGE !!
class RegisterRequest(BaseModel):
    email: str

class AddBookRequest(BaseModel):
    book_title: str
    book_author: str

class UpdateBookRequest(BaseModel):
    book_title: str
    book_author: str
    rating: int
    comment: str

class RemoveBookRequest(BaseModel):
    book_title: str
    book_author: str

@app.get("/recommend")
async def recommend_books(query: str = Query(...), n: int = Query(default=5)):
    # TF-IDF recommendations
    query_vec = tfidf_vectorizer.transform([query])
    tfidf_similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    tfidf_indices = tfidf_similarities.argsort()[-n:][::-1]
    
    tfidf_recommendations = []
    for idx in tfidf_indices:
        book_data = df.iloc[idx].to_dict()
        book_data['Similarity'] = float(tfidf_similarities[idx])
        # CHANGE !! Add rating info
        rating_stats = database.get_book_average_rating(
            book_data['Book-Title'], 
            book_data['Book-Author']
        )
        book_data['average_rating'] = rating_stats['avg_rating']
        book_data['total_ratings'] = rating_stats['rating_count']
        tfidf_recommendations.append(book_data)
    
    # BERT recommendations
    query_embedding = bert_model.encode([query])
    bert_similarities = cosine_similarity(query_embedding, book_embeddings).flatten()
    bert_indices = bert_similarities.argsort()[-n:][::-1]
    
    bert_recommendations = []
    for idx in bert_indices:
        book_data = df.iloc[idx].to_dict()
        book_data['Similarity'] = float(bert_similarities[idx])
        # CHANGE !! Add rating info
        rating_stats = database.get_book_average_rating(
            book_data['Book-Title'], 
            book_data['Book-Author']
        )
        book_data['average_rating'] = rating_stats['avg_rating']
        book_data['total_ratings'] = rating_stats['rating_count']
        bert_recommendations.append(book_data)
    
    return {
        "tfidf_recommendations": tfidf_recommendations,
        "bert_recommendations": bert_recommendations
    }

# New endpoints  # CHANGE !!
@app.post("/register")
async def register_user(request: RegisterRequest):
    success = database.register_user(request.email)
    if not success:
        raise HTTPException(status_code=400, detail="Email already exists")
    return {"message": "User registered successfully"}

@app.get("/library")
async def get_library(user_email: str = Header(None)):
    if not user_email:
        raise HTTPException(status_code=401, detail="User email required")
    
    books = database.get_user_library(user_email)
    return {"books": books}

@app.post("/library/add")
async def add_to_library(request: AddBookRequest, user_email: str = Header(None)):
    if not user_email:
        raise HTTPException(status_code=401, detail="User email required")
    
    success = database.add_book_to_library(
        user_email, 
        request.book_title, 
        request.book_author
    )
    if not success:
        raise HTTPException(status_code=400, detail="Book already in library")
    return {"message": "Book added to library"}

@app.put("/library/update")
async def update_library_book(request: UpdateBookRequest, user_email: str = Header(None)):
    if not user_email:
        raise HTTPException(status_code=401, detail="User email required")
    
    success = database.update_book_in_library(
        user_email,
        request.book_title,
        request.book_author,
        request.comment,
        request.rating
    )
    if not success:
        raise HTTPException(status_code=404, detail="Book not found in library")
    return {"message": "Book updated successfully"}

@app.delete("/library/remove")
async def remove_from_library(request: RemoveBookRequest, user_email: str = Header(None)):
    if not user_email:
        raise HTTPException(status_code=401, detail="User email required")
    
    success = database.remove_book_from_library(
        user_email,
        request.book_title,
        request.book_author
    )
    if not success:
        raise HTTPException(status_code=404, detail="Book not found in library")
    return {"message": "Book removed from library"}

# CHANGE !! Helper function to mask email
def mask_email(email):
    parts = email.split('@')
    if len(parts) != 2:
        return email
    username = parts[0]
    domain = parts[1]
    if len(username) <= 1:
        return email
    return f"{username[0]}***@{domain}"

# CHANGE !! New endpoint for book reviews
@app.get("/book/reviews")
async def get_book_reviews(
    book_title: str = Query(...), 
    book_author: str = Query(...),
    user_email: Optional[str] = Header(None)
):
    # Get reviews (excluding current user if logged in)
    reviews = database.get_book_reviews(book_title, book_author, user_email)
    
    # Mask emails for privacy
    for review in reviews:
        review['email'] = mask_email(review['email'])
    
    # Get average rating
    rating_stats = database.get_book_average_rating(book_title, book_author)
    
    # Check if book is in user's library
    in_library = False
    if user_email:
        in_library = database.check_book_in_library(user_email, book_title, book_author)
    
    return {
        "book_title": book_title,
        "book_author": book_author,
        "average_rating": rating_stats["avg_rating"],
        "total_ratings": rating_stats["rating_count"],
        "reviews": reviews,
        "in_user_library": in_library
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)