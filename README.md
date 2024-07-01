# ADSpro
Welcome to the Audio Prominence Analyzer! This app helps you analyze audio files to find the most prominent parts. It's built using Flask and some cool libraries like Librosa and Pandas.

## Features
Upload Audio Files: Easily upload your audio files.

Waveform Analysis: Get detailed waveform statistics like minimum, maximum, average, and standard deviation of amplitude.

Spectral Features: Extract various spectral features including spectral centroid, bandwidth, contrast, rolloff, and MFCCs.

Prominence Prediction: Use a pre-trained model to predict the most prominent sections of your audio.

## How to Use

Upload Your Audio: Click on the upload button and select your audio file.

Analyze: The app will process your file and give you detailed stats and predictions.

View Results: See which parts of your audio are most prominent.

## Tech Stack 
Backend: Flask

Frontend: HTML, CSS, JavaScript

Machine Learning: Scikit-learn, joblib

Audio Processing: Librosa, Soundfile

Getting Started
1. **Clone the repository:**
   ```sh
   git clone https://github.com/whiteDwarf79/ADSpro.git
2. **Navigate to the project directory:**
   ```sh
   cd ADSpro
3. **Install the dependencies:**
   ```sh
   pip install -r requirements.txt
4. **Run the app:**
   ```sh
   python app.py

Open your browser and go to http://localhost:5000 to start using the app.

## Contributing
Feel free to contribute by opening issues or submitting pull requests. Any help to make this project better is welcome!

## License
This project is licensed under the MIT License - see the LICENSE file for details.
