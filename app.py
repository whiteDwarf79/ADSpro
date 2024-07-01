from flask import Flask, render_template, request, send_from_directory, jsonify
import os
import pandas as pd
import numpy as np
import librosa
import joblib
import soundfile as sf

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def index():
    return render_template('index.html')
@app.route('/adspro')
def adspro():
    return render_template('adspro.html')
@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/userguide')
def userguide():
    return render_template('userguide.html')



@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)



def extract_waveform_stats(audio_file, n_fft=2048):
    y, sr = librosa.load(audio_file)
    if len(y) < n_fft:
        n_fft = len(y) // 2
    amplitude = np.abs(y)
    return {
        'Minimum': np.min(amplitude),
        'Maximum': np.max(amplitude),
        'Average': np.mean(amplitude),
        'StdDev': np.std(amplitude)
    }




def extract_spectral_features(audio_file, n_fft=2048):
    y, sr = librosa.load(audio_file)
    if len(y) < n_fft:
        n_fft = len(y) // 2
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=n_fft)[0]
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr, n_fft=n_fft)[0]
    spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr, n_fft=n_fft)[0]
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, n_fft=n_fft)[0]
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, n_fft=n_fft)
    features = {
        'Spectral Centroid Min': np.min(spectral_centroid),
        'Spectral Centroid Max': np.max(spectral_centroid),
        'Spectral Centroid Mean': np.mean(spectral_centroid),
        'Spectral Centroid Std': np.std(spectral_centroid),
        'Spectral Bandwidth Min': np.min(spectral_bandwidth),
        'Spectral Bandwidth Max': np.max(spectral_bandwidth),
        'Spectral Bandwidth Mean': np.mean(spectral_bandwidth),
        'Spectral Bandwidth Std': np.std(spectral_bandwidth),
        'Spectral Contrast Min': np.min(spectral_contrast),
        'Spectral Contrast Max': np.max(spectral_contrast),
        'Spectral Contrast Mean': np.mean(spectral_contrast),
        'Spectral Contrast Std': np.std(spectral_contrast),
        'Spectral Rolloff Min': np.min(spectral_rolloff),
        'Spectral Rolloff Max': np.max(spectral_rolloff),
        'Spectral Rolloff Mean': np.mean(spectral_rolloff),
        'Spectral Rolloff Std': np.std(spectral_rolloff)
    }
    for i in range(1, 14):
        features[f'MFCC{i}_Mean'] = np.mean(mfccs[i-1])
        features[f'MFCC{i}_Std'] = np.std(mfccs[i-1])
    return features

def predict_audio_prominence(audio_file, model_path='model.pkl'):
    model = joblib.load(model_path)
    waveform_stats = extract_waveform_stats(audio_file)
    spectral_features = extract_spectral_features(audio_file)
    features = {**waveform_stats, **spectral_features}
    features_df = pd.DataFrame([features])

    if not os.path.exists(audio_file):
        return jsonify({'success': False, 'error': 'Audio file not found'})
    if os.path.getsize(audio_file) == 0:
        return jsonify({'success': False, 'error': 'Empty audio segment'})

    predicted_prominence = model.predict(features_df)
    
    predicted_prominence = predicted_prominence.item()

    # Print the prediction result
    print("Prediction result:", predicted_prominence)

    return {'success': True, 'prominent': predicted_prominence}


@app.route('/process_segment', methods=['POST'])
def process_segment():
    try:
        data = request.json
        start_time = data['startTime']
        end_time = data['endTime']
        audio_file = os.path.join(app.config['UPLOAD_FOLDER'], 'uploaded_audio.wav')

        y, sr = librosa.load(audio_file, sr=None)

        start_sample = int(start_time * sr)
        end_sample = int(end_time * sr)
        audio_segment = y[start_sample:end_sample]

        if len(audio_segment) == 0:
            return jsonify({'success': False, 'error': 'Empty audio segment'})

        segment_path = os.path.join(app.config['UPLOAD_FOLDER'], 'segment.wav')
        sf.write(segment_path, audio_segment, sr)

        result = predict_audio_prominence(segment_path, model_path='model/model.pkl')

        # Check if the 'prominent' property exists or not in the result
        if 'prominent' in result:
            prominent_value = result['prominent']
        else:
            prominent_value = None

        # Return the prominent value in the response
        return jsonify({'success': True, 'prominent': prominent_value, 'error': None})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


if __name__ == '__main__':
    app.run(debug=True)

