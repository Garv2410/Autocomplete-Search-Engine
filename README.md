# ⚡ TrieSearch - Autocomplete Search Engine

An ultra-fast, modern **Autocomplete Search Engine** built with pure **HTML5, Vanilla CSS, and JavaScript (ES6+)**. The core typeahead search algorithm is powered by the **Trie (Prefix Tree)** data structure utilizing **Depth-First Search (DFS)** traversal to retrieve word recommendations in real time without resorting to naive array filtering.

---

## 📋 Table of Contents
1. [Overview & Main Goal](#overview--main-goal)
2. [What is a Trie (Prefix Tree)?](#what-is-a-trie-prefix-tree)
3. [Key Features](#key-features)
4. [DSA Architecture & Implementation](#dsa-architecture--implementation)
5. [Autocomplete Example Walkthrough](#autocomplete-example-walkthrough)
6. [Time & Space Complexity Analysis](#time--space-complexity-analysis)
7. [Trie vs Array Filter Comparison](#trie-vs-array-filter-comparison)
8. [File Structure](#file-structure)
9. [How to Run Locally](#how-to-run-locally)
10. [Technologies Used](#technologies-used)

---

## 🎯 Overview & Main Goal
The primary objective of this project is to implement a responsive search box that dynamically yields prefix-based word suggestions as the user types.

Unlike rudimentary search inputs that execute `array.filter(word => word.startsWith(query))` (which forces an $O(N \times L)$ scan over every stored string on every keystroke), this project implements an industry-standard **Trie (Prefix Tree)** from scratch in Vanilla JavaScript. The autocomplete engine navigates directly down the tree branch corresponding to the input prefix and executes a localized **Depth-First Search (DFS)** to collect valid suggestions in $O(P + K)$ time.

---

## 🌳 What is a Trie (Prefix Tree)?
A **Trie** (derived from the word re**trie**val) is an ordered tree-like search data structure where keys are typically strings.

### Fundamental Principles:
1. **Node Structure:** Unlike binary trees, nodes in a Trie do not store the whole word. Instead, each node holds a character and references (`children`) to next possible characters.
2. **The Root Node:** The root represents the empty prefix `""`.
3. **Shared Prefixes:** Words with common beginnings share ancestral nodes. For example, `"program"`, `"programmer"`, and `"programming"` share the exact same sequence of nodes for `"program"`.
4. **End-of-Word Flag (`isEndOfWord`):** A boolean flag marking nodes where a complete, valid dictionary word terminates.

```
                           [ (ROOT) ]
                                |
                              [ 'p' ]
                                |
                              [ 'r' ]
                                |
                              [ 'o' ]
                                |
                              [ 'g' ] <-- Prefix "prog" ends here (DFS root)
                             /     \
                       [ 'r' ]     [ 'e' ]
                          |           |
                       [ 'a' ]     [ 's' ]
                          |           |
                       [ 'm' ]*    [ 's' ]*  --> "progress"
                      /       \
               [ 'e' ]         [ 'm' ]
                  |               |
               [ 'r' ]*        [ 'i' ]
                  |               |
              "programmer"     [ 'n' ]
                                  |
                               [ 'g' ]*  --> "programming"

   * Indicates isEndOfWord = true
```

---

## ✨ Key Features
1. **Interactive Search Input:** Clean, modern search bar with instant typeahead suggestions.
2. **Prefix-Based Autocomplete:** Real-time recommendations powered by Trie DFS traversal.
3. **Prefix Highlighting:** The typed prefix is highlighted with a vivid neon accent inside each suggestion.
4. **Click-to-Select & Keyboard Navigation:**
   - Use <kbd>&darr;</kbd> and <kbd>&uarr;</kbd> arrows to browse recommendations.
   - Press <kbd>Enter</kbd> to select.
   - Press <kbd>Esc</kbd> to dismiss the dropdown.
   - Press <kbd>/</kbd> anywhere on the page to focus the search box.
5. **Add New Words:** Insert custom words into the Trie with input validation and instant feedback.
6. **Delete Words with Node Pruning:** Remove words cleanly from the Trie; unused branch nodes are pruned recursively to preserve memory.
7. **Empty State Handling:** Displays an informative message when no suggestions match the prefix, including a 1-click **"+ Add to Dictionary"** shortcut.
8. **Real-time Dictionary Counter:** Live pill badge displaying the exact number of words indexed in the Trie.
9. **Live Trie Traversal Trace:** Visual breadcrumb component that tracks how the Trie descends character by character (e.g., `ROOT ➔ p ➔ r ➔ o ➔ g`).
10. **Persistent Storage:** Synchronizes all dictionary modifications (insertions, deletions, resets) with browser `localStorage`.
11. **Comprehensive Explainer & Complexity Cards:** Dedicated UI sections explaining the algorithmic mechanics and Big-O efficiency.
12. **Quick Preset Filters:** Pre-configured buttons to test common prefixes like `prog`, `py`, and `alg`.

---

## 🧠 DSA Architecture & Implementation

### 1. `TrieNode` Class (`trie.js`)
```javascript
class TrieNode {
    constructor(char = '') {
        this.char = char;          // Character stored at this node
        this.children = {};        // Map of character -> TrieNode
        this.isEndOfWord = false;  // True if node represents end of a valid word
        this.word = null;          // Cached full word string for O(1) leaf retrieval
    }
}
```

### 2. `Trie` Class Methods (`trie.js`)
- **`insert(word)`:** Iterates through each character in the word. If a child node doesn't exist, it instantiates a new `TrieNode`. At the final character, it flags `isEndOfWord = true` and increments `wordCount`.
- **`search(word)`:** Traverses matching character nodes. Returns `true` if and only if the final node exists and has `isEndOfWord === true`.
- **`startsWith(prefix)`:** Validates whether any branch exists that starts with the given prefix string.
- **`autocomplete(prefix, maxResults)`:**
  1. Traverses down the tree to the node matching the last letter of the `prefix`.
  2. If the prefix does not exist, returns `[]`.
  3. Calls `_dfs(currentNode, results, maxResults)` to explore all descendant branches and collect words.
- **`_dfs(node, results, maxResults)`:** Recursive Depth-First Search exploring all child keys alphabetically. When `node.isEndOfWord` is true, the stored word is added to results.
- **`delete(word)`:** Recursively descends to the target word, unflags `isEndOfWord`, decrements `wordCount`, and prunes childless nodes bottom-up.
- **`getAllWords()`:** Runs a full DFS from the root to extract all active words in alphabetical order.

---

## 🔍 Autocomplete Example Walkthrough

### Scenario
The dictionary contains:
- `programming`
- `program`
- `programmer`
- `progress`
- `project`
- `python`

### User types: `"prog"`

1. **Step 1 (Prefix Navigation):**
   - Starts at `root`.
   - Visits `root.children['p']` &rarr; `children['r']` &rarr; `children['o']` &rarr; `children['g']`.
   - Node `'g'` is reached in **4 operations** ($O(P)$ where $P = 4$).

2. **Step 2 (DFS Subtree Traversal):**
   - The algorithm initiates `_dfs` starting at node `'g'`.
   - Traverses subtree child `'r'`: finds `program` (`isEndOfWord = true`), `programmer`, `programming`.
   - Traverses subtree child `'e'`: finds `progress`.
   - Traverses other children under `'o'`: finds `project`.
   - Words like `"python"` are skipped entirely because their path branched off under `'y'`, saving unnecessary comparisons.

3. **Output Displayed:**
   - **`prog`**`ram`
   - **`prog`**`rammer`
   - **`prog`**`ramming`
   - **`prog`**`ress`
   - **`prog`**`ject`

---

## ⏱️ Time & Space Complexity Analysis

| Operation | Time Complexity | Space Complexity | Explanation |
| :--- | :---: | :---: | :--- |
| **Insertion** | $\mathcal{O}(L)$ | $\mathcal{O}(L)$ (Worst Case) | $L$ is the length of the inserted word. Creates nodes only for missing characters. |
| **Exact Search** | $\mathcal{O}(L)$ | $\mathcal{O}(1)$ | Directly follows character references down to length $L$. |
| **Prefix Check (`startsWith`)** | $\mathcal{O}(P)$ | $\mathcal{O}(1)$ | $P$ is prefix length. Stops immediately once prefix path matches. |
| **Autocomplete Suggestions** | $\mathcal{O}(P + K)$ | $\mathcal{O}(K)$ | $P$ steps to locate prefix root, then visits $K$ nodes in the subtree during DFS. |
| **Deletion** | $\mathcal{O}(L)$ | $\mathcal{O}(L)$ (Call Stack) | Reaches leaf in $L$ steps and unwinds call stack to prune parentless nodes. |
| **Overall Tree Space** | &mdash; | $\mathcal{O}(N \times L \times \Sigma)$ | $N$ is word count, $L$ is avg length, $\Sigma$ is alphabet size. Shared prefixes reduce practical consumption. |

> **Note:** The time complexity of Trie autocomplete is **completely independent of the total number of words ($N$)** in the dictionary. Whether the dictionary holds 100 words or 1,000,000 words, searching `"prog"` only explores the `'prog'` subtree!

---

## ⚖️ Trie vs Array Filter Comparison

| Feature / Metric | Trie (Prefix Tree) | Naive Array Filter (`array.filter`) |
| :--- | :--- | :--- |
| **Keystroke Query Complexity** | **$\mathcal{O}(P + K)$** &mdash; Visits only matching subtree nodes | **$\mathcal{O}(N \times P)$** &mdash; Scans every string in the entire list |
| **Scaling to 1,000,000 Words** | **< 1 ms** &mdash; Instant response time | **Laggy / UI stutter** &mdash; 1 million string comparisons per keystroke |
| **Memory Redundancy** | **Low** &mdash; Shared prefixes stored only once | **High** &mdash; Common prefixes duplicated across entries |
| **Output Ordering** | **Natural** &mdash; Alphabetical ordering via DFS traversal | **Requires separate Sort** &mdash; Extra $\mathcal{O}(M \log M)$ overhead |

---

## 📁 File Structure
```
Search/
│
├── index.html        # Main HTML5 structure with semantic tags & accessibility
├── style.css         # Modern dark design system, glassmorphism, responsive grid
├── trie.js           # Core TrieNode & Trie data structure implementations
├── app.js            # UI controller, event handlers, DFS visualizer & localStorage
└── README.md         # Comprehensive project documentation and complexity guide
```

---

## 🚀 How to Run Locally

Because this project is built with standard HTML, CSS, and Vanilla JavaScript with **zero external build tools or backend dependencies**, you can run it right away:

### Option 1: Direct File Open
Double-click `index.html` or open it directly in any modern browser (Chrome, Firefox, Edge, Safari).

### Option 2: Using VS Code Live Server
1. Open the `Search` folder in Visual Studio Code.
2. Right-click `index.html` and click **"Open with Live Server"**.

### Option 3: Using Python HTTP Server
```bash
# In the project root directory:
python -m http.server 3000
```
Then navigate to `http://localhost:3000` in your web browser.

---

## 🛠️ Technologies Used
- **HTML5:** Semantic architecture, accessible ARIA attributes (`aria-autocomplete`, `aria-controls`, `role="listbox"`).
- **Vanilla CSS:** Custom CSS variables, responsive CSS Grid / Flexbox, glassmorphic dark styling, keyframe animations.
- **Vanilla JavaScript (ES6+):** Object-oriented Trie implementation, Depth-First Search recursion, event delegation.
- **Web Storage API:** `localStorage` for offline persistent dictionary management.
- **Typography:** Google Fonts (*Plus Jakarta Sans* & *JetBrains Mono*).
