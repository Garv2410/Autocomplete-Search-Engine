/**
 * TrieSearch Engine - Main Application Logic
 * Connects the Trie data structure to the modern user interface.
 * Handles DOM events, real-time prefix autocomplete, keyboard navigation,
 * localStorage persistence, word management (add/delete), and visual traversal traces.
 */

// ==========================================================================
// 1. Initial State & Default Dictionary
// ==========================================================================

// Preloaded dictionary featuring the user's required words and essential computer science terms
const DEFAULT_WORDS = [
    // Required example words
    "program",
    "programmer",
    "programming",
    "progress",
    "project",
    "python",

    // Additional common programming and data structure words
    "algorithm",
    "array",
    "asynchronous",
    "binary",
    "boolean",
    "bytecode",
    "cache",
    "callback",
    "closure",
    "compiler",
    "constant",
    "database",
    "debug",
    "decorator",
    "developer",
    "dictionary",
    "encapsulation",
    "function",
    "frontend",
    "graph",
    "hashmap",
    "inheritance",
    "interface",
    "javascript",
    "json",
    "lambda",
    "memory",
    "module",
    "node",
    "object",
    "polymorphism",
    "polyglot",
    "procedure",
    "process",
    "promise",
    "protocol",
    "prototype",
    "queue",
    "recursion",
    "regex",
    "runtime",
    "search",
    "stack",
    "string",
    "syntax",
    "tree",
    "trie",
    "typescript",
    "variable"
];

const LOCAL_STORAGE_KEY = 'trie_search_engine_dictionary_v1';

// Instantiate our Trie data structure (from trie.js)
const trie = new Trie();

// Currently focused suggestion index for keyboard navigation (-1 = none)
let activeSuggestionIndex = -1;
let currentSuggestions = [];

// ==========================================================================
// 2. DOM Elements Cache
// ==========================================================================
const searchInput = document.getElementById('search-input');
const searchWrapper = document.getElementById('search-wrapper');
const clearSearchBtn = document.getElementById('clear-search-btn');
const suggestionsDropdown = document.getElementById('suggestions-dropdown');
const suggestionsList = document.getElementById('suggestions-list');
const suggestionsMeta = document.getElementById('suggestions-meta');

// Traversal Visualizer Elements
const nodePathTrack = document.getElementById('node-path-track');
const vizStatus = document.getElementById('viz-status');

// Word Selection Banner
const wordSelectedBanner = document.getElementById('word-selected-banner');
const selectedWordText = document.getElementById('selected-word-text');
const selectedWordDetails = document.getElementById('selected-word-details');
const bannerCloseBtn = document.getElementById('banner-close-btn');

// Dictionary Management Elements
const headerWordCount = document.getElementById('header-word-count');
const dictCountBadge = document.getElementById('dict-count-badge');
const addWordForm = document.getElementById('add-word-form');
const newWordInput = document.getElementById('new-word-input');
const addFeedback = document.getElementById('add-feedback');
const wordsContainer = document.getElementById('words-container');
const dictFilterInput = document.getElementById('dict-filter-input');
const resetDictBtn = document.getElementById('reset-dict-btn');
const quickTags = document.getElementById('quick-tags');
const toastContainer = document.getElementById('toast-container');

// ==========================================================================
// 3. Initialization & LocalStorage Synchronization
// ==========================================================================

/**
 * Loads words from localStorage or defaults, and populates the Trie.
 */
function initDictionary() {
    let storedWords = null;
    
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
            storedWords = JSON.parse(raw);
        }
    } catch (e) {
        console.warn("Could not read localStorage:", e);
    }

    // Fallback to default words list if empty or corrupted
    const wordList = (Array.isArray(storedWords) && storedWords.length > 0) 
        ? storedWords 
        : DEFAULT_WORDS;

    // Reset Trie and populate with words
    trie.clear();
    for (const word of wordList) {
        trie.insert(word);
    }

    saveDictionaryToStorage();
    updateWordCountDisplay();
    renderDictionaryWordsList();
}

