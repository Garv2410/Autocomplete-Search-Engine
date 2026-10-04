/**
 * Trie (Prefix Tree) Data Structure Implementation
 * 
 * A Trie is a tree-like data structure used to store a dynamic set or associative array
 * where the keys are usually strings. Unlike a binary search tree, no node in the tree stores
 * the key associated with that node; instead, its position in the tree defines the key with
 * which it is associated. All descendants of a node have a common prefix of the string
 * associated with that node.
 */

/**
 * TrieNode Class
 * Represents a single node within the Trie.
 */
class TrieNode {
    constructor(char = '') {
        // The character stored at this node (useful for visual tracing)
        this.char = char;
        
        // Hash map / Object of child nodes where key is the character
        // and value is an instance of TrieNode.
        this.children = {};
        
        // Flag indicating whether this node marks the complete end of a word.
        this.isEndOfWord = false;
        
        // Convenient reference to the complete word at terminal nodes.
        // Storing the word here enables O(1) word extraction during DFS.
        this.word = null;
    }
}

/**
 * Trie Class
 * Encapsulates insertion, exact search, prefix matching, deletion, and DFS autocomplete.
 */
class Trie {
    constructor() {
        // The root node contains an empty string character and represents the starting point.
        this.root = new TrieNode();
        
        // Counter to track total unique words currently in the Trie.
        this.wordCount = 0;
    }

    /**
     * Inserts a word into the Trie.
     * Time Complexity: O(L), where L is the length of the word.
     * Space Complexity: O(L) in the worst case (when adding L new nodes).
     * 
     * @param {string} word - The word to insert
     * @returns {boolean} - True if newly inserted, False if already present
     */
    insert(word) {
        if (!word || typeof word !== 'string') return false;
        
        const cleanWord = word.trim().toLowerCase();
        if (cleanWord.length === 0) return false;

        let currentNode = this.root;

        // Traverse down the tree, creating nodes for characters that do not exist yet
        for (const char of cleanWord) {
            if (!currentNode.children[char]) {
                currentNode.children[char] = new TrieNode(char);
            }
            currentNode = currentNode.children[char];
        }

        // Check if the word already existed
        if (!currentNode.isEndOfWord) {
            currentNode.isEndOfWord = true;
            currentNode.word = cleanWord;
            this.wordCount++;
            return true; // Successfully inserted new word
        }

        return false; // Word was already in the Trie
    }

    /**
     * Searches for an exact word in the Trie.
     * Time Complexity: O(L), where L is the length of the word.
     * 
     * @param {string} word - The exact word to search for
     * @returns {boolean} - True if word exists, False otherwise
     */
    search(word) {
        if (!word || typeof word !== 'string') return false;
        
        const cleanWord = word.trim().toLowerCase();
        let currentNode = this.root;

        for (const char of cleanWord) {
            if (!currentNode.children[char]) {
                return false; // Character path not found
            }
            currentNode = currentNode.children[char];
        }

        // Return true only if it is marked as the end of a valid word
        return currentNode.isEndOfWord === true;
    }

    /**
     * Checks if there is any word in the Trie that starts with the given prefix.
     * Time Complexity: O(P), where P is the length of the prefix.
     * 
     * @param {string} prefix - The prefix to check
     * @returns {boolean} - True if prefix exists, False otherwise
     */
    startsWith(prefix) {
        if (!prefix || typeof prefix !== 'string') return false;

        const cleanPrefix = prefix.trim().toLowerCase();
        let currentNode = this.root;

        for (const char of cleanPrefix) {
            if (!currentNode.children[char]) {
                return false;
            }
            currentNode = currentNode.children[char];
        }

        return true;
    }

