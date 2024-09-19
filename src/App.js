import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './App.css';

// Указываем путь к воркеру для PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function App() {
  const [file, setFile] = useState(null); // Для хранения загруженного PDF
  const [textArray, setTextArray] = useState([]); // Для хранения массива слов
  const [isTextLoaded, setIsTextLoaded] = useState(false); // Флаг для отображения текста
  const [speed, setSpeed] = useState(100); // Скорость (слов в минуту)
  const [currentWordIndex, setCurrentWordIndex] = useState(0); // Индекс текущего слова
  const [isReading, setIsReading] = useState(false); // Флаг чтения
  const [pageNumber, setPageNumber] = useState(1); // Текущий номер страницы
  const [numPages, setNumPages] = useState(null); // Общее количество страниц
  const [selectedPage, setSelectedPage] = useState(null); // Выбранная страница для конвертации
  const [bookTitle, setBookTitle] = useState(''); // Название книги
  const [showModal, setShowModal] = useState(false); // Флаг для модального окна

  // Функция для загрузки PDF файла
  function onFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      setFile(file); // Сохраняем выбранный файл
      setPageNumber(1); // Сбрасываем на первую страницу
      setSelectedPage(null); // Сбрасываем выбранную страницу
      setIsTextLoaded(false); // Сбрасываем флаг загрузки текста
      setBookTitle(file.name); // Устанавливаем название книги
    }
  }

  // Функция обработки загрузки документа PDF
  function onDocumentLoadSuccess(pdf) {
    setNumPages(pdf.numPages); // Устанавливаем количество страниц
  }

  // Извлечение текста с выбранной страницы с использованием pdfjs
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
      setShowModal(true); // Показать модальное окно после конвертации текста
    } catch (error) {
      console.error("Error extracting text from PDF: ", error);
    }
  }

  // Запуск процесса показа слов
  function startReading() {
    setIsReading(true);
  }

  // Остановка показа слов
  function stopReading() {
    setIsReading(false);
  }

  // Обновление индекса текущего слова
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
      {/* Header */}
      <header className="App-header">
        <h1>{bookTitle || "Choose a book"}</h1>
      </header>

      {/* Main content for PDF display */}
      <main className="App-main">
        {!file && (
          <label className="file-label ios-button">
            Select PDF File
            <input type="file" accept="application/pdf" onChange={onFileChange} className="file-input" />
          </label>
        )}
        {file && (
          <>
            <div className="pdf-container">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                <Page pageNumber={pageNumber} />
              </Document>
            </div>
            <div className="controls">
              <label>Go to page: </label>
              <input
                type="number"
                min="1"
                max={numPages}
                value={pageNumber}
                onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
                className="page-input"
              />
              <button onClick={() => setSelectedPage(pageNumber)} className="ios-button">
                Select Page
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer with controls */}
      <footer className="App-footer">
        {file && (
          <label className="file-label-small ios-button">
            Select another file
            <input type="file" accept="application/pdf" onChange={onFileChange} className="file-input" />
          </label>
        )}
        {selectedPage && (
          <>
            <button onClick={() => extractTextFromSelectedPage(file, selectedPage)} className="ios-button">
              Convert text from page {selectedPage}
            </button>
          </>
        )}
      </footer>

      {/* Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{bookTitle}</h2>
            {isTextLoaded && (
              <>
                {!isReading ? (
                  <>
                    <button onClick={startReading} className="ios-button">
                      Start
                    </button>
                    <button onClick={() => setShowModal(false)} className="ios-button close-button">
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    {textArray[currentWordIndex] && (
                      <h1 className="word-display">{textArray[currentWordIndex]}</h1>
                    )}
                    <div className="range-container">
                      <label htmlFor="speed-range">Speed: {speed} WPM</label>
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
                      Stop
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
