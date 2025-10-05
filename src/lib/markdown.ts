import React, { useState, useEffect } from 'react';
import { Source_Code_Pro } from 'next/font/google';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Load Source Code Pro font for code blocks and inline code
const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

/**
 * Firebase Storage Image Component
 * Converts gs:// URLs to HTTPS URLs
 */
const FirebaseStorageImage: React.FC<{ gsUrl: string; alt: string; className: string }> = ({ gsUrl, alt, className }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const convertUrl = async () => {
      try {
        const url = await getDownloadURL(ref(storage, gsUrl));
        setImageUrl(url);
      } catch (err) {
        console.error('Failed to load image from Firebase Storage:', err);
        setError(true);
      }
    };

    convertUrl();
  }, [gsUrl]);

  if (error) {
    return React.createElement('span', { className: 'text-red-500 text-xs' }, `[画像読み込みエラー: ${alt}]`);
  }

  if (!imageUrl) {
    return React.createElement('span', { className: 'text-gray-400 text-xs' }, '[画像読み込み中...]');
  }

  return React.createElement('img', {
    src: imageUrl,
    alt,
    className
  });
};

/**
 * Parse markdown text and return React nodes
 * Supports tables, code blocks, lists, bold, italic, underline, inline code, images, and line breaks
 */
export const parseMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;

  // Check if it's a markdown table
  if (text.includes('|') && text.includes('\n')) {
    const lines = text.trim().split('\n');

    if (lines.length >= 2) {
      // Check first line has at least 2 columns (1 pipe separator)
      const firstLineColumns = lines[0].split('|').filter(col => col.trim() !== '').length;
      // Check second line is separator with ---
      const hasTableSeparator = lines[1].includes('---') && lines[1].includes('|');

      if (firstLineColumns >= 2 && hasTableSeparator) {
        return parseMarkdownTable(text);
      }
    }
  }

  // Check for headings(#, ##, ###, etc.)
  if (hasHeadingPattern(text)) {
    return parseWithHeadings(text);
  }

  // Check for code blocks
  if (text.includes('```')) {
    return parseCodeBlocks(text);
  }

  // Check for lists (unordered or ordered)
  if (hasListPattern(text)) {
    return parseListContent(text);
  }

  // Parse other markdown formatting
  return parseInlineMarkdown(text);
};

/**
 * Check if text contains heading patterns
 */
const hasHeadingPattern = (text: string): boolean => {
  const lines = text.trim().split('\n');
  return lines.some(line => {
    const trimmed = line.trim();
    // Headings: #, ##, ###, ####, etc.
    return /^#{1,6}\s/.test(trimmed);
  });
};

/**
 * Check if text contains list patterns
 */
const hasListPattern = (text: string): boolean => {
  const lines = text.trim().split('\n');
  return lines.some(line => {
    const trimmed = line.trim();
    // Unordered list: -, *, +
    if (/^[-*+]\s/.test(trimmed)) return true;
    // Ordered list: 1., 2., etc.
    if (/^\d+\.\s/.test(trimmed)) return true;
    return false;
  });
};

/**
 * Parse content with headings
 */
const parseWithHeadings = (text: string): React.ReactNode => {
  const lines = text.trim().split('\n');
  const result: React.ReactNode[] = [];
  let nonHeadingLines: string[] = [];
  let key = 0;

  const flushNonHeadingLines = () => {
    if (nonHeadingLines.length > 0) {
      const content = nonHeadingLines.join('\n').trim();
      if (content) {
        // Recursively parse the non-heading content for other markdown
        const parsed = parseMarkdown(content);
        result.push(
          React.createElement('div', { key: `content-${key++}` }, parsed)
        );
      }
      nonHeadingLines = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);

    if (headingMatch) {
      // Flush any accumulated non-heading content
      flushNonHeadingLines();

      // Create heading element
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const headingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

      // Apply appropriate styling based on heading level
      const headingClasses = {
        h1: 'text-xl font-bold text-gray-900 mt-5 mb-3',
        h2: 'text-lg font-bold text-gray-900 mt-4 mb-2',
        h3: 'text-base font-semibold text-gray-900 mt-3 mb-2',
        h4: 'text-sm font-semibold text-gray-800 mt-3 mb-1',
        h5: 'text-sm font-semibold text-gray-800 mt-2 mb-1',
        h6: 'text-xs font-semibold text-gray-700 mt-2 mb-1',
      };

      result.push(
        React.createElement(
          headingTag,
          { key: `heading-${key++}`, className: headingClasses[headingTag] },
          parseInlineMarkdownSingleLine(headingText)
        )
      );
    } else {
      // Accumulate non-heading content
      nonHeadingLines.push(line);
    }
  }

  // Flush any remaining non-heading content
  flushNonHeadingLines();

  return React.createElement(React.Fragment, null, ...result);
};

