async function uploadImageForOCR(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('http://localhost:8000/ocr', {  // Adjust URL to your backend
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('OCR failed');
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
// Usage example (e.g., from an input event)
const input = document.querySelector('input[type="file"]') as HTMLInputElement;
input.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        const extractedText = await uploadImageForOCR(file);
        console.log('Extracted Text:', extractedText);
    }
});