import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ tfidf: [], bert: [] });
  const [loading, setLoading] = useState(false);

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
      console.error("API hatası:", err);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="logo">BookBuddy 🎯</h1>
        <div className="search">
          <input
            type="text"
            placeholder="Kitap ismi gir..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={searchBooks}>Ara</button>
        </div>
      </header>

      {loading && <p className="loading">Yükleniyor...</p>}

      {!loading && (
        <main className="results">
          <section>
            <h2>BERT Önerileri</h2>
            <div className="cards">
              {results.bert.map((book, idx) => (
                <div className="card" key={`bert-${idx}`}>
                  <h3>{book["Book-Title"]}</h3>
                  <p><strong>Yazar:</strong> {book["Book-Author"]}</p>
                  <p><strong>Benzerlik:</strong> {book["Similarity"].toFixed(3)}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>TF-IDF Önerileri</h2>
            <div className="cards">
              {results.tfidf.map((book, idx) => (
                <div className="card" key={`tfidf-${idx}`}>
                  <h3>{book["Book-Title"]}</h3>
                  <p><strong>Yazar:</strong> {book["Book-Author"]}</p>
                  <p><strong>Benzerlik:</strong> {book["Similarity"].toFixed(3)}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