/**
 * Saves current Trie words into localStorage.
 */
function saveDictionaryToStorage() {
    try {
        const allWords = trie.getAllWords();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allWords));
    } catch (e) {
        console.warn("Could not save to localStorage:", e);
    }
}

/**
 * Updates all word count counters on the screen.
 */
function updateWordCountDisplay() {
    const count = trie.wordCount;
    if (headerWordCount) headerWordCount.textContent = count;
    if (dictCountBadge) dictCountBadge.textContent = count;
}

// ==========================================================================
// 4. Autocomplete & Search Logic
// ==========================================================================

/**
 * Handles real-time search input changes.
 */
function handleSearchInput() {
    const rawQuery = searchInput.value;
    const query = rawQuery.trim().toLowerCase();

    // Reset active keyboard selection
    activeSuggestionIndex = -1;

    // Toggle clear search button visibility
    if (rawQuery.length > 0) {
        clearSearchBtn.classList.remove('hidden');
    } else {
        clearSearchBtn.classList.add('hidden');
    }

    // If query is empty, hide suggestions and reset visualizer
    if (query.length === 0) {
        hideSuggestions();
        resetTraversalVisualizer();
        return;
    }

    // 1. Fetch suggestions using Trie's DFS autocomplete method!
    currentSuggestions = trie.autocomplete(query, 10);

    // 2. Render suggestions dropdown
    renderSuggestions(query, currentSuggestions);

    // 3. Update live Trie traversal path visualizer
    updateTraversalVisualizer(query, currentSuggestions.length);
}

/**
 * Renders autocomplete suggestions in the dropdown.
 * @param {string} prefix - The entered prefix
 * @param {Array<string>} suggestions - List of matching words from Trie
 */
function renderSuggestions(prefix, suggestions) {
    suggestionsList.innerHTML = '';
    suggestionsDropdown.classList.remove('hidden');
    searchInput.setAttribute('aria-expanded', 'true');

    if (suggestions.length === 0) {
        // Empty state when no words start with this prefix
        suggestionsMeta.textContent = `No matches found`;
        
        const noResults = document.createElement('li');
        noResults.className = 'no-suggestions-card';
        noResults.innerHTML = `
            <div class="no-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            </div>
            <div class="no-title">No suggestions for "${escapeHtml(prefix)}"</div>
            <p class="no-desc">This prefix does not exist in the Trie dictionary yet.</p>
            <button type="button" class="no-add-btn" id="quick-add-from-search-btn">
                + Add "${escapeHtml(prefix)}" to Dictionary
            </button>
        `;
        suggestionsList.appendChild(noResults);

        // Bind quick add button
        const quickAddBtn = document.getElementById('quick-add-from-search-btn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                addWordToTrie(prefix);
                handleSearchInput();
            });
        }
        return;
    }

    // Update suggestions metadata count
    suggestionsMeta.textContent = `Found ${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''}`;

    // Render each suggestion with highlighted prefix
    suggestions.forEach((word, index) => {
        const li = document.createElement('li');
        li.className = 'suggestion-item';
        li.setAttribute('role', 'option');
        li.setAttribute('data-word', word);
        li.setAttribute('data-index', index);

        // Highlight matching prefix portion
        const prefixLength = prefix.length;
        const matchedPart = word.slice(0, prefixLength);
        const remainderPart = word.slice(prefixLength);
        const isExactMatch = word === prefix;

        li.innerHTML = `
            <div class="suggestion-left">
                <span class="suggestion-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </span>
                <span class="suggestion-text">
                    <span class="highlight-prefix">${escapeHtml(matchedPart)}</span><span class="suggestion-suffix">${escapeHtml(remainderPart)}</span>
                </span>
            </div>
            <span class="suggestion-badge ${isExactMatch ? 'exact' : ''}">
                ${isExactMatch ? 'Exact Match' : 'Trie match'}
            </span>
        `;

        // Click on suggestion selects it
        li.addEventListener('click', () => {
            selectWord(word);
        });

        suggestionsList.appendChild(li);
    });
}

