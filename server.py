from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
from cv_checker import load_pdf, score_cv, encode_image

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/analyze-cv', methods=['POST'])
def analyze_cv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'File must be a PDF'}), 400
    
    try:
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the CV
        images = load_pdf(filepath)
        result = score_cv(images)
        
        # Add the CV preview image to the response
        cv_preview = encode_image(images[0])
        
        # Clean up
        os.remove(filepath)
        
        # Parse the result and add the preview
        if isinstance(result, str):
            try:
                import json
                result_dict = json.loads(result)
            except:
                result_dict = {
                    'content': 0,
                    'cleanliness': 0,
                    'good': 'Error parsing results',
                    'bad': 'Error parsing results',
                    'notes': 'Error parsing results'
                }
        else:
            result_dict = result
            
        result_dict['preview'] = cv_preview
        return jsonify(result_dict)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 