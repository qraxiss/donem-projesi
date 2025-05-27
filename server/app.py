from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer, util
import numpy as np
import torch
import os

# === Kitap Öneri Sistemi Sınıfı ===
class BookRecommender:
    def __init__(self, csv_path, bert_path='data/bert_embeddings.npy'):
        self.df = pd.read_csv(csv_path).iloc[0:10000]
        self.df['Book-Title'] = self.df['Book-Title'].fillna('')
        self.df['Book-Author'] = self.df['Book-Author'].fillna('')
        self.df['combined'] = self.df['Book-Title'] + ' ' + self.df['Book-Author']

        # TF-IDF modeli
        self.tfidf = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = self.tfidf.fit_transform(self.df['combined'])

        # BERT modeli
        self.bert_model = SentenceTransformer('all-MiniLM-L6-v2')

        # Vektörleri yükle veya oluştur
        if os.path.exists(bert_path):
            print(f"[INFO] BERT vektörleri {bert_path} dosyasından yükleniyor...")
            self.bert_embeddings = torch.tensor(np.load(bert_path))
        else:
            print(f"[INFO] BERT vektörleri oluşturuluyor ve {bert_path} dosyasına kaydediliyor...")
            self.bert_embeddings = self.bert_model.encode(self.df['combined'], convert_to_tensor=True)
            np.save(bert_path, self.bert_embeddings.cpu().numpy())

    def recommend_tfidf(self, query, n=5):
        query_vec = self.tfidf.transform([query])
        sim = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        top_idx = sim.argsort()[-n:][::-1]
        results = self.df.iloc[top_idx][['Book-Title', 'Book-Author']]
        results['Similarity'] = sim[top_idx]
        return results.to_dict(orient="records")

    def recommend_bert(self, query, n=5):
        query_emb = self.bert_model.encode(query, convert_to_tensor=True, device="cpu")
        
        # Eğer embedding'ler GPU'daysa, CPU'ya al
        if self.bert_embeddings.device.type != "cpu":
            self.bert_embeddings = self.bert_embeddings.cpu()

        cos_scores = util.pytorch_cos_sim(query_emb, self.bert_embeddings)[0]
        top_idx = np.argsort(-cos_scores.cpu())[:n]
        results = self.df.iloc[top_idx][['Book-Title', 'Book-Author']]
        results['Similarity'] = cos_scores[top_idx].cpu().numpy()
        return results.to_dict(orient="records")


# === FastAPI Başlat ===
app = FastAPI()

# === CORS AYARI ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend'ten gelen istekler
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Modeli başta yükle ===
recommender = BookRecommender('data/unique_books.csv')

# === API endpointleri ===
@app.get("/")
def read_root():
    return {"message": "Kitap öneri API'sine hoşgeldiniz!"}

@app.get("/recommend/")
def recommend_books(query: str, n: int = 5):
    tfidf_results = recommender.recommend_tfidf(query, n)
    bert_results = recommender.recommend_bert(query, n)
    return {
        "query": query,
        "tfidf_recommendations": tfidf_results,
        "bert_recommendations": bert_results
    }
