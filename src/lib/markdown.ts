import React from 'react';

/**
 * Parse markdown text and return React nodes
 * Supports tables, code blocks, lists, bold, italic, inline code, and line breaks
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
            { key: index, className: 'text-gray-800' },
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
    { className: 'overflow-x-auto' },
    React.createElement(
      'table',
      { className: 'min-w-full divide-y divide-gray-200 border border-gray-300' },
      React.createElement(
        'thead',
        { className: 'bg-gray-50' },
        React.createElement(
          'tr',
          null,
          headers.map((header, index) =>
            React.createElement(
              'th',
              {
                key: index,
                className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0'
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
                  className: 'px-4 py-2 text-sm text-gray-900 border-r border-gray-200 last:border-r-0'
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
        { key: `code-${key++}`, className: 'my-2' },
        React.createElement(
          'div',
          { className: 'bg-gray-100 text-gray-600 text-xs px-3 py-1 border-b' },
          language
        ),
        React.createElement(
          'pre',
          { className: 'bg-gray-900 text-green-400 p-4 rounded-b-lg overflow-x-auto' },
          React.createElement('code', null, code)
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
 * Supports: **bold**, *italic*, `code`, and paragraphs
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
 * Supports: **bold**, *italic*, `code`
 */
const parseInlineMarkdownSingleLine = (text: string): React.ReactNode => {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let key = 0;

  // Combined regex for all markdown patterns - optimized for performance
  const markdownRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
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
      // Italic (*text*)
      parts.push(React.createElement('em', { key: key++ }, match[4]));
    } else if (match[5]) {
      // Code (`text`)
      parts.push(
        React.createElement(
          'code',
          {
            key: key++,
            className: 'bg-gray-100 px-1 py-0.5 rounded text-sm font-mono'
          },
          match[6]
        )
      );
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