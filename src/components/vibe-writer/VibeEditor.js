"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { mergeRegister } from "@lexical/utils";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  ListNode,
  ListItemNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getRoot,
  $insertNodes,
  KEY_MODIFIER_COMMAND,
  COMMAND_PRIORITY_NORMAL,
} from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Quote,
  Heading2,
  Heading3,
  Heading4,
  Code as CodeIcon,
  Type,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  X,
  Download,
  FileText,
  File,
  ChevronDown,
  Loader2,
  Database,
  Pin,
  PinOff,
  MoreHorizontal,
  Clock,
  Type as TypeIcon,
} from "lucide-react";

// --- EXPORT DEPENDENCIES ---
import {
  pdf,
  Document,
  Page,
  Text as PdfText,
  View as PdfView,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

// -----------------------------------------------------------------------------
// 0. RICH TEXT PARSING LOGIC & EXPORT MENU
// -----------------------------------------------------------------------------
const parseHtmlToRichSegments = (html) => {
  if (typeof window === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks = [];

  const parseInline = (node, style = {}) => {
    if (node.nodeType === 3) return [{ text: node.textContent, ...style }];
    if (node.nodeType === 1) {
      const newStyle = { ...style };
      const tag = node.tagName.toLowerCase();
      if (tag === "strong" || tag === "b") newStyle.bold = true;
      if (tag === "em" || tag === "i") newStyle.italic = true;
      if (tag === "u") newStyle.underline = true;
      if (tag === "s" || tag === "strike" || tag === "del")
        newStyle.strike = true;
      if (tag === "sup") newStyle.superScript = true;
      if (tag === "sub") newStyle.subScript = true;
      if (tag === "code") newStyle.code = true;
      let runs = [];
      node.childNodes.forEach((child) => {
        runs = runs.concat(parseInline(child, newStyle));
      });
      return runs;
    }
    return [];
  };

  const getAlignment = (node) => {
    const align = node.style.textAlign;
    if (align === "center") return "center";
    if (align === "right") return "right";
    if (align === "justify") return "justify";
    return "left";
  };

  Array.from(doc.body.children).forEach((node) => {
    const tag = node.tagName.toLowerCase();
    const align = getAlignment(node);
    if (["p", "h1", "h2", "h3", "h4", "blockquote"].includes(tag)) {
      blocks.push({ type: tag, align: align, children: parseInline(node) });
    } else if (tag === "ul" || tag === "ol") {
      Array.from(node.children).forEach((li) => {
        if (li.tagName.toLowerCase() === "li") {
          blocks.push({
            type: "li",
            listType: tag,
            align: getAlignment(li) || align,
            children: parseInline(li),
          });
        }
      });
    }
  });
  return blocks;
};

// ... PDF Styles ...
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
    color: "#14b8a6",
  },
  block: { marginBottom: 6, lineHeight: 1.5 },
  h1: { fontSize: 18, marginTop: 12, marginBottom: 4, fontWeight: "bold" },
  h2: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 4,
    fontWeight: "bold",
    color: "#444",
  },
  h3: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "bold",
    color: "#666",
  },
  h4: { fontSize: 12, marginTop: 6, marginBottom: 4, fontWeight: "bold" },
  body: { fontSize: 11, color: "#222" },
  blockquote: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#555",
    borderLeft: "2px solid #ccc",
    paddingLeft: 10,
    marginVertical: 5,
  },
  li: { fontSize: 11, marginBottom: 2, flexDirection: "row" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    textAlign: "center",
    color: "#aaa",
  },
});

