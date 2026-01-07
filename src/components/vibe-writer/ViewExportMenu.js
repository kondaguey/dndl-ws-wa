"use client";

import React, { useState } from "react";
import { Download, FileText, File, ChevronDown, Loader2 } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";

// PDF Imports
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// DOCX Imports
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

// --- HELPERS ---
// Simple HTML stripper to get clean text paragraphs
const extractTextSegments = (html) => {
  if (typeof window === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Get all paragraphs and headings
  const nodes = doc.body.querySelectorAll("p, h1, h2, h3, h4, li, blockquote");
  return Array.from(nodes)
    .map((node) => ({
      type: node.tagName.toLowerCase(),
      text: node.textContent || "",
    }))
    .filter((item) => item.text.trim() !== "");
};

// --- PDF STYLES ---
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
    color: "#14b8a6",
  }, // Teal Title
  h1: { fontSize: 18, marginTop: 15, marginBottom: 5, fontWeight: "bold" },
  h2: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 5,
    fontWeight: "bold",
    color: "#555",
  },
  body: { fontSize: 11, lineHeight: 1.6, marginBottom: 8, color: "#333" },
  quote: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#666",
    borderLeft: "2px solid #ccc",
    paddingLeft: 10,
    marginVertical: 10,
  },
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

const PdfTemplate = ({ segments }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.title}>Vibe Check Draft</Text>

      {segments.map((seg, i) => {
        if (seg.type.startsWith("h"))
          return (
            <Text key={i} style={pdfStyles.h1}>
              {seg.text}
            </Text>
          );
        if (seg.type === "blockquote")
          return (
            <Text key={i} style={pdfStyles.quote}>
              {seg.text}
            </Text>
          );
        return (
          <Text key={i} style={pdfStyles.body}>
            {seg.text}
          </Text>
        );
      })}

      <Text style={pdfStyles.footer}>Generated with VibeEditor</Text>
    </Page>
  </Document>
);

export default function VibeExportMenu() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // GET CURRENT CONTENT
  const getCleanContent = () => {
    let htmlString = "";
    editor.update(() => {
      htmlString = $generateHtmlFromNodes(editor, null);
    });
    return extractTextSegments(htmlString);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const segments = getCleanContent();
      const blob = await pdf(<PdfTemplate segments={segments} />).toBlob();
      saveAs(blob, `vibe-draft-${Date.now()}.pdf`);
    } catch (e) {
      console.error("PDF Error", e);
    }
    setIsExporting(false);
    setIsOpen(false);
  };

  const handleExportDOCX = async () => {
    setIsExporting(true);
    try {
      const segments = getCleanContent();

      const docChildren = segments.map((seg) => {
        if (seg.type === "h1")
          return new Paragraph({
            text: seg.text,
            heading: HeadingLevel.HEADING_1,
          });
        if (seg.type === "h2")
          return new Paragraph({
            text: seg.text,
            heading: HeadingLevel.HEADING_2,
          });
        return new Paragraph({
          children: [new TextRun({ text: seg.text, size: 24 })], // 12pt
          spacing: { after: 200 },
        });
      });

      const doc = new DocxDocument({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "Vibe Check Draft",
                heading: HeadingLevel.TITLE,
              }),
              ...docChildren,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `vibe-draft-${Date.now()}.docx`);
    } catch (e) {
      console.error("DOCX Error", e);
    }
    setIsExporting(false);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block ml-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300 transition-all text-xs font-bold uppercase tracking-wider"
      >
        {isExporting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        Export
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
              <div className="text-[10px] text-slate-500">Read-only format</div>
            </div>
          </button>

          <button
            onClick={handleExportDOCX}
            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors group"
          >
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <FileText size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Word Doc</div>
              <div className="text-[10px] text-slate-500">Editable format</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
