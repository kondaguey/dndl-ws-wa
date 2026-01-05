"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
// We removed OnChangePlugin and replaced it with HtmlOutputPlugin below
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
// --- 1. NEW IMPORT FOR SQL GENERATION ---
import { $generateHtmlFromNodes } from "@lexical/html";
import {
  DecoratorNode,
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $getRoot,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
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
  Image as ImageIcon,
  X,
  Ghost,
  Terminal, // Icon for the placeholder
} from "lucide-react";

// -----------------------------------------------------------------------------
// 1. RAW HTML IMAGE NODE (The Fix)
// -----------------------------------------------------------------------------
const INSERT_IMAGE_COMMAND = createCommand("INSERT_IMAGE_COMMAND");

export class SimpleImageNode extends DecoratorNode {
  static getType() {
    return "simple-image";
  }
  static clone(node) {
    return new SimpleImageNode(node.__src, node.__alt, node.__key);
  }
  static importJSON(serializedNode) {
    return $createSimpleImageNode(serializedNode.src, serializedNode.alt);
  }

  constructor(src, alt, key) {
    super(key);
    this.__src = src;
    this.__alt = alt;
  }

  exportJSON() {
    return {
      type: "simple-image",
      src: this.__src,
      alt: this.__alt,
      version: 1,
    };
  }

  // --- 2. SQL EXPORT LOGIC: This creates the real <img> tag for the DB ---
  exportDOM() {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__alt || "Blog content");
    // These classes ensure it looks good when the SQL is rendered on your site
    element.setAttribute(
      "class",
      "w-full rounded-2xl shadow-xl my-8 border-2 border-white/10"
    );
    return { element };
  }

  createDOM(config) {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM() {
    return false;
  }

  // --- 3. VISUAL FALLBACK: Renders the "Code Placeholder" in the Editor ---
  decorate() {
    return (
      <div className="my-6 select-none group relative">
        <div className="bg-[#0f172a] border border-slate-700 rounded-lg p-4 flex items-center gap-4 shadow-inner">
          <div className="p-3 bg-slate-800 rounded-md border border-slate-600">
            <Terminal size={20} className="text-teal-400" />
          </div>
          <div className="flex-grow font-mono text-xs overflow-hidden">
            <div className="text-slate-400 uppercase text-[10px] font-bold mb-1 tracking-widest">
              Raw HTML Asset
            </div>
            <div className="text-teal-200 truncate">
              {`<img src="`}
              <span className="text-yellow-400">{this.__src}</span>
              {`" />`}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 border-2 border-teal-500/0 group-hover:border-teal-500/50 rounded-lg transition-all pointer-events-none" />
      </div>
    );
  }
}

export function $createSimpleImageNode(src, alt) {
  return new SimpleImageNode(src, alt);
}

// -----------------------------------------------------------------------------
// 2. THEME CONFIGURATION
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
  image: "block",
};

