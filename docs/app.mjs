/**
 * MVT Attribute Lister - Main Application
 * Fetches and parses Mapbox Vector Tiles to display attribute information
 */

import { fetchAndAnalyzeTile } from './mvt-parser.mjs';
import { downloadCSV, downloadMarkdown } from './exporter.mjs';
import { getElements, showStatus, hideStatus, renderResults } from './ui.mjs';

// DOM Elements
const elements = getElements();

// State
let currentData = null;

/**
 * Get current sample limit from input
 * @returns {number} Sample limit value
 */
function getSampleLimit() {
  return parseInt(elements.sampleCountInput.value) || 5;
}

/**
 * Get show all values setting
 * @returns {boolean} Whether to show all values
 */
function getShowAll() {
  return elements.showAllValuesCheckbox.checked;
}

/**
 * Main fetch and analyze handler
 */
async function handleFetch() {
  const url = elements.urlInput.value.trim();
  
  if (!url) {
    showStatus(elements.statusDiv, 'URLを入力してください。', 'error');
    return;
  }
  
  try {
    showStatus(elements.statusDiv, 'タイルを取得・解析中...', 'loading');
    elements.fetchBtn.disabled = true;
    
    currentData = await fetchAndAnalyzeTile(url);
    
    renderResults(
      elements.resultsDiv,
      currentData,
      getSampleLimit(),
      getShowAll(),
      downloadCSV,
      downloadMarkdown
    );
    
    showStatus(elements.statusDiv, '解析完了!', 'success');
    setTimeout(() => hideStatus(elements.statusDiv), 2000);
    
  } catch (error) {
    console.error('Error:', error);
    showStatus(elements.statusDiv, `エラー: ${error.message}`, 'error');
  } finally {
    elements.fetchBtn.disabled = false;
  }
}

/**
 * Handle option changes
 */
function handleOptionsChange() {
  if (currentData) {
    renderResults(
      elements.resultsDiv,
      currentData,
      getSampleLimit(),
      getShowAll(),
      downloadCSV,
      downloadMarkdown
    );
  }
}

// Event listeners
elements.fetchBtn.addEventListener('click', handleFetch);
elements.urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleFetch();
});
elements.sampleCountInput.addEventListener('change', handleOptionsChange);
elements.showAllValuesCheckbox.addEventListener('change', handleOptionsChange);
