/**
 * Export Module
 * Handles CSV and Markdown generation and file download
 */

import { CONFIG, MIME_TYPES } from './config.mjs';

/**
 * Format sample values for display/export
 * @param {Array} values - Array of {value, count} objects
 * @param {number} limit - Maximum number of values to show
 * @param {boolean} showAll - Whether to show all values
 * @returns {string} Formatted sample values
 */
export function formatSampleValues(values, limit, showAll) {
  const displayValues = showAll ? values : values.slice(0, limit);
  return displayValues.map(v => `${v.value} (${v.count})`).join(', ');
}

/**
 * Escape a value for CSV
 * Handles quotes, newlines, and commas
 * @param {string} value - Value to escape
 * @returns {string} Escaped value with surrounding quotes
 */
function escapeCsvValue(value) {
  if (value == null) return '""';
  const str = String(value);
  // Replace double quotes with two double quotes, then wrap in quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generate CSV content for a layer
 * @param {string} layerName - Layer name
 * @param {Object} layerInfo - Layer analysis data
 * @returns {string} CSV content
 */
export function generateCSV(layerName, layerInfo) {
  const lines = ['key,types,count,sample_values'];
  
  for (const attr of layerInfo.attributes) {
    const key = escapeCsvValue(attr.key);
    const types = escapeCsvValue(attr.types.join(';'));
    const sampleValues = escapeCsvValue(
      attr.values
        .slice(0, CONFIG.MAX_SAMPLE_VALUES_CSV)
        .map(v => String(v.value))
        .join(';')
    );
    
    lines.push(`${key},${types},${attr.count},${sampleValues}`);
  }
  
  return lines.join('\n');
}

/**
 * Escape special Markdown characters for table cells
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeMarkdown(value) {
  if (value == null) return '';
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Generate Markdown content for a layer
 * @param {string} layerName - Layer name
 * @param {Object} layerInfo - Layer analysis data
 * @param {number} sampleLimit - Number of sample values
 * @param {boolean} showAll - Whether to show all values
 * @returns {string} Markdown content
 */
export function generateMarkdown(layerName, layerInfo, sampleLimit, showAll) {
  let md = `# Layer: ${escapeMarkdown(layerName)}\n\n`;
  md += `- **Features**: ${layerInfo.featureCount}\n`;
  md += `- **Version**: ${layerInfo.version}\n`;
  md += `- **Extent**: ${layerInfo.extent}\n\n`;
  md += `## Attributes\n\n`;
  md += `| Key | Types | Count | Sample Values |\n`;
  md += `|-----|-------|-------|---------------|\n`;
  
  for (const attr of layerInfo.attributes) {
    const key = escapeMarkdown(attr.key);
    const types = escapeMarkdown(attr.types.join(', '));
    const samples = escapeMarkdown(formatSampleValues(attr.values, sampleLimit, showAll));
    md += `| ${key} | ${types} | ${attr.count} | ${samples} |\n`;
  }
  
  return md;
}

/**
 * Download file to user's computer
 * @param {string} filename - File name
 * @param {string} content - File content
 * @param {string} mimeType - MIME type
 */
export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download CSV for a layer
 * @param {string} layerName - Layer name
 * @param {Object} layerInfo - Layer analysis data
 */
export function downloadCSV(layerName, layerInfo) {
  const csv = generateCSV(layerName, layerInfo);
  downloadFile(`${layerName}_attributes.csv`, csv, MIME_TYPES.CSV);
}

/**
 * Download Markdown for a layer
 * @param {string} layerName - Layer name
 * @param {Object} layerInfo - Layer analysis data
 * @param {number} sampleLimit - Number of sample values
 * @param {boolean} showAll - Whether to show all values
 */
export function downloadMarkdown(layerName, layerInfo, sampleLimit, showAll) {
  const md = generateMarkdown(layerName, layerInfo, sampleLimit, showAll);
  downloadFile(`${layerName}_attributes.md`, md, MIME_TYPES.MARKDOWN);
}