const PdfTemplate = ({ blocks, title }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <PdfText style={pdfStyles.title}>{title || "Untitled Draft"}</PdfText>
      {blocks.map((block, i) => {
        const renderRuns = (runs) =>
          runs.map((run, rI) => (
            <PdfText
              key={rI}
              style={{
                fontFamily: run.bold
                  ? "Helvetica-Bold"
                  : run.italic
                    ? "Helvetica-Oblique"
                    : "Helvetica",
                textDecoration: run.underline
                  ? "underline"
                  : run.strike
                    ? "line-through"
                    : "none",
                fontSize: run.subScript || run.superScript ? 8 : undefined,
                verticalAlign: run.superScript
                  ? "super"
                  : run.subScript
                    ? "sub"
                    : "baseline",
                backgroundColor: run.code ? "#eee" : undefined,
              }}
            >
              {run.text}
            </PdfText>
          ));
        const alignStyle = { textAlign: block.align };
        if (block.type === "li") {
          return (
            <PdfView key={i} style={[pdfStyles.li, alignStyle]}>
              <PdfText style={{ width: 15 }}>
                {block.listType === "ol" ? `${i + 1}.` : "•"}
              </PdfText>
              <PdfText style={{ flex: 1 }}>
                {renderRuns(block.children)}
              </PdfText>
            </PdfView>
          );
        }
        return (
          <PdfText
            key={i}
            style={[pdfStyles.block, pdfStyles.body, alignStyle]}
          >
            {renderRuns(block.children)}
          </PdfText>
        );
      })}
      <PdfText style={pdfStyles.footer}>Generated with VibeWriter</PdfText>
    </Page>
  </Document>
);

