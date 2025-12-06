const transcriptInput = document.getElementById('transcriptInput');
const displayBtn = document.getElementById('displayBtn');
const transcriptDisplay = document.getElementById('transcriptDisplay');

displayBtn.addEventListener('click', () => {
    const text = transcriptInput.value.trim();
    
    if (text) {
        transcriptDisplay.textContent = text;
    } else {
        transcriptDisplay.textContent = '';
    }
});