/**
 * Handles word selection: puts word into search input, shows info banner, hides dropdown.
 * @param {string} word - The chosen word
 */
function selectWord(word) {
    searchInput.value = word;
    hideSuggestions();
    clearSearchBtn.classList.remove('hidden');

    // Show selection notification banner
    selectedWordText.textContent = word;
    selectedWordDetails.textContent = `Word verified in Trie • Length: ${word.length} characters • Node depth: ${word.length}`;
    wordSelectedBanner.classList.remove('hidden');

    // Update visualizer for full word
    updateTraversalVisualizer(word, 1);

    showToast(`Selected word: "${word}"`, 'info');
}

/**
 * Hides the autocomplete suggestions dropdown.
 */
function hideSuggestions() {
    suggestionsDropdown.classList.add('hidden');
    searchInput.setAttribute('aria-expanded', 'false');
    activeSuggestionIndex = -1;
}

/**
 * Clears the search input and resets state.
 */
function clearSearch() {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    hideSuggestions();
    resetTraversalVisualizer();
    wordSelectedBanner.classList.add('hidden');
    searchInput.focus();
}

// ==========================================================================
// 5. Interactive Keyboard Navigation in Search Box
// ==========================================================================

/**
 * Handles Arrow Down, Arrow Up, Enter, and Escape keys in search box.
 */
function handleSearchKeydown(e) {
    const items = suggestionsList.querySelectorAll('.suggestion-item');
    if (!items || items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
        highlightActiveSuggestion(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
        highlightActiveSuggestion(items);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
            const word = items[activeSuggestionIndex].getAttribute('data-word');
            selectWord(word);
        } else if (items.length > 0) {
            // Select the top recommendation
            const firstWord = items[0].getAttribute('data-word');
            selectWord(firstWord);
        }
    } else if (e.key === 'Escape') {
        hideSuggestions();
    }
}

/**
 * Visually highlights the active suggestion item during keyboard navigation.
 */
function highlightActiveSuggestion(items) {
    items.forEach((item, idx) => {
        if (idx === activeSuggestionIndex) {
            item.classList.add('active-key');
            item.scrollIntoView({ block: 'nearest' });
            // Optionally preview word in input
            const word = item.getAttribute('data-word');
            if (word) {
                searchInput.value = word;
            }
        } else {
            item.classList.remove('active-key');
        }
    });
}

// ==========================================================================
// 6. Live Trie Traversal Visualizer
// ==========================================================================

/**
 * Updates the interactive node traversal trace.
 * Shows the exact path of Trie nodes traversed for the prefix.
 */
function updateTraversalVisualizer(prefix, resultCount) {
    if (!nodePathTrack || !vizStatus) return;

    const pathData = trie.getTraversalPath(prefix);
    nodePathTrack.innerHTML = '';

    // Always start with ROOT node
    const rootNode = document.createElement('div');
    rootNode.className = 'path-node root-node';
    rootNode.innerHTML = '<span class="node-badge">ROOT</span>';
    nodePathTrack.appendChild(rootNode);

    let allExist = true;

    // Render each character node in the path
    pathData.forEach((step) => {
        // Arrow separator
        const arrow = document.createElement('span');
        arrow.className = 'path-arrow';
        arrow.textContent = '➔';
        nodePathTrack.appendChild(arrow);

        // Node item
        const node = document.createElement('div');
        node.className = 'path-node';

        if (step.exists) {
            if (step.isEndOfWord) {
                node.classList.add('terminal-node');
                node.title = `'${step.char}' (Complete Word)`;
            } else {
                node.classList.add('match-node');
                node.title = `'${step.char}' (Prefix Match)`;
            }
        } else {
            node.classList.add('missing-node');
            node.title = `'${step.char}' (Node not found in Trie)`;
            allExist = false;
        }

        node.textContent = step.char;
        nodePathTrack.appendChild(node);
    });

    // Update status text
    if (pathData.length === 0) {
        vizStatus.textContent = "Awaiting query...";
        vizStatus.style.color = "var(--text-dim)";
    } else if (allExist) {
        vizStatus.textContent = `Valid Prefix Path: ${resultCount} subtree word(s)`;
        vizStatus.style.color = "var(--accent-emerald)";
    } else {
        vizStatus.textContent = `Branch break: path does not exist in Trie`;
        vizStatus.style.color = "var(--accent-rose)";
    }
}

