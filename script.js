document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const results = document.getElementById('results');
    const scoreCounter = document.querySelector('.score-counter');
    let totalAnalyzed = 0;

    // Initialize localStorage counters if they don't exist
    if (!localStorage.getItem('totalAnalyzed')) {
        localStorage.setItem('totalAnalyzed', '0');
    }

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Handle click to upload
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Add event listeners for share buttons
    document.querySelectorAll('.share-button').forEach(button => {
        button.addEventListener('click', handleShare);
    });

    // Add event listener for try again button
    document.querySelector('.try-again-btn')?.addEventListener('click', resetUI);

    function preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        // Show loading state
        dropZone.innerHTML = '<div class="drop-zone-content"><p class="typing-text">Analyzing your CV...</p></div>';

        const formData = new FormData();
        formData.append('file', file);

        fetch('/analyze-cv', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            updateAnalytics();
            displayResults(data);
            if (data.preview) {
                displayPreview(data.preview);
            }
            resetDropZone();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while analyzing the CV');
            resetDropZone();
        });
    }

    function displayPreview(base64Data) {
        const cvPreview = document.getElementById('cv-image');
        cvPreview.src = `data:image/jpeg;base64,${base64Data}`;
        cvPreview.style.display = 'block';
    }

    function updateAnalytics() {
        totalAnalyzed = parseInt(localStorage.getItem('totalAnalyzed')) + 1;
        localStorage.setItem('totalAnalyzed', totalAnalyzed.toString());
        
        scoreCounter.classList.remove('hidden');
        scoreCounter.querySelector('.total-analyzed strong').textContent = totalAnalyzed;
    }

    function displayResults(data) {
        // Show results section with animation
        results.classList.remove('hidden');
        results.style.opacity = '0';
        setTimeout(() => results.style.opacity = '1', 100);

        // Calculate and display total score
        const totalScore = Math.round((data.content + data.cleanliness) / 2);
        document.querySelector('.total-score').textContent = totalScore;
        
        // Update score bars with animation
        updateScoreBar('content-score', data.content);
        updateScoreBar('cleanliness-score', data.cleanliness);

        // Update feedback text with typing effect
        typeText('good-points', data.good);
        typeText('bad-points', data.bad);
        typeText('notes', data.notes || 'No additional notes.');

        // Update parsed information
        if (data.personal_info) {
            document.getElementById('candidate-name').textContent = data.personal_info.name || 'Not found';
            document.getElementById('candidate-email').textContent = data.personal_info.email || 'Not found';
            document.getElementById('candidate-phone').textContent = data.personal_info.phone || 'Not found';
            document.getElementById('candidate-location').textContent = data.personal_info.location || 'Not found';
            document.getElementById('candidate-education').textContent = data.personal_info.education || 'Not found';
            document.getElementById('candidate-experience').textContent = data.personal_info.experience || 'Not found';
            document.getElementById('candidate-skills').textContent = data.personal_info.skills || 'Not found';
        }
    }

    function typeText(elementId, text) {
        const element = document.getElementById(elementId);
        element.textContent = '';
        let i = 0;
        const speed = 20;

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }

        type();
    }

    function updateScoreBar(id, score) {
        const scoreBar = document.getElementById(id);
        const scoreNumber = scoreBar.parentElement.querySelector('.score-number');
        const percentage = (score / 10) * 100;
        
        scoreBar.style.width = '0%';
        scoreNumber.textContent = '0/10';
        
        setTimeout(() => {
            scoreBar.style.width = `${percentage}%`;
            scoreNumber.textContent = score + '/10';
        }, 100);
    }

    function handleShare(e) {
        const platform = e.currentTarget.classList.contains('twitter') ? 'Twitter' : 'LinkedIn';
        const score = document.querySelector('.total-score').textContent;
        const text = `I just got a ${score}/10 on my CV analysis! Check out this professional CV scorer.`;
        const url = window.location.href;

        if (platform === 'Twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        } else {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        }
    }

    function resetUI() {
        results.classList.add('hidden');
        const cvPreview = document.getElementById('cv-image');
        cvPreview.src = '';
        cvPreview.style.display = 'none';
        resetDropZone();
    }

    function resetDropZone() {
        dropZone.innerHTML = `
            <div class="drop-zone-content">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E" alt="Upload icon" class="upload-icon">
                <p>Drop your CV to get instant feedback<br>or<br><span class="browse">Choose a file</span></p>
                <div class="upload-tips">
                    <span>Get personalized insights</span>
                    <span>Professional analysis</span>
                    <span>Improve your chances</span>
                </div>
            </div>
        `;
    }
});