/**
 * Parse list content (both ordered and unordered)
 */
const parseListContent = (text: string): React.ReactNode => {
  const lines = text.trim().split('\n');
  const result: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let nonListLines: string[] = [];
  let key = 0;

  const flushNonListLines = () => {
    if (nonListLines.length > 0) {
      result.push(
        React.createElement(
          'div',
          { key: `text-${key++}`, className: 'mb-2' },
          parseInlineMarkdown(nonListLines.join('\n'))
        )
      );
      nonListLines = [];
    }
  };

  const flushCurrentList = () => {
    if (currentList && currentList.items.length > 0) {
      const listElement = React.createElement(
        currentList.type,
        {
          key: `list-${key++}`,
          className: currentList.type === 'ul'
            ? 'list-disc list-inside mb-2 space-y-0.5'
            : 'list-decimal list-inside mb-2 space-y-0.5'
        },
        currentList.items.map((item, index) =>
          React.createElement(
            'li',
            { key: index, className: 'text-gray-700' },
            parseInlineMarkdown(item)
          )
        )
      );
      result.push(listElement);
      currentList = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for unordered list item
    const unorderedMatch = trimmed.match(/^[-*+]\s(.*)$/);
    if (unorderedMatch) {
      flushNonListLines();
      if (currentList?.type !== 'ul') {
        flushCurrentList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(unorderedMatch[1]);
      continue;
    }

    // Check for ordered list item
    const orderedMatch = trimmed.match(/^\d+\.\s(.*)$/);
    if (orderedMatch) {
      flushNonListLines();
      if (currentList?.type !== 'ol') {
        flushCurrentList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(orderedMatch[1]);
      continue;
    }

    // Not a list item
    flushCurrentList();
    nonListLines.push(line);
  }

  // Flush remaining content
  flushCurrentList();
  flushNonListLines();

  return React.createElement(React.Fragment, null, ...result);
};

/**
 * Parse markdown table format
 * Format: | Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |
 */
export const parseMarkdownTable = (text: string): React.ReactNode => {
  const lines = text.trim().split('\n');
  if (lines.length < 3) return parseInlineMarkdown(text);

  const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
  const rows = lines.slice(2).map(line =>
    line.split('|').map(cell => cell.trim()).filter(cell => cell)
  );

  return React.createElement(
    'div',
    { className: 'overflow-x-auto my-4' },
    React.createElement(
      'table',
      { className: 'min-w-full divide-y divide-gray-300 border border-gray-300' },
      React.createElement(
        'thead',
        { className: 'bg-gray-100' },
        React.createElement(
          'tr',
          null,
          headers.map((header, index) =>
            React.createElement(
              'th',
              {
                key: index,
                className: 'px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300 last:border-r-0'
              },
              parseInlineMarkdown(header)
            )
          )
        )
      ),
      React.createElement(
        'tbody',
        { className: 'bg-white divide-y divide-gray-200' },
        rows.map((row, rowIndex) =>
          React.createElement(
            'tr',
            {
              key: rowIndex,
              className: rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            },
            row.map((cell, cellIndex) =>
              React.createElement(
                'td',
                {
                  key: cellIndex,
                  className: 'px-4 py-2 text-sm text-gray-800 border-r border-gray-200 last:border-r-0'
                },
                parseInlineMarkdown(cell)
              )
            )
          )
        )
      )
    )
  );
};

/**
 * Parse code blocks with syntax highlighting styles
 * Format: ```language\ncode\n```
 */
export const parseCodeBlocks = (text: string): React.ReactNode => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      parts.push(
        React.createElement(
          'div',
          { key: `text-${key++}`, className: 'mb-2' },
          parseInlineMarkdown(beforeText)
        )
      );
    }

    // Code block
    const language = match[1] || 'text';
    const code = match[2];
    parts.push(
      React.createElement(
        'div',
        { key: `code-${key++}`, className: 'bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm mt-4' },
        React.createElement(
          'div',
          { className: 'bg-gray-100 px-3 py-1.5 border-b border-gray-300 flex items-center justify-between' },
          React.createElement(
            'span',
            { className: 'text-xs text-gray-600 font-mono' },
            language
          )
        ),
        React.createElement(
          'pre',
          { className: `p-3 overflow-x-auto bg-gray-50 ${sourceCodePro.className}` },
          React.createElement(
            'code',
            {
              className: 'text-xs text-gray-800'
            },
            code
          )
        )
      )
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(
      React.createElement(
        'div',
        { key: `text-${key++}`, className: 'mb-2' },
        parseInlineMarkdown(remainingText)
      )
    );
  }

  return React.createElement(React.Fragment, null, ...parts);
};


/**
 * Parse inline markdown formatting
 * Supports: **bold**, *italic*, __underline__, `code`, (image名前)[url], and paragraphs
 */
export const parseInlineMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;

  // Split into paragraphs (double newlines) and single lines
  const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');

  if (paragraphs.length > 1) {
    // Multiple paragraphs - wrap each in <p>
    return React.createElement(
      React.Fragment,
      null,
      ...paragraphs.map((paragraph, index) => {
        const processedParagraph = parseInlineMarkdownLines(paragraph);
        return React.createElement(
          'p',
          { key: index, className: 'mb-3 last:mb-0' },
          processedParagraph
        );
      })
    );
  }

  // Single paragraph or lines - handle line breaks within it
  return parseInlineMarkdownLines(text);
};