/**
 * Resets the traversal visualizer to its default state.
 */
function resetTraversalVisualizer() {
    if (!nodePathTrack || !vizStatus) return;
    nodePathTrack.innerHTML = `
        <div class="path-node root-node active">
            <span class="node-badge">ROOT</span>
        </div>
        <span class="path-placeholder">Type letters above to see the Trie node traversal path</span>
    `;
    vizStatus.textContent = "Awaiting query...";
    vizStatus.style.color = "var(--text-dim)";
}

// ==========================================================================
// 7. Dictionary Management (Add, Delete, Filter, Reset)
// ==========================================================================

/**
 * Validates and adds a new word into the Trie.
 * @param {string} rawWord - The word to insert
 */
function addWordToTrie(rawWord) {
    if (!rawWord) {
        showFeedback("Please enter a word to insert.", "error");
        return false;
    }

    const word = rawWord.trim().toLowerCase();

    // Validation: Only alphabetic letters allowed (beginner-friendly clean dictionary)
    if (!/^[a-zA-Z]+$/.test(word)) {
        showFeedback("Word must contain only alphabet letters (a-z).", "error");
        return false;
    }

    if (word.length < 2) {
        showFeedback("Word must be at least 2 characters long.", "error");
        return false;
    }

    // Check if word already exists in the Trie
    if (trie.search(word)) {
        showFeedback(`"${word}" already exists in the Trie dictionary!`, "error");
        return false;
    }

    // Insert word into Trie data structure
    const inserted = trie.insert(word);
    if (inserted) {
        saveDictionaryToStorage();
        updateWordCountDisplay();
        renderDictionaryWordsList(dictFilterInput ? dictFilterInput.value : '');

        showFeedback(`Successfully added "${word}" to Trie!`, "success");
        showToast(`Added "${word}" to dictionary (O(L) insertion)`, "success");

        if (newWordInput) newWordInput.value = '';
        return true;
    }

    return false;
}

/**
 * Deletes a word from the Trie.
 * @param {string} word - The word to remove
 */
function deleteWordFromTrie(word) {
    if (!word) return;

    const deleted = trie.delete(word);
    if (deleted) {
        saveDictionaryToStorage();
        updateWordCountDisplay();
        renderDictionaryWordsList(dictFilterInput ? dictFilterInput.value : '');

        showToast(`Deleted "${word}" from Trie dictionary`, "danger");

        // Refresh search if user was currently typing
        if (searchInput.value.trim().length > 0) {
            handleSearchInput();
        }
    } else {
        showToast(`Could not find "${word}" in Trie`, "error");
    }
}

/**
 * Displays temporary feedback below the Add Word input.
 */
function showFeedback(message, type) {
    if (!addFeedback) return;
    addFeedback.textContent = message;
    addFeedback.className = `input-feedback ${type}`;

    setTimeout(() => {
        if (addFeedback.textContent === message) {
            addFeedback.textContent = '';
            addFeedback.className = 'input-feedback';
        }
    }, 4000);
}

/**
 * Renders the interactive word chips list in the Dictionary Browser.
 * @param {string} filterText - Optional filter string to narrow the list
 */
