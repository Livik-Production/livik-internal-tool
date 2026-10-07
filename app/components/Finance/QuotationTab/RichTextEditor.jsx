'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';

// A contentEditable-based rich text editor: selecting text shows a floating
// toolbar (Bold / Italic / Underline / Bullet list), mirroring the
// select-to-format pattern of Google Docs / Notion. Stores formatted HTML.
const RichTextEditor = ({
  value,
  onChange,
  placeholder = '',
  minHeightRem = 18,
}) => {
  const editorRef = useRef(null);
  const [toolbarPos, setToolbarPos] = useState(null); // { top, left } or null
  const [activeFormats, setActiveFormats] = useState({});

  // Keep the DOM in sync with external value changes (e.g. loading
  // initialData for edit), without clobbering the user's active cursor.
  useEffect(() => {
    if (!editorRef.current) return;
    if (document.activeElement === editorRef.current) return;
    if (editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const updateToolbarPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setToolbarPos(null);
      return;
    }
    const range = selection.getRangeAt(0);
    if (
      !editorRef.current ||
      !editorRef.current.contains(range.commonAncestorContainer)
    ) {
      setToolbarPos(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setToolbarPos(null);
      return;
    }
    const editorRect = editorRef.current.getBoundingClientRect();
    setToolbarPos({
      top: rect.top - editorRect.top - 44,
      left: Math.min(
        Math.max(0, rect.left - editorRect.left + rect.width / 2 - 72),
        editorRect.width - 150
      ),
    });

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', updateToolbarPosition);
    return () =>
      document.removeEventListener('selectionchange', updateToolbarPosition);
  }, [updateToolbarPosition]);

  const emitChange = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const exec = (command) => {
    document.execCommand(command);
    emitChange();
    editorRef.current?.focus();
    updateToolbarPosition();
  };

  // Case transforms aren't reliable via execCommand across browsers, so the
  // selected text is swapped out manually using the Range API instead.
  const transformCase = (mode) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (
      !editorRef.current ||
      !editorRef.current.contains(range.commonAncestorContainer)
    ) {
      return;
    }

    const text = range.toString();
    let newText;
    if (mode === 'upper') {
      newText = text.toUpperCase();
    } else if (mode === 'lower') {
      newText = text.toLowerCase();
    } else {
      // Pascal/Title case: capitalize the first letter of each word.
      newText = text.replace(
        /\w\S*/g,
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      );
    }

    range.deleteContents();
    const textNode = document.createTextNode(newText);
    range.insertNode(textNode);

    const newRange = document.createRange();
    newRange.selectNode(textNode);
    selection.removeAllRanges();
    selection.addRange(newRange);

    emitChange();
    editorRef.current?.focus();
    updateToolbarPosition();
  };

  const buttonClass = (active) =>
    `p-1.5 rounded ${active ? 'bg-gray-300 text-gray-900' : 'hover:bg-gray-100 text-gray-700'}`;

  return (
    <div className="relative">
      {toolbarPos && (
        <div
          className="absolute z-20 flex items-center gap-1 bg-white text-gray-700 border border-gray-200 rounded-lg shadow-lg px-1.5 py-1"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
          // Prevent the text selection from collapsing before the click lands
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={() => exec('bold')}
            className={buttonClass(activeFormats.bold)}
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            className={buttonClass(activeFormats.italic)}
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec('underline')}
            className={buttonClass(activeFormats.underline)}
            title="Underline"
          >
            <Underline size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            className={buttonClass(activeFormats.insertUnorderedList)}
            title="Bullet list"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            className={buttonClass(activeFormats.insertOrderedList)}
            title="Numbered list"
          >
            <ListOrdered size={14} />
          </button>
          <span className="w-px h-4 bg-gray-200 mx-0.5" />
          <button
            type="button"
            onClick={() => transformCase('lower')}
            className={buttonClass(false)}
            title="lowercase"
          >
            <span className="text-[11px] font-bold leading-none px-0.5">
              aa
            </span>
          </button>
          <button
            type="button"
            onClick={() => transformCase('upper')}
            className={buttonClass(false)}
            title="UPPERCASE"
          >
            <span className="text-[11px] font-bold leading-none px-0.5">
              AA
            </span>
          </button>
          <button
            type="button"
            onClick={() => transformCase('pascal')}
            className={buttonClass(false)}
            title="Pascal Case"
          >
            <span className="text-[11px] font-bold leading-none px-0.5">
              Aa
            </span>
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className="rich-text-editor bg-white w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm text-gray-700"
        style={{ minHeight: `${minHeightRem}rem` }}
      />

      {/*
        Global (unscoped) on purpose: execCommand inserts <ul>/<ol>/<li>
        directly into the DOM outside of React's render, so they never pick
        up styled-jsx's per-component scoping class and a scoped <style jsx>
        here would silently not apply to them.
      */}
      <style jsx global>{`
        .rich-text-editor:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
        .rich-text-editor ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin: 4px 0;
        }
        .rich-text-editor ol {
          list-style: decimal;
          padding-left: 1.25rem;
          margin: 4px 0;
        }
        .rich-text-editor li {
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