// -----------------------------------------------------------------------------
// 3. VIBE MODAL
// -----------------------------------------------------------------------------
const VibeModal = ({ isOpen, onClose, onConfirm, type }) => {
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
        className="w-[400px] bg-[var(--bg-toolbar)] border rounded-2xl p-6 transition-all duration-300 backdrop-blur-xl"
        style={{
          borderColor: "var(--theme-border)",
          boxShadow: "var(--theme-shadow)",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold uppercase tracking-widest text-sm theme-text-primary">
            Insert {type === "link" ? "Hyperlink" : "Visual Asset HTML"}
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
          placeholder={type === "link" ? "https://..." : "Image URL..."}
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
// 4. TOOLBAR COMPONENT
// -----------------------------------------------------------------------------
function VibeToolbar({ bgOpacity, setBgOpacity }) {
  const [editor] = useLexicalComposerContext();
  const [activeBlock, setActiveBlock] = useState("paragraph");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);

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
        editorState.read(() => {
          updateToolbar();
        });
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
  };

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleModalConfirm = (val) => {
    setModalOpen(false);
    if (!val) return;

    // Force focus back to editor before dispatching
    editor.focus();

    if (modalType === "link") {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, val);
    } else if (modalType === "image") {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: val,
        alt: "vibe-asset",
      });
    }
  };

  const btnClass = (isActive) =>
    `p-2 rounded transition-all duration-200 ${isActive ? "bg-[var(--theme-color)] text-black shadow-[0_0_15px_var(--theme-shadow-color)]" : "theme-icon-base hover:bg-[var(--icon-hover-bg)] hover:text-[var(--icon-hover-text)]"}`;

  return (
    <>
      <div className="flex items-center flex-wrap gap-1 p-4 border-b theme-border-dim bg-[var(--bg-toolbar)] backdrop-blur-md sticky top-0 z-50">
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
        <div className="w-px h-6 bg-white/10 mx-1" />
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
        <div className="w-px h-6 bg-white/10 mx-1" />
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
        <div className="w-px h-6 bg-white/10 mx-1" />
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
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            openModal("link");
          }}
          className={btnClass(false)}
          title="Link"
        >
          <LinkIcon size={18} />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1" />
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
        <div className="w-px h-6 bg-white/10 mx-1" />
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
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            openModal("image");
          }}
          className={btnClass(false)}
          title="Insert Image"
        >
          <ImageIcon size={18} />
        </button>
        {/* OPACITY SLIDER */}
        <div className="flex items-center gap-2 mr-4 border-r theme-border-dim pr-4 hidden md:flex">
          <Ghost size={16} className="theme-text-dim" />
          <input
            type="range"
            min="0"
            max="100"
            value={bgOpacity}
            onChange={(e) => setBgOpacity(e.target.value)}
            className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            title="Background Opacity"
          />
        </div>
      </div>
      <VibeModal
        isOpen={modalOpen}
        type={modalType}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}

// -----------------------------------------------------------------------------
// 5. MAIN EXPORTED COMPONENT
// -----------------------------------------------------------------------------
export default function VibeEditor({
  onChange,
  initialContent = null,
  theme = "teal",
}) {
  const [bgOpacity, setBgOpacity] = useState(80);

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
      SimpleImageNode,
    ],
    editorState: initialContent,
  };

  const ImagePlugin = () => {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
      return editor.registerCommand(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createSimpleImageNode(payload.src, payload.alt);

          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([imageNode]);
          } else {
            // Fallback: If no selection (e.g. focus lost), append to the end of the doc
            const root = $getRoot();
            const p = $createParagraphNode();
            p.append(imageNode);
            root.append(p);
          }
          return true;
        },
        COMMAND_PRIORITY_LOW
      );
    }, [editor]);
    return null;
  };

  // --- 4. HTML OUTPUT PLUGIN ---
  const HtmlOutputPlugin = ({ onChange }) => {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
      return editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          // This uses the exportDOM method we added to the Image Node
          const htmlString = $generateHtmlFromNodes(editor, null);
          onChange(htmlString);
        });
      });
    }, [editor, onChange]);
    return null;
  };

  const getThemeVars = () => {
    const isLight = theme === "light";
    const isYellow = theme === "yellow";

    return {
      "--theme-color": isLight ? "#2563eb" : isYellow ? "#facc15" : "#2dd4bf",
      "--theme-border": isLight ? "#cbd5e1" : isYellow ? "#eab308" : "#14b8a6",
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
      className="flex-grow relative rounded-[2rem] overflow-hidden border border-teal-500/20 shadow-[0_0_50px_-20px_rgba(20,184,166,0.2)] transition-all duration-500 vibe-editor-wrapper"
      style={{
        backgroundColor: `rgba(5, 10, 16, ${bgOpacity / 100})`,
        backdropFilter: `blur(${bgOpacity * 0.2}px)`,
        borderColor: "var(--theme-border)",
        boxShadow: "var(--theme-shadow)",
        ...getThemeVars(),
      }}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <VibeToolbar bgOpacity={bgOpacity} setBgOpacity={setBgOpacity} />
        <ImagePlugin />

        {/* REPLACED OnChangePlugin WITH HtmlOutputPlugin */}
        <HtmlOutputPlugin onChange={onChange} />

        <ListPlugin />
        <LinkPlugin />
        <HistoryPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

        <div className="relative p-8 md:p-12 min-h-[600px]">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="outline-none min-h-[500px] theme-text-body relative z-10" />
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
                <br />
                Check console for stack trace.
              </div>
            )}
          />
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
      `}</style>
    </div>
  );
}