    /**
     * Finds and returns autocomplete suggestions that start with the given prefix.
     * Step 1: Traverse to the node representing the end of the prefix.
     * Step 2: Use Depth First Search (DFS) from that node to collect all valid descendant words.
     * 
     * Time Complexity: O(P + K), where P is prefix length and K is the number of nodes visited during DFS.
     * 
     * @param {string} prefix - The prefix typed by user
     * @param {number} maxResults - Optional limit on number of suggestions
     * @returns {Array<string>} - List of matching words
     */
    autocomplete(prefix, maxResults = 10) {
        if (!prefix || typeof prefix !== 'string') return [];

        const cleanPrefix = prefix.trim().toLowerCase();
        if (cleanPrefix.length === 0) return [];

        let currentNode = this.root;

        // Step 1: Navigate to the end of the prefix
        for (const char of cleanPrefix) {
            if (!currentNode.children[char]) {
                // If prefix path doesn't exist, no words start with this prefix
                return [];
            }
            currentNode = currentNode.children[char];
        }

        // Step 2: Perform DFS traversal from the prefix end node
        const suggestions = [];
        this._dfs(currentNode, suggestions, maxResults);
        return suggestions;
    }

    /**
     * Helper method to perform Depth First Search (DFS) traversal.
     * Recursively traverses child nodes to collect all complete words.
     * 
     * @param {TrieNode} node - The starting node for DFS
     * @param {Array<string>} results - Array to accumulate found words
     * @param {number} maxResults - Maximum number of words to return
     */
    _dfs(node, results, maxResults) {
        if (!node || results.length >= maxResults) return;

        // If this node represents a complete word, add to results
        if (node.isEndOfWord && node.word) {
            results.push(node.word);
        }

        // Traverse all child nodes in alphabetical order for neat sorted suggestions
        const sortedKeys = Object.keys(node.children).sort();
        for (const char of sortedKeys) {
            this._dfs(node.children[char], results, maxResults);
            if (results.length >= maxResults) {
                break;
            }
        }
    }

    /**
     * Deletes a word from the Trie and prunes unused nodes.
     * Time Complexity: O(L), where L is the length of the word.
     * 
     * @param {string} word - The word to remove
     * @returns {boolean} - True if word was found and removed, False otherwise
     */
    delete(word) {
        if (!word || typeof word !== 'string') return false;

        const cleanWord = word.trim().toLowerCase();
        if (!this.search(cleanWord)) {
            return false; // Word does not exist in Trie
        }

        /**
         * Recursive helper function to remove the word and prune unneeded nodes.
         * @param {TrieNode} node - Current node in traversal
         * @param {string} word - Target word
         * @param {number} depth - Current character index
         * @returns {boolean} - True if child node can be deleted by its parent
         */
        const deleteHelper = (node, word, depth) => {
            if (!node) return false;

            // Base case: Reached the end of the word
            if (depth === word.length) {
                if (node.isEndOfWord) {
                    node.isEndOfWord = false;
                    node.word = null;
                    this.wordCount--;
                }
                // If node has no other children, delete it from parent
                return Object.keys(node.children).length === 0;
            }

            const char = word[depth];
            const childNode = node.children[char];
            if (!childNode) return false;

            const shouldDeleteChild = deleteHelper(childNode, word, depth + 1);

            // If the child node has no other children and is not a word end, remove it
            if (shouldDeleteChild) {
                delete node.children[char];
                // Prune current node if it's not the end of another word and has no children left
                return !node.isEndOfWord && Object.keys(node.children).length === 0;
            }

            return false;
        };

        deleteHelper(this.root, cleanWord, 0);
        return true;
    }

    /**
     * Retrieves all words currently stored in the Trie.
     * @returns {Array<string>} - Alphabetically sorted array of all stored words
     */
    getAllWords() {
        const allWords = [];
        this._dfs(this.root, allWords, Infinity);
        return allWords;
    }

    /**
     * Clears all words and resets root node.
     */
    clear() {
        this.root = new TrieNode();
        this.wordCount = 0;
    }

    /**
     * Returns the traversal path nodes for a given prefix (used for interactive visualization)
     * @param {string} prefix 
     * @returns {Array<{char: string, exists: boolean, isEndOfWord: boolean}>}
     */
    getTraversalPath(prefix) {
        if (!prefix) return [];
        const clean = prefix.trim().toLowerCase();
        const path = [];
        let curr = this.root;

        for (const char of clean) {
            if (curr && curr.children[char]) {
                curr = curr.children[char];
                path.push({
                    char: char,
                    exists: true,
                    isEndOfWord: curr.isEndOfWord
                });
            } else {
                path.push({
                    char: char,
                    exists: false,
                    isEndOfWord: false
                });
                curr = null;
            }
        }
        return path;
    }
}
