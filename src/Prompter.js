// Synthesis & Prompter functions
let allChunks = [];
let currentTOC = [];
let currentChunkIndex = 0;

// parseTextToChunks() is the pure chunker in chunker.js (behaviours.js §2).

function speak() {
    if (speech.speaking) {
        return;
    }
    
    if (speech.paused) {
        speech.resume();
        return;
    }

    if (textInput.value.trim() === '') return;

    // Reset synthesis to avoid hanging states
    speech.stop();
    
    // If we are starting fresh from the text box
    if (textInput.style.display !== 'none') {
        const result = parseTextToChunks(textInput.value);
        allChunks = result.chunks;
        currentTOC = result.toc;
        
        let savedIndex = parseInt(store.get(STORE_KEYS.index, '0'), 10);
        currentChunkIndex = (savedIndex >= 0 && savedIndex < allChunks.length) ? savedIndex : 0;
        
        buildPrompterUI(result.toc);
        
        textInput.style.display = 'none';
        prompterView.style.display = 'block';
    }

    if (allChunks.length > 0 && currentChunkIndex < allChunks.length) {
        playChunk(currentChunkIndex);
    }
}

function buildPrompterUI(toc) {
    prompterView.innerHTML = '';
    
    // Build TOC
    const tocSidebar = document.getElementById('toc-sidebar');
    const tocList = document.getElementById('toc-list');
    
    if (toc && toc.length > 0) {
        tocSidebar.style.display = 'block';
        tocList.innerHTML = '';
        toc.forEach((item, i) => {
            const li = document.createElement('li');
            li.id = `toc-item-${i}`;
            li.textContent = item.title;
            li.style.marginLeft = `${(item.level - 1) * 15}px`; // indent based on ## level
            
            li.addEventListener('click', () => {
                jumpTo(item.chunkIndex);
            });
            tocList.appendChild(li);
        });
    } else {
        tocSidebar.style.display = 'none';
    }

    let currentChapterCount = 0;
    let lineInChapter = 0;

    allChunks.forEach((chunk, index) => {
        if (chunk.isHeading) {
            if (chunk.level === 1) {
                currentChapterCount = 0;
                lineInChapter = 1;
            } else if (chunk.level === 2) {
                currentChapterCount++;
                lineInChapter = 1;
            } else {
                lineInChapter++;
            }
        } else {
            lineInChapter++;
        }

        const lineDiv = document.createElement('div');
        lineDiv.className = 'prompter-line';
        lineDiv.id = `prompter-line-${index}`;
        
        if (chunk.isHeading) {
            lineDiv.classList.add('heading-line');
            lineDiv.style.fontWeight = 'bold';
            lineDiv.style.fontSize = `${headingSize(chunk.level)}em`; 
        }
        
        const numDiv = document.createElement('div');
        numDiv.className = 'line-number';
        numDiv.textContent = `${currentChapterCount}.${lineInChapter}`;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'line-text';
        textDiv.id = `prompter-text-${index}`;
        textDiv.textContent = chunk.text;
        
        const actionDiv = document.createElement('div');
        actionDiv.className = 'line-action';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        
        const textToSave = chunk.text.trim();
        if (savedNotes.has(textToSave)) {
            checkbox.checked = true;
        }
        
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                savedNotes.add(textToSave);
            } else {
                savedNotes.delete(textToSave);
            }
            store.setJSON(STORE_KEYS.notes, [...savedNotes]);
        });
        
        actionDiv.appendChild(checkbox);
        
        lineDiv.appendChild(numDiv);
        lineDiv.appendChild(textDiv);
        lineDiv.appendChild(actionDiv);
        
        // Click to skip functionality
        lineDiv.addEventListener('click', () => {
            jumpTo(index);
        });
        
        prompterView.appendChild(lineDiv);
    });
}

// Skip to a line (a TOC entry or a click on the line): stop on purpose, clear
// the highlight, remember the place, start reading there.
function jumpTo(index) {
    speech.stop();
    document.querySelectorAll('.prompter-line').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.line-text').forEach((el, i) => {
        el.textContent = allChunks[i].text;
    });
    currentChunkIndex = index;
    store.set(STORE_KEYS.index, index.toString());
    setTimeout(() => playChunk(currentChunkIndex), 50);
}

function playChunk(index) {
    if (index >= allChunks.length) {
        // Finished reading everything
        store.set(STORE_KEYS.index, '0');
        return;
    }
    
    store.set(STORE_KEYS.index, index.toString());
    
    // Update TOC glow
    let activeTocIndex = -1;
    for (let i = 0; i < currentTOC.length; i++) {
        if (index >= currentTOC[i].chunkIndex) {
            activeTocIndex = i;
        } else {
            break;
        }
    }
    
    document.querySelectorAll('#toc-list li').forEach((el, i) => {
        if (i === activeTocIndex) {
            el.classList.add('toc-active');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            el.classList.remove('toc-active');
        }
    });
    
    // Clear old active lines
    document.querySelectorAll('.prompter-line').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.line-text').forEach((el, i) => {
        el.textContent = allChunks[i].text;
    });

    const activeLine = document.getElementById(`prompter-line-${index}`);
    const activeText = document.getElementById(`prompter-text-${index}`);
    
    if (activeLine) {
        activeLine.classList.add('active');
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const chunk = allChunks[index];
    let voice = null;
    
    if (alternateVoiceCheckbox.checked) {
        // Calculate chapter count up to this chunk
        let chapterCount = 0;
        for (let i = 0; i <= index; i++) {
            if (allChunks[i].isHeading && (allChunks[i].level === 1 || allChunks[i].level === 2)) chapterCount++;
        }
        // Alternate a female and a male English voice by chapter (speech.js picks them)
        const pair = pickAlternateVoices(voices);
        if (pair) voice = (chapterCount % 2 === 0) ? pair.female : pair.male;
    } else if (voiceSelect.selectedOptions.length > 0) {
        const selectedName = voiceSelect.selectedOptions[0].getAttribute('data-name');
        voice = voices.find(v => v.name === selectedName) || null;
    }
    
    const next = () => {
        currentChunkIndex++;
        playChunk(currentChunkIndex);
    };
    
    speech.say(chunk.text, {
        voice,
        rate: parseFloat(rateSlider.value),
        // Also called on Chrome's random 'interrupted' error: carry on to the next chunk.
        onDone: next,
        // Any other speech error: stop on this chunk and say why, with Retry from here.
        onError: (event) => showReaderProblem(speechProblem(event && event.error), {
            subject: `Chunk ${index + 1} of ${allChunks.length}`, onRetry: () => playChunk(index) }),
        // Highlight words as it reads
        onWord: (startIndex) => {
            if (!activeText) return;
            const text = chunk.text;
            let endIndex = startIndex;
            
            // Find the end of the current word
            while (endIndex < text.length && !/\s/.test(text[endIndex])) {
                endIndex++;
            }
            
            const before = text.substring(0, startIndex);
            const word = text.substring(startIndex, endIndex);
            const after = text.substring(endIndex);
            
            activeText.innerHTML = `${before}<span class="highlight">${word}</span>${after}`;
        },
    });
}