function renderDictionaryWordsList(filterText = '') {
    if (!wordsContainer) return;

    wordsContainer.innerHTML = '';
    const allWords = trie.getAllWords();
    const cleanFilter = filterText.trim().toLowerCase();

    const filteredWords = cleanFilter.length > 0
        ? allWords.filter(w => w.includes(cleanFilter))
        : allWords;

    if (filteredWords.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-words-placeholder';
        empty.textContent = cleanFilter.length > 0 
            ? `No stored words match "${cleanFilter}"` 
            : `Dictionary is empty. Add words above!`;
        wordsContainer.appendChild(empty);
        return;
    }

    // Render word chips with delete buttons
    filteredWords.forEach(word => {
        const chip = document.createElement('div');
        chip.className = 'word-chip';
        chip.innerHTML = `
            <span>${escapeHtml(word)}</span>
            <button type="button" class="word-chip-delete-btn" title="Delete '${escapeHtml(word)}' from Trie" aria-label="Delete ${escapeHtml(word)}">
                &times;
            </button>
        `;

        // Click delete button
        const delBtn = chip.querySelector('.word-chip-delete-btn');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteWordFromTrie(word);
        });

        // Click chip to search word directly
        chip.addEventListener('click', () => {
            searchInput.value = word;
            handleSearchInput();
            selectWord(word);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        wordsContainer.appendChild(chip);
    });
}

/**
 * Resets the dictionary to the original default list.
 */
function resetDictionaryToDefaults() {
    if (confirm("Reset dictionary to default example words? This will overwrite custom additions.")) {
        trie.clear();
        for (const word of DEFAULT_WORDS) {
            trie.insert(word);
        }
        saveDictionaryToStorage();
        updateWordCountDisplay();
        renderDictionaryWordsList();
        clearSearch();
        showToast("Dictionary restored to defaults!", "info");
    }
}

// ==========================================================================
// 8. Toast Notification System
// ==========================================================================

/**
 * Displays a non-intrusive floating toast message.
 * @param {string} message - Message text
 * @param {'success'|'danger'|'info'} type - Toast type
 */
function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Pick appropriate icon based on type
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
        iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
        iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
        <span class="toast-icon">${iconSvg}</span>
        <span class="toast-text">${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove toast after animation completes (3 seconds)
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3100);
}

// ==========================================================================
// 9. Utility Helpers
// ==========================================================================

/**
 * Escapes HTML characters to prevent XSS vulnerabilities.
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================================================
// 10. Event Listeners & Bootstrapping
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Trie with data
    initDictionary();

    // 2. Real-time search input listener
    searchInput.addEventListener('input', handleSearchInput);

    // 3. Keyboard navigation in search input (Arrows, Enter, Escape)
    searchInput.addEventListener('keydown', handleSearchKeydown);

    // 4. Focus input opens suggestions if text already exists
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 0) {
            handleSearchInput();
        }
    });

    // 5. Clear search button
    clearSearchBtn.addEventListener('click', clearSearch);

    // 6. Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchWrapper.contains(e.target)) {
            hideSuggestions();
        }
    });

    // 7. Global Keyboard Shortcut: '/' to focus search input
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== newWordInput && document.activeElement !== dictFilterInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    // 8. Quick Prefix preset tags
    if (quickTags) {
        quickTags.addEventListener('click', (e) => {
            const btn = e.target.closest('.tag-btn');
            if (btn) {
                const prefix = btn.getAttribute('data-prefix');
                searchInput.value = prefix;
                searchInput.focus();
                handleSearchInput();
            }
        });
    }

    // 9. Quick Add preset chips in Dictionary section
    document.querySelectorAll('.quick-add-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const word = chip.getAttribute('data-word');
            addWordToTrie(word);
        });
    });

    // 10. Add Word Form submission
    if (addWordForm) {
        addWordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addWordToTrie(newWordInput.value);
        });
    }

    // 11. Dictionary list filter input
    if (dictFilterInput) {
        dictFilterInput.addEventListener('input', () => {
            renderDictionaryWordsList(dictFilterInput.value);
        });
    }

    // 12. Reset Dictionary Button
    if (resetDictBtn) {
        resetDictBtn.addEventListener('click', resetDictionaryToDefaults);
    }

    // 13. Word selected banner close
    if (bannerCloseBtn) {
        bannerCloseBtn.addEventListener('click', () => {
            wordSelectedBanner.classList.add('hidden');
        });
    }

    console.log("🚀 TrieSearch Engine initialized successfully with", trie.wordCount, "words in memory.");
});