const VibeExportMenu = ({ onSqlExport, title }) => {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const getRichContent = () => {
    let htmlString = "";
    editor.update(() => {
      htmlString = $generateHtmlFromNodes(editor, null);
    });
    return parseHtmlToRichSegments(htmlString);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const blocks = getRichContent();
      const blob = await pdf(
        <PdfTemplate blocks={blocks} title={title} />
      ).toBlob();
      saveAs(blob, `${title || "vibe-draft"}.pdf`);
    } catch (e) {
      console.error("PDF Error", e);
    }
    setIsExporting(false);
    setIsOpen(false);
  };

  const handleExportDOCX = async () => {
    setIsExporting(true);
    try {
      const blocks = getRichContent();
      const docChildren = blocks.map((block) => {
        const runs = block.children.map(
          (child) =>
            new TextRun({
              text: child.text,
              bold: child.bold,
              italics: child.italic,
              underline: child.underline ? {} : undefined,
              strike: child.strike,
              superScript: child.superScript,
              subScript: child.subScript,
              font: child.code ? "Courier New" : undefined,
              size: 24,
            })
        );
        let alignment = AlignmentType.LEFT;
        if (block.align === "center") alignment = AlignmentType.CENTER;
        if (block.align === "right") alignment = AlignmentType.RIGHT;
        if (block.align === "justify") alignment = AlignmentType.JUSTIFIED;
        const paragraphConfig = {
          children: runs,
          alignment: alignment,
          spacing: { after: 120 },
        };
        switch (block.type) {
          case "h1":
            return new Paragraph({
              ...paragraphConfig,
              heading: HeadingLevel.HEADING_1,
            });
          case "h2":
            return new Paragraph({
              ...paragraphConfig,
              heading: HeadingLevel.HEADING_2,
            });
          case "h3":
            return new Paragraph({
              ...paragraphConfig,
              heading: HeadingLevel.HEADING_3,
            });
          case "h4":
            return new Paragraph({
              ...paragraphConfig,
              heading: HeadingLevel.HEADING_4,
            });
          case "li":
            return new Paragraph({ ...paragraphConfig, bullet: { level: 0 } });
          case "blockquote":
            return new Paragraph({
              ...paragraphConfig,
              indent: { left: 720 },
              style: "Quote",
            });
          default:
            return new Paragraph(paragraphConfig);
        }
      });
      const doc = new DocxDocument({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: title || "Untitled Transmission",
                heading: HeadingLevel.TITLE,
              }),
              ...docChildren,
            ],
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title || "vibe-draft"}.docx`);
    } catch (e) {
      console.error("DOCX Error", e);
    }
    setIsExporting(false);
    setIsOpen(false);
  };

  const handleSqlClick = () => {
    setIsOpen(false);
    if (onSqlExport) onSqlExport();
  };

  return (
    <div className="relative inline-block border-l border-white/10 pl-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-2 md:py-1.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300 transition-all text-xs font-bold uppercase tracking-wider"
      >
        {isExporting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        <span className="hidden sm:inline">Export</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95">
          <div className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-white/5">
            Download As...
          </div>
          <button
            onClick={handleExportPDF}
            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 group"
          >
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg group-hover:bg-red-500/20 transition-colors">
              <File size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">PDF</div>
              <div className="text-[10px] text-slate-500">Rich Formatting</div>
            </div>
          </button>
          <button
            onClick={handleExportDOCX}
            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5 group"
          >
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <FileText size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Word Doc</div>
              <div className="text-[10px] text-slate-500">Full Edit Mode</div>
            </div>
          </button>
          <button
            onClick={handleSqlClick}
            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors group"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <Database size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">SQL Insert</div>
              <div className="text-[10px] text-slate-500">Database Query</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 1. THEME CONFIGURATION
// -----------------------------------------------------------------------------
const vibeTheme = {
  paragraph: "mb-4 text-lg leading-relaxed font-light theme-text-body",
  heading: {
    h1: "text-4xl md:text-5xl font-black mt-12 mb-6 tracking-tighter border-b theme-border-dim pb-4 theme-text-heading",
    h2: "text-2xl md:text-3xl font-bold mt-10 mb-4 tracking-widest flex items-center gap-2 theme-text-primary",
    h3: "text-xl md:text-2xl font-bold mt-8 mb-3 tracking-wide theme-text-secondary",
    h4: "text-lg md:text-xl font-bold mt-6 mb-2 theme-text-dim",
  },
  text: {
    bold: "font-bold theme-text-heading",
    italic: "italic theme-text-dim",
    underline: "underline decoration-2 underline-offset-4 theme-decoration",
    strikethrough: "line-through decoration-slate-500 opacity-70",
    subscript: "align-sub text-xs theme-text-dim",
    superscript: "align-super text-xs theme-text-dim",
    code: "bg-black/10 border theme-border-dim theme-text-primary font-mono px-1 rounded text-sm",
  },
  list: {
    ul: "list-disc list-inside mb-6 space-y-2 theme-text-body",
    ol: "list-decimal list-inside mb-6 space-y-2 theme-text-body",
  },
  quote:
    "border-l-4 pl-6 py-2 my-8 italic bg-white/5 rounded-r-lg theme-border-left theme-text-dim",
  code: "block bg-black/80 border theme-border-dim p-4 rounded-lg font-mono text-sm theme-text-primary overflow-x-auto my-6 shadow-inner",
  link: "underline decoration-2 underline-offset-2 cursor-pointer theme-text-primary theme-decoration",
};

// -----------------------------------------------------------------------------
// 2. VIBE MODAL
// -----------------------------------------------------------------------------
const VibeModal = ({ isOpen, onClose, onConfirm }) => {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    if (isOpen) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-[90%] max-w-[400px] bg-[var(--bg-toolbar)] border rounded-2xl p-6 transition-all duration-300 backdrop-blur-xl"
        style={{
          borderColor: "var(--theme-border)",
          boxShadow: "var(--theme-shadow)",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold uppercase tracking-widest text-sm theme-text-primary">
            Insert Hyperlink
          </h3>
          <button onClick={onClose} className="theme-text-dim hover:text-white">
            <X size={16} />
          </button>
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onConfirm(value)}
          placeholder="https://..."
          className="w-full bg-black/10 border theme-border-dim rounded-lg p-3 theme-text-body outline-none focus:border-[var(--theme-color)] transition-colors mb-6 font-mono text-sm placeholder:opacity-50"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-bold uppercase theme-text-dim hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(value)}
            className="px-4 py-2 rounded bg-white/10 border text-xs font-bold uppercase hover:bg-white/20 transition-all theme-text-primary"
            style={{ borderColor: "var(--theme-border)" }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 3. TOOLBAR COMPONENT (FIXED LAYOUT)
// -----------------------------------------------------------------------------
function VibeToolbar({ onSqlExport, title }) {
  const [editor] = useLexicalComposerContext();
  const [activeBlock, setActiveBlock] = useState("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isSticky, setIsSticky] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);

  // --- KEYBOARD SHORTCUTS LISTENER ---
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event) => {
          const { code, shiftKey, metaKey, ctrlKey } = event;
          const isMac =
            typeof window !== "undefined" &&
            /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
          const isCtrl = isMac ? metaKey : ctrlKey;

          if (isCtrl) {
            if (code === "KeyK") {
              event.preventDefault();
              setModalOpen(true);
              return true;
            }
            if (shiftKey) {
              if (code === "Digit8") {
                event.preventDefault();
                editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
                return true;
              }
              if (code === "Digit7") {
                event.preventDefault();
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
                return true;
              }
              if (code === "KeyL") {
                event.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
                return true;
              }
              if (code === "KeyE") {
                event.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
                return true;
              }
              if (code === "KeyR") {
                event.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
                return true;
              }
            }
          }
          return false;
        },
        COMMAND_PRIORITY_NORMAL
      )
    );
  }, [editor]);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));
      setIsCode(selection.hasFormat("code"));
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementDOM = editor.getElementByKey(element.getKey());
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element.getParent();
          setActiveBlock(
            $isListNode(parentList)
              ? parentList.getTag() === "ul"
                ? "ul"
                : "ol"
              : element.getTag() === "ul"
                ? "ul"
                : "ol"
          );
        } else {
          setActiveBlock(
            element.getType() === "heading"
              ? element.getTag()
              : element.getType()
          );
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateToolbar());
      })
    );
  }, [editor, updateToolbar]);

  const toggleBlock = (format, headingLevel = null) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (
          (activeBlock === format && !headingLevel) ||
          activeBlock === headingLevel
        ) {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          if (format === "heading")
            $setBlocksType(selection, () => $createHeadingNode(headingLevel));
          if (format === "quote")
            $setBlocksType(selection, () => $createQuoteNode());
          if (format === "paragraph")
            $setBlocksType(selection, () => $createParagraphNode());
        }
      }
    });
    setBlockMenuOpen(false);
  };

  const handleModalConfirm = (val) => {
    setModalOpen(false);
    if (!val) return;
    setTimeout(() => {
      editor.focus();
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, val);
    }, 50);
  };

  const btnClass = (isActive) =>
    `p-2 rounded transition-all duration-200 shrink-0 ${isActive ? "bg-[var(--theme-color)] text-black shadow-[0_0_15px_var(--theme-shadow-color)]" : "theme-icon-base hover:bg-[var(--icon-hover-bg)] hover:text-[var(--icon-hover-text)]"}`;

  const formatAlign = (dir) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, dir);
    setMoreMenuOpen(false);
  };

  return (
    <>
      <div
        className={`flex items-center justify-between p-3 border-b theme-border-dim bg-[var(--bg-toolbar)] backdrop-blur-md transition-all duration-300 z-50 rounded-t-[1.9rem] ${isSticky ? "sticky top-[60px] md:top-[80px]" : "relative"}`}
      >
        {/* --- LEFT SIDE: SCROLLABLE TOOLS --- */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full flex-grow mask-fade-right">
          {/* --- MOBILE: TEXT STYLE DROPDOWN --- */}
          <div className="relative md:hidden shrink-0">
            <button
              onClick={() => setBlockMenuOpen(!blockMenuOpen)}
              className={btnClass(false)}
            >
              {activeBlock.startsWith("h") ? (
                <Heading2 size={18} />
              ) : activeBlock === "quote" ? (
                <Quote size={18} />
              ) : (
                <TypeIcon size={18} />
              )}
            </button>
            {blockMenuOpen && (
              <div className="fixed top-[120px] left-4 mt-2 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl p-1 flex flex-col gap-1 z-[9999] min-w-[120px]">
                <button
                  onClick={() => toggleBlock("paragraph")}
                  className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded"
                >
                  Paragraph
                </button>
                <button
                  onClick={() => toggleBlock("heading", "h2")}
                  className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded font-bold"
                >
                  Heading 2
                </button>
                <button
                  onClick={() => toggleBlock("heading", "h3")}
                  className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded font-semibold"
                >
                  Heading 3
                </button>
                <button
                  onClick={() => toggleBlock("heading", "h4")}
                  className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded font-medium"
                >
                  Heading 4
                </button>
                <button
                  onClick={() => toggleBlock("quote")}
                  className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/10 rounded italic"
                >
                  Quote
                </button>
              </div>
            )}
            {/* INVISIBLE OVERLAY TO CLOSE MENU */}
            {blockMenuOpen && (
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setBlockMenuOpen(false)}
              ></div>
            )}
          </div>

          {/* --- DESKTOP: FULL BLOCK CONTROLS --- */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock("paragraph");
              }}
              className={btnClass(activeBlock === "paragraph")}
              title="Normal Text"
            >
              <Type size={18} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock("heading", "h2");
              }}
              className={btnClass(activeBlock === "h2")}
              title="Heading 2"
            >
              <Heading2 size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock("heading", "h3");
              }}
              className={btnClass(activeBlock === "h3")}
              title="Heading 3"
            >
              <Heading3 size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock("heading", "h4");
              }}
              className={btnClass(activeBlock === "h4")}
              title="Heading 4"
            >
              <Heading4 size={18} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
          </div>

          {/* --- COMMON TOOLS (Bold/Italic/Link) --- */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={btnClass(isBold)}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            className={btnClass(isItalic)}
            title="Italic"
          >
            <Italic size={18} />
          </button>

          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setModalOpen(true);
            }}
            className={btnClass(false)}
            title="Link"
          >
            <LinkIcon size={18} />
          </button>

          {/* --- DESKTOP: EXTENDED FORMATTING --- */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
              }}
              className={btnClass(isUnderline)}
              title="Underline"
            >
              <Underline size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
              }}
              className={btnClass(isStrikethrough)}
              title="Strikethrough"
            >
              <Strikethrough size={18} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
              }}
              className={btnClass(isSubscript)}
              title="Subscript"
            >
              <Subscript size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript");
              }}
              className={btnClass(isSuperscript)}
              title="Superscript"
            >
              <Superscript size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
              }}
              className={btnClass(isCode)}
              title="Inline Code"
            >
              <CodeIcon size={18} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
              }}
              className={btnClass(activeBlock === "ul")}
              title="Bullet List"
            >
              <List size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
              }}
              className={btnClass(activeBlock === "ol")}
              title="Numbered List"
            >
              <ListOrdered size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock("quote");
              }}
              className={btnClass(activeBlock === "quote")}
              title="Quote"
            >
              <Quote size={18} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
              }}
              className={btnClass(false)}
              title="Align Left"
            >
              <AlignLeft size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
              }}
              className={btnClass(false)}
              title="Align Center"
            >
              <AlignCenter size={18} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
              }}
              className={btnClass(false)}
              title="Align Right"
            >
              <AlignRight size={18} />
            </button>

            <div className="ml-2 pl-2 border-l border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSticky(!isSticky);
                }}
                className={btnClass(isSticky)}
                title={isSticky ? "Unpin Toolbar" : "Pin Toolbar"}
              >
                {isSticky ? <Pin size={18} /> : <PinOff size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: STATIC TOOLS (Mobile Menu + Export) --- */}
        <div className="flex items-center gap-1 pl-2 ml-1 shrink-0 bg-[var(--bg-toolbar)] z-[60]">
          {/* --- MOBILE: MORE MENU (FIXED: OUTSIDE SCROLL) --- */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={btnClass(moreMenuOpen)}
            >
              <MoreHorizontal size={18} />
            </button>
            {moreMenuOpen && (
              <div className="fixed top-[120px] right-4 mt-2 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl p-2 grid grid-cols-4 gap-1 z-[9999] w-[200px]">
                <button
                  onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
                  }
                  className={btnClass(isUnderline)}
                >
                  <Underline size={16} />
                </button>
                <button
                  onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
                  }
                  className={btnClass(isStrikethrough)}
                >
                  <Strikethrough size={16} />
                </button>
                <button
                  onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
                  }
                  className={btnClass(isCode)}
                >
                  <CodeIcon size={16} />
                </button>
                <button
                  onClick={() => toggleBlock("quote")}
                  className={btnClass(activeBlock === "quote")}
                >
                  <Quote size={16} />
                </button>
                <div className="col-span-4 h-px bg-white/10 my-1" />
                <button
                  onClick={() =>
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND)
                  }
                  className={btnClass(activeBlock === "ul")}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() =>
                    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND)
                  }
                  className={btnClass(activeBlock === "ol")}
                >
                  <ListOrdered size={16} />
                </button>
                <div className="col-span-2"></div>
                <div className="col-span-4 h-px bg-white/10 my-1" />
                <button
                  onClick={() => formatAlign("left")}
                  className={btnClass(false)}
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => formatAlign("center")}
                  className={btnClass(false)}
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => formatAlign("right")}
                  className={btnClass(false)}
                >
                  <AlignRight size={16} />
                </button>
                <button
                  onClick={() => setIsSticky(!isSticky)}
                  className={btnClass(isSticky)}
                >
                  {isSticky ? <Pin size={16} /> : <PinOff size={16} />}
                </button>
              </div>
            )}
            {/* INVISIBLE OVERLAY TO CLOSE MENU */}
            {moreMenuOpen && (
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setMoreMenuOpen(false)}
              ></div>
            )}
          </div>

          {/* --- EXPORT (ALWAYS VISIBLE) --- */}
          <VibeExportMenu onSqlExport={onSqlExport} title={title} />
        </div>
      </div>

      <VibeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}

// -----------------------------------------------------------------------------
// 4. LOAD HTML PLUGIN
// -----------------------------------------------------------------------------
const LoadHtmlPlugin = ({ initialContent }) => {
  const [editor] = useLexicalComposerContext();
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (!initialContent || isLoaded) return;
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialContent, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      $insertNodes(nodes);
    });
    setIsLoaded(true);
  }, [editor, initialContent, isLoaded]);
  return null;
};

// -----------------------------------------------------------------------------
// 5. WORD COUNT & STATS PLUGIN
// -----------------------------------------------------------------------------
const EditorStatsPlugin = ({ onChange }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        // Simple word count regex
        const words = textContent
          .trim()
          .split(/\s+/)
          .filter((w) => w !== "").length;

        // Blogcast Rule: 9,500 words per hour
        // 9500 words / 60 mins = ~158.33 words per minute
        const wordsPerMinute = 9500 / 60;
        const minutes = Math.ceil(words / wordsPerMinute);

        onChange({ words, minutes });
      });
    });
  }, [editor, onChange]);
  return null;
};

// -----------------------------------------------------------------------------
// 6. MAIN COMPONENT
// -----------------------------------------------------------------------------
const VibeEditor = forwardRef(
  (
    {
      onChange = () => {},
      initialContent = null,
      theme = "teal",
      bgOpacity = 80,
      onSqlExport,
      title,
    },
    ref
  ) => {
    const [stats, setStats] = useState({ words: 0, minutes: 0 });

    const initialConfig = {
      namespace: "VibeWriter",
      theme: vibeTheme,
      onError: (e) => console.error("Lexical Error:", e),
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        LinkNode,
      ],
      editorState: null,
    };

    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    const HtmlOutputPlugin = () => {
      const [editor] = useLexicalComposerContext();
      useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            const htmlString = $generateHtmlFromNodes(editor, null);
            if (onChangeRef.current) {
              onChangeRef.current(htmlString);
            }
          });
        });
      }, [editor]);
      return null;
    };

    const EditorRefPlugin = () => {
      useImperativeHandle(ref, () => ({}));
      return null;
    };

    const getThemeVars = () => {
      const isLight = theme === "light";
      const isYellow = theme === "yellow";
      return {
        "--theme-color": isLight ? "#2563eb" : isYellow ? "#facc15" : "#2dd4bf",
        "--theme-border": isLight
          ? "#cbd5e1"
          : isYellow
            ? "#eab308"
            : "#14b8a6",
        "--theme-shadow-color": isLight
          ? "rgba(37, 99, 235, 0.3)"
          : isYellow
            ? "rgba(250, 204, 21, 0.5)"
            : "rgba(45, 212, 191, 0.5)",
        "--theme-shadow": isLight
          ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          : "0 0 30px -10px rgba(var(--theme-color-rgb), 0.3)",
        "--text-body": isLight ? "#0f172a" : "#cbd5e1",
        "--text-heading": isLight ? "#0f172a" : "#ffffff",
        "--text-placeholder": isLight ? "#94a3b8" : "#475569",
        "--bg-toolbar": isLight
          ? "rgba(255, 255, 255, 0.8)"
          : "rgba(0, 0, 0, 0.4)",
        "--border-dim": isLight
          ? "1px solid #e2e8f0"
          : "1px solid rgba(255, 255, 255, 0.1)",
        "--icon-base": isLight ? "#64748b" : "#94a3b8",
        "--icon-hover-bg": isLight
          ? "rgba(0, 0, 0, 0.05)"
          : "rgba(255, 255, 255, 0.1)",
        "--icon-hover-text": isLight ? "#0f172a" : "#ffffff",
      };
    };

    return (
      <div
        className="flex flex-col flex-grow relative rounded-[2rem] border border-teal-500/20 shadow-[0_0_50px_-20px_rgba(20,184,166,0.2)] transition-all duration-500 vibe-editor-wrapper"
        style={{
          // --- UPDATED BACKGROUND LOGIC ---
          backgroundColor:
            theme === "light"
              ? "rgba(255, 255, 255, 0.95)"
              : `rgba(5, 10, 16, ${bgOpacity / 100})`,
          backdropFilter: `blur(${bgOpacity * 0.2}px)`,
          borderColor: "var(--theme-border)",
          boxShadow: "var(--theme-shadow)",
          overflow: "visible",
          ...getThemeVars(),
        }}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <VibeToolbar onSqlExport={onSqlExport} title={title} />
          <LoadHtmlPlugin initialContent={initialContent} />
          <EditorRefPlugin />
          <HtmlOutputPlugin />
          <EditorStatsPlugin onChange={setStats} />
          <ListPlugin />
          <LinkPlugin />
          <HistoryPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

          {/* --- EDITOR CONTENT AREA --- */}
          <div className="relative p-8 md:p-12 flex-grow min-h-[50vh]">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="outline-none min-h-[40vh] theme-text-body relative z-10" />
              }
              placeholder={
                <div
                  className="absolute top-8 md:top-12 left-8 md:left-12 text-lg font-light italic z-0"
                  style={{ color: "var(--text-placeholder)" }}
                >
                  The canvas is yours...
                </div>
              }
              ErrorBoundary={({ error }) => (
                <div className="p-4 border border-red-500 bg-red-900/50 text-white rounded font-mono text-xs">
                  <strong>CRASH REPORT:</strong>
                  <br />
                  {error ? error.message : "Unknown Error"}
                </div>
              )}
            />
          </div>

          {/* --- FOOTER: STATS --- */}
          <div className="flex items-center justify-between px-6 py-3 border-t theme-border-dim rounded-b-[1.9rem] bg-[var(--bg-toolbar)] text-xs font-bold uppercase tracking-widest theme-text-dim">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5" title="Word Count">
                <TypeIcon size={12} className="opacity-70" />
                <span>{stats.words.toLocaleString()} words</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div
                className="flex items-center gap-1.5"
                title="Blogcast Reading Time (9,500 words/hr)"
              >
                <Clock size={12} className="opacity-70" />
                <span>~{stats.minutes} min cast</span>
              </div>
            </div>
            <div className="opacity-50 hidden sm:block">VibeWriter 2.0</div>
          </div>
        </LexicalComposer>
        <style jsx global>{`
          .vibe-editor-wrapper .theme-text-body {
            color: var(--text-body) !important;
          }
          .vibe-editor-wrapper .theme-text-heading {
            color: var(--text-heading) !important;
          }
          .vibe-editor-wrapper .theme-text-primary {
            color: var(--theme-color) !important;
          }
          .vibe-editor-wrapper .theme-text-secondary {
            color: var(--theme-border) !important;
          }
          .vibe-editor-wrapper .theme-text-dim {
            color: var(--theme-border) !important;
            opacity: 0.7;
          }
          .vibe-editor-wrapper .theme-border-dim {
            border: var(--border-dim) !important;
          }
          .vibe-editor-wrapper .theme-border-left {
            border-left-color: var(--theme-border) !important;
          }
          .vibe-editor-wrapper .theme-decoration {
            text-decoration-color: var(--theme-border) !important;
          }
          .vibe-editor-wrapper .theme-icon-base {
            color: var(--icon-base) !important;
          }
          .vibe-editor-wrapper input[type="range"] {
            accent-color: var(--theme-color);
          }
          .vibe-editor-wrapper ul {
            list-style-type: disc;
            padding-left: 1.5em;
          }
          .vibe-editor-wrapper ol {
            list-style-type: decimal;
            padding-left: 1.5em;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    );
  }
);

VibeEditor.displayName = "VibeEditor";
export default VibeEditor;
