import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './App.css';

// Указываем путь к воркеру для PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function App() {
  const [file, setFile] = useState(null); // Для хранения загруженного PDF
  const [textArray, setTextArray] = useState([]); // Для хранения массива слов
  const [isTextLoaded, setIsTextLoaded] = useState(false); // Флаг для отображения кнопки "Старт"
  const [speed, setSpeed] = useState(100); // Скорость (слов в минуту)
  const [currentWordIndex, setCurrentWordIndex] = useState(0); // Индекс текущего слова
  const [isReading, setIsReading] = useState(false); // Флаг чтения
  const [pageNumber, setPageNumber] = useState(1); // Текущий номер страницы
  const [numPages, setNumPages] = useState(null); // Общее количество страниц
  const [selectedPage, setSelectedPage] = useState(null); // Выбранная страница для конвертации

  // Функция для загрузки PDF файла
  function onFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      setFile(file); // Сохраняем выбранный файл
      setPageNumber(1); // Сбрасываем на первую страницу
      setSelectedPage(null); // Сбрасываем выбранную страницу
      setIsTextLoaded(false); // Сбрасываем флаг загрузки текста
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
      <header className="App-header">
        <input type="file" accept="application/pdf" onChange={onFileChange} />
        {file && (
          <>
            {/* Отображение текущей страницы PDF с помощью react-pdf */}
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              <Page pageNumber={pageNumber} />
            </Document>
            <div>
              <label>Go to page: </label>
              <input
                type="number"
                min="1"
                max={numPages}
                value={pageNumber}
                onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
              />
              <button onClick={() => setSelectedPage(pageNumber)}>
                Select Page
              </button>
            </div>
          </>
        )}
        {selectedPage && (
          <>
            <button onClick={() => extractTextFromSelectedPage(file, selectedPage)}>
              Convert text from page {selectedPage}
            </button>
          </>
        )}
        {isTextLoaded && (
          <>
            <div>
              <input
                type="range"
                min="10"
                max="300"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
              />
              <label>Words per minute: {speed}</label>
            </div>
            {!isReading ? (
              <button onClick={startReading}>Start Reading</button>
            ) : (
              <button onClick={stopReading}>Stop Reading</button>
            )}
          </>
        )}
        {isReading && textArray[currentWordIndex] && (
          <h1>{textArray[currentWordIndex]}</h1>
        )}
      </header>
    </div>
  );
}

export default App;
