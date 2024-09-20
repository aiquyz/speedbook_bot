import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function App() {
  const [file, setFile] = useState(null);
  const [textArray, setTextArray] = useState([]);
  const [isTextLoaded, setIsTextLoaded] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [showModal, setShowModal] = useState(false);

  function onFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
      setPageNumber(1);
      setIsTextLoaded(false);
      setBookTitle(file.name);
    }
  }

  function onDocumentLoadSuccess(pdf) {
    setNumPages(pdf.numPages);
  }

  async function extractTextFromSelectedPage(pdfFile, pageNum) {
    try {
      const loadingTask = pdfjs.getDocument({ url: URL.createObjectURL(pdfFile) });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map((item) => item.str);
      const text = textItems.join(' ');
      const wordsArray = text.split(' ').filter((word) => word.trim() !== '');
      setTextArray(wordsArray);
      setCurrentWordIndex(0);
      setIsTextLoaded(true);
      setShowModal(true);
    } catch (error) {
      console.error("Error extracting text from PDF: ", error);
    }
  }

  function startReading() {
    setIsReading(true);
  }

  function stopReading() {
    setIsReading(false);
  }

  useEffect(() => {
    let interval = null;
    if (isReading) {
      interval = setInterval(() => {
        setCurrentWordIndex((prevIndex) => {
          if (prevIndex < textArray.length - 1) {
            return prevIndex + 1;
          } else {
            clearInterval(interval);
            setIsReading(false);
            return prevIndex;
          }
        });
      }, (60 / speed) * 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isReading, speed, textArray]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>{bookTitle || "Choose a book"}</h1>
      </header>

      <main className="App-main">
        {file && (
          <div className="pdf-container">
            <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
              <Page pageNumber={pageNumber} />
            </Document>
          </div>
        )}
      </main>

      <footer className="App-footer tab-bar">
        {!file && (
          <label className="tab-bar-item">
            <i className="fas fa-file-upload"></i>
            <input type="file" accept="application/pdf" onChange={onFileChange} className="file-input" />
          </label>
        )}
        {file && (
          <>
            <label className="tab-bar-item">
              <i className="fas fa-file-alt"></i>
              <input type="file" accept="application/pdf" onChange={onFileChange} className="file-input" />
            </label>
            <div className="tab-bar-item increment-decrement-buttons">
              <button
                className="decrement-button"
                onClick={() => setPageNumber((prevPage) => (prevPage > 1 ? prevPage - 1 : 1))}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={numPages}
                value={pageNumber}
                onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
                className="page-input"
              />
              <button
                className="increment-button"
                onClick={() => setPageNumber((prevPage) => (prevPage < numPages ? prevPage + 1 : numPages))}
              >
                +
              </button>
            </div>
            <button onClick={() => extractTextFromSelectedPage(file, pageNumber)} className="tab-bar-item">
              <i className="fas fa-sync-alt"></i>
            </button>
          </>
        )}
      </footer>


      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{bookTitle}</h2>
            {isTextLoaded && (
              <>
                {!isReading ? (
                  <>
                    <button onClick={startReading} className="ios-button">
                      <i className="fas fa-play"></i>
                    </button>
                    <button onClick={() => setShowModal(false)} className="ios-button close-button">
                      <i className="fas fa-times"></i>
                    </button>
                  </>
                ) : (
                  <>
                    {textArray[currentWordIndex] && (
                      <h1 className="word-display">{textArray[currentWordIndex]}</h1>
                    )}
                    <div className="range-container">
                      <span className="range-value">{speed} WPM</span>
                      <input
                        type="range"
                        id="speed-range"
                        min="50"
                        max="400"
                        value={speed}
                        onChange={(e) => setSpeed(e.target.value)}
                        className="speed-range"
                      />
                    </div>

                    <button onClick={stopReading} className="ios-button">
                      <i className="fas fa-stop"></i>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
