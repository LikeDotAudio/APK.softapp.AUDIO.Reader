// Notes UI
const btnNotes = document.getElementById('btn-notes');
const notesModal = document.getElementById('notes-modal');
const btnCloseNotes = document.getElementById('btn-close-notes');
const notesOutput = document.getElementById('notes-output');
const btnCopyNotes = document.getElementById('btn-copy-notes');
const btnClearNotes = document.getElementById('btn-clear-notes');

btnNotes.addEventListener('click', () => {
    notesOutput.value = [...savedNotes].join('\n\n');
    notesModal.style.display = 'flex';
});

btnCloseNotes.addEventListener('click', () => {
    notesModal.style.display = 'none';
});

// The async Clipboard API, not the deprecated execCommand('copy'). It needs a
// secure context (https or localhost); where it is missing or refused, the
// notes are left selected and the button says to press Ctrl+C.
btnCopyNotes.addEventListener('click', async () => {
    const originalText = btnCopyNotes.textContent;
    try {
        await navigator.clipboard.writeText(notesOutput.value);
        btnCopyNotes.textContent = 'Copied!';
    } catch (err) {
        notesOutput.select();
        btnCopyNotes.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => btnCopyNotes.textContent = originalText, 1500);
});

btnClearNotes.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all notes?')) {
        savedNotes.clear();
        store.setJSON(STORE_KEYS.notes, []);
        notesOutput.value = '';
        
        document.querySelectorAll('.line-action input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }
});
