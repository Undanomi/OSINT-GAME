import React from 'react';

/**
 * Parse markdown text and return React nodes
 * Supports tables, code blocks, bold, italic, inline code, and links
 */
export const parseMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;

  // Check if it's a markdown table
  if (text.includes('|') && text.includes('\n')) {
    const lines = text.trim().split('\n');
    const hasTableHeader = lines.length >= 2 && lines[1].includes('---');

    if (hasTableHeader) {
      return parseMarkdownTable(text);
    }
  }

  // Check for code blocks
  if (text.includes('```')) {
    return parseCodeBlocks(text);
  }

  // Parse other markdown formatting
  return parseInlineMarkdown(text);
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
          { key: `text-${key++}`, className: 'mb-4' },
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
        { key: `code-${key++}`, className: 'my-4' },
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
        { key: `text-${key++}`, className: 'mb-4' },
        parseInlineMarkdown(remainingText)
      )
    );
  }

  return React.createElement(React.Fragment, null, ...parts);
};


/**
 * Parse inline markdown formatting
 * Supports: **bold**, *italic*, `code`, [links](url)
 */
export const parseInlineMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;

  // Split by markdown patterns while preserving them
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let key = 0;

  while (currentText.length > 0) {
    // Bold text (**text**)
    const boldMatch = currentText.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(React.createElement('strong', { key: key++ }, boldMatch[1]));
      currentText = currentText.slice(boldMatch[0].length);
      continue;
    }

    // Italic text (*text*)
    const italicMatch = currentText.match(/^\*(.+?)\*/);
    if (italicMatch) {
      parts.push(React.createElement('em', { key: key++ }, italicMatch[1]));
      currentText = currentText.slice(italicMatch[0].length);
      continue;
    }

    // Code text (`text`)
    const codeMatch = currentText.match(/^`(.+?)`/);
    if (codeMatch) {
      parts.push(
        React.createElement(
          'code',
          {
            key: key++,
            className: 'bg-gray-100 px-1 py-0.5 rounded text-sm font-mono'
          },
          codeMatch[1]
        )
      );
      currentText = currentText.slice(codeMatch[0].length);
      continue;
    }

    // Links [text](url)
    const linkMatch = currentText.match(/^\[(.+?)\]\((.+?)\)/);
    if (linkMatch) {
      parts.push(
        React.createElement(
          'a',
          {
            key: key++,
            href: linkMatch[2],
            className: 'text-blue-600 hover:underline',
            target: '_blank',
            rel: 'noopener noreferrer'
          },
          linkMatch[1]
        )
      );
      currentText = currentText.slice(linkMatch[0].length);
      continue;
    }

    // Regular text - find next markdown pattern or take the rest
    const nextMarkdownMatch = currentText.match(/\*\*|\*|`|\[/);
    if (nextMarkdownMatch && nextMarkdownMatch.index !== undefined && nextMarkdownMatch.index > 0) {
      parts.push(currentText.slice(0, nextMarkdownMatch.index));
      currentText = currentText.slice(nextMarkdownMatch.index);
    } else if (nextMarkdownMatch && nextMarkdownMatch.index === 0) {
      // If markdown pattern at start but didn't match above, treat as regular character
      parts.push(currentText[0]);
      currentText = currentText.slice(1);
    } else {
      // No more markdown patterns, add the rest
      parts.push(currentText);
      break;
    }
  }

  return React.createElement(React.Fragment, null, ...parts);
};