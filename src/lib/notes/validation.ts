import { NOTES_LIMITS, PATTERNS } from '@/lib/notes/constants';

/**
 * 共通バリデーション関数
 */

/**
 * noteIDの検証
 */
export function validateNoteId(noteId: string): { valid: boolean; error?: string } {
  if (!noteId) {
    return { valid: false, error: 'メモIDが指定されていません' };
  }
  
  if (!PATTERNS.NOTE_ID.test(noteId)) {
    return { valid: false, error: '不正なメモIDです' };
  }
  
  if (noteId.length > NOTES_LIMITS.NOTE_ID_MAX_LENGTH) {
    return { valid: false, error: 'メモIDが長すぎます' };
  }
  
  return { valid: true };
}

/**
 * タイトルの検証
 * 長すぎる場合は自動的に切り詰める（エラーにしない）
 */
export function validateTitle(title: string): { valid: boolean; error?: string; truncated?: string } {
  if (title.length > NOTES_LIMITS.MAX_TITLE_LENGTH) {
    // エラーではなく切り詰めた値を返す
    return { 
      valid: true,
      truncated: title.slice(0, NOTES_LIMITS.MAX_TITLE_LENGTH)
    };
  }
  
  return { valid: true };
}

/**
 * コンテンツの検証
 * 長すぎる場合は自動的に切り詰める（エラーにしない）
 */
export function validateContent(content: string): { valid: boolean; error?: string; truncated?: string } {
  if (content.length > NOTES_LIMITS.MAX_CONTENT_LENGTH) {
    // エラーではなく切り詰めた値を返す
    return { 
      valid: true,
      truncated: content.slice(0, NOTES_LIMITS.MAX_CONTENT_LENGTH)
    };
  }
  
  return { valid: true };
}

/**
 * メモ全体の検証
 */
export function validateNote(
  noteId: string, 
  title: string, 
  content: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const idValidation = validateNoteId(noteId);
  if (!idValidation.valid && idValidation.error) {
    errors.push(idValidation.error);
  }
  
  const titleValidation = validateTitle(title);
  if (!titleValidation.valid && titleValidation.error) {
    errors.push(titleValidation.error);
  }
  
  const contentValidation = validateContent(content);
  if (!contentValidation.valid && contentValidation.error) {
    errors.push(contentValidation.error);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 空メモかどうかの判定
 */
export function isEmptyNote(title: string, content: string): boolean {
  const isEmptyTitle = !title || title === '新しいメモ';
  const isEmptyContent = !content || content.trim() === '';
  
  return isEmptyTitle && isEmptyContent;
}