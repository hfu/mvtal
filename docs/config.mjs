/**
 * Configuration and Constants Module
 * Centralizes application configuration and constants
 */

/**
 * Default configuration values
 */
export const CONFIG = {
  DEFAULT_SAMPLE_LIMIT: 5,
  MAX_SAMPLE_VALUES_CSV: 10,
  STATUS_SUCCESS_TIMEOUT: 2000
};

/**
 * CSS class names used in the application
 */
export const CSS_CLASSES = {
  LAYER_SECTION: 'layer-section',
  LAYER_HEADER: 'layer-header',
  LAYER_NAME: 'layer-name',
  LAYER_INFO: 'layer-info',
  LAYER_CONTENT: 'layer-content',
  LAYER_CONTENT_EXPANDED: 'expanded',
  EXPORT_BUTTONS: 'export-buttons',
  TYPE_BADGE: 'type-badge',
  SAMPLE_VALUES: 'sample-values'
};

/**
 * Status types for UI feedback
 */
export const STATUS_TYPES = {
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success'
};

/**
 * Message strings (for i18n support)
 */
export const MESSAGES = {
  ENTER_URL: 'URLを入力してください。',
  FETCHING: 'タイルを取得・解析中...',
  COMPLETE: '解析完了!',
  NO_LAYERS: 'レイヤーが見つかりませんでした。',
  NO_ATTRIBUTES: '属性がありません。',
  ERROR_PREFIX: 'エラー: '
};

/**
 * Table headers
 */
export const TABLE_HEADERS = {
  KEY: '属性キー',
  TYPE: '型',
  COUNT: '出現回数',
  SAMPLES: 'サンプル値'
};

/**
 * MIME types for file exports
 */
export const MIME_TYPES = {
  CSV: 'text/csv;charset=utf-8',
  MARKDOWN: 'text/markdown;charset=utf-8'
};

/**
 * Value types
 */
export const VALUE_TYPES = {
  NULL: 'null',
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  STRING: 'string',
  UNKNOWN: 'unknown'
};