/**
 * Parse markdown for single paragraph with line breaks
 */
const parseInlineMarkdownLines = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  if (lines.length > 1) {
    return React.createElement(
      React.Fragment,
      null,
      ...lines.map((line, index) => {
        const processedLine = parseInlineMarkdownSingleLine(line);
        if (index < lines.length - 1) {
          return React.createElement(
            React.Fragment,
            { key: index },
            processedLine,
            React.createElement('br', { key: `br-${index}` })
          );
        }
        return React.createElement(React.Fragment, { key: index }, processedLine);
      })
    );
  }

  return parseInlineMarkdownSingleLine(text);
};

/**
 * Parse inline markdown formatting for a single line
 * Supports: **bold**, *italic*, `code`, __underline__, (image名前)[url]
 */
const parseInlineMarkdownSingleLine = (text: string): React.ReactNode => {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let key = 0;

  // Combined regex for all markdown patterns - optimized for performance
  // Added: __(text)__ for underline, (image...)[url] for images
  const markdownRegex = /(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*]+)\*)|(`([^`]+)`)|(\(image([^)]+)\)\[([^\]]+)\])/g;
  let lastIndex = 0;
  let match;

  while ((match = markdownRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Process the matched markdown
    if (match[1]) {
      // Bold (**text**)
      parts.push(React.createElement('strong', { key: key++ }, match[2]));
    } else if (match[3]) {
      // Underline (__text__)
      parts.push(
        React.createElement(
          'u',
          { key: key++, className: 'underline decoration-1' },
          match[4]
        )
      );
    } else if (match[5]) {
      // Italic (*text*)
      parts.push(React.createElement('em', { key: key++ }, match[6]));
    } else if (match[7]) {
      // Code (`text`)
      parts.push(
        React.createElement(
          'code',
          {
            key: key++,
            className: `bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs border border-gray-200 ${sourceCodePro.className}`
          },
          match[8]
        )
      );
    } else if (match[9]) {
      // Image: (image名前)[url]
      const imageName = match[10];
      const url = match[11];

      // gs://から始まる場合はFirebaseStorageImageコンポーネントを使用
      if (url.startsWith('gs://')) {
        parts.push(
          React.createElement(FirebaseStorageImage, {
            key: key++,
            gsUrl: url,
            alt: imageName,
            className: 'inline-block max-w-full h-auto my-2 rounded border border-gray-200'
          })
        );
      } else {
        // 通常のHTTP/HTTPS URLの場合は直接imgタグを生成
        parts.push(
          React.createElement('img', {
            key: key++,
            src: url,
            alt: imageName,
            className: 'inline-block max-w-full h-auto my-2 rounded border border-gray-200'
          })
        );
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no markdown was found, return the original text
  if (parts.length === 0) {
    return text;
  }

  return React.createElement(React.Fragment, null, ...parts);
};