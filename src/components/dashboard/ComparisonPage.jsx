"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, FileText, ArrowRight, Download, Sparkles, TrendingUp, AlertTriangle, BookOpen, Loader2 } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import { fetchDocuments, compareDocuments, fetchComparisonHistory } from "../../utils/api";
import jsPDF from "jspdf";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";

const ComparisonPage = ({ accessToken }) => {
  const [documents, setDocuments] = useState([]);
  const [document1, setDocument1] = useState(null);
  const [document2, setDocument2] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonHistory, setComparisonHistory] = useState([]);
  const [outputFormat, setOutputFormat] = useState("markdown");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteTags, setNoteTags] = useState("");
  const [noteColor, setNoteColor] = useState("purple");
  const [isSaving, setIsSaving] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState(null); // Track active history item
  const resultsRef = useRef(null); // Ref for scrolling to results

  // Fetch documents
  useEffect(() => {
    if (!accessToken) {
      toast.error("Please log in to view documents.");
      return;
    }
    const loadDocuments = async () => {
      try {
        const response = await fetchDocuments(accessToken);
        setDocuments(response.data || []);
      } catch (error) {
        console.error("Failed to load documents:", error);
        toast.error("Failed to load documents");
      }
    };
    loadDocuments();
  }, [accessToken]);

  // Fetch comparison history
  useEffect(() => {
    if (!accessToken) return;
    const loadComparisonHistory = async () => {
      try {
        const response = await fetchComparisonHistory(accessToken);
        setComparisonHistory(response.data || []);
      } catch (error) {
        console.error("Failed to load comparison history:", error);
        toast.error("Failed to load comparison history");
      }
    };
    loadComparisonHistory();
  }, [accessToken]);

  const handleCompare = async () => {
    if (!document1 || !document2) {
      toast.error("Please select two documents to compare");
      return;
    }
    if (document1.id === document2.id) {
      toast.error("Cannot compare the same document");
      return;
    }

    setIsComparing(true);
    try {
      const response = await compareDocuments(document1.id, document2.id, accessToken, { output_format: outputFormat });
      setComparisonResult({ ...response.data.result, document1_id: document1.id, document2_id: document2.id });
      setActiveHistoryId(null); // Reset active history
      resultsRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll to results
      toast.info("Comparison completed!");
    } catch (error) {
      console.error("Comparison error:", error.response?.data || error.message);
      toast.error("Comparison failed: " + (error.response?.data?.error || error.message));
    } finally {
      setIsComparing(false);
    }
  };

  const handleViewComparison = (comparison) => {
    setComparisonResult({
      ...comparison.result,
      document1_id: comparison.document1.id,
      document2_id: comparison.document2.id,
    });
    setDocument1(comparison.document1);
    setDocument2(comparison.document2);
    setActiveHistoryId(comparison.id); // Highlight active history item
    resultsRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll to results
    toast.info(`Viewing comparison: ${comparison.document1.name} vs ${comparison.document2.name}`);
  };

  const handleSaveNote = async () => {
    console.log("Save clicked for comparison");
    console.log("State check:", { document1, document2, comparisonResult, accessToken });

    if (!comparisonResult || !comparisonResult.document1_id || !comparisonResult.document2_id || !accessToken) {
      toast.error("Missing comparison result, document IDs, or unauthorized access");
      return;
    }

    const tags = noteTags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag);
    const finalTitle = noteTitle.trim() || `Comparison of ${document1?.name || "Document 1"} vs ${document2?.name || "Document 2"}`;

    if (!finalTitle) {
      toast.error("Note title cannot be empty");
      return;
    }

    setIsSaving(true);
    const noteData = {
      note_title: finalTitle,
      content: comparisonResult.is_json ? JSON.stringify(comparisonResult, null, 2) : comparisonResult.summary,
      tags: tags.length > 0 ? tags : ["comparison", (document1?.name || "doc1").toLowerCase().replace(/\s/g, "-"), (document2?.name || "doc2").toLowerCase().replace(/\s/g, "-")],
      source_document: comparisonResult.document1_id,
      source_type: "comparison",
      source_id: comparisonResult.id?.toString() || Date.now().toString(),
      starred: false,
      color: noteColor,
      save_to_notes: true,
    };

    try {
      console.log("Sending note data:", noteData);
      const response = await compareDocuments(comparisonResult.document1_id, comparisonResult.document2_id, accessToken, noteData);
      console.log("Save response:", response.data);
      if (response.data.saved_note) {
        toast.success("Note saved successfully");
        setShowSaveModal(false);
        setNoteTitle("");
        setNoteTags("");
        setNoteColor("purple");
      } else {
        toast.error("Failed to save note: No note returned");
      }
    } catch (error) {
      console.error("Failed to save note:", error.response?.data || error.message);
      toast.error("Failed to save note: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!comparisonResult || !document1 || !document2) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Document Comparison Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Documents: ${document1.name} vs ${document2.name}`, 20, 30);
    doc.text("Summary:", 20, 40);
    doc.text(comparisonResult.summary, 20, 50, { maxWidth: 160 });

    let yOffset = 70;
    doc.text("Key Differences:", 20, yOffset);
    comparisonResult.keyDifferences.forEach((diff, index) => {
      yOffset += 10;
      doc.text(`- ${diff.category}:`, 20, yOffset);
      doc.text(`  Doc1: ${diff.doc1Value}, Doc2: ${diff.doc2Value}, Change: ${diff.change}`, 30, yOffset + 5);
      doc.text(`  Insight: ${diff.insight}`, 30, yOffset + 10);
      yOffset += 20;
    });

    yOffset += 10;
    doc.text("Insights:", 20, yOffset);
    comparisonResult.insights.forEach((insight, index) => {
      yOffset += 10;
      doc.text(`- ${insight}`, 30, yOffset, { maxWidth: 160 });
    });

    yOffset += 10;
    doc.text("Recommendations:", 20, yOffset);
    comparisonResult.recommendations.forEach((rec, index) => {
      yOffset += 10;
      doc.text(`- ${rec}`, 30, yOffset, { maxWidth: 160 });
    });

    doc.save(`comparison_${document1.name}_vs_${document2.name}.pdf`);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const DocumentSelector = ({ title, selectedDoc, onSelect, position }) => (
    <Card className="p-6 bg-gray-900 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {selectedDoc ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-xl border border-blue-500/50">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-400" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white text-sm truncate" title={selectedDoc.name}>{selectedDoc.name}</h4>
                <p className="text-xs text-gray-400">
                  {selectedDoc.size ? formatFileSize(selectedDoc.size) : "Unknown size"} •{" "}
                  {new Date(selectedDoc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => onSelect(null)} className="w-full bg-transparent hover:bg-gray-700">
            Change Document
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">Select a document to compare</p>
            <Button variant="outline" className="bg-transparent hover:bg-gray-700">
              Browse Documents
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <p className="text-sm font-medium text-gray-300">Available Documents:</p>
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelect(doc)}
                className="w-full p-3 text-left bg-gray-800 hover:bg-gray-750 rounded-lg transition-colors"
                title={doc.name}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">
                      {doc.size ? formatFileSize(doc.size) : "Unknown size"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Document Comparison</h1>
        <p className="text-gray-400">Compare two documents side-by-side to identify key differences and insights.</p>
      </div>

      {/* Document Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DocumentSelector title="First Document" selectedDoc={document1} onSelect={setDocument1} position="left" />
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
            <Button
              onClick={handleCompare}
              disabled={!document1 || !document2 || isComparing}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              title={!document1 || !document2 ? "Select two documents to compare" : ""}
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Comparing...
                </>
              ) : (
                "Compare Documents"
              )}
            </Button>
          </div>
        </div>
        <DocumentSelector title="Second Document" selectedDoc={document2} onSelect={setDocument2} position="right" />
      </div>

      {/* Comparison Results */}
      <AnimatePresence>
        {comparisonResult && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Summary */}
            <Card className="p-8 bg-gray-900 shadow-lg border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Comparison Summary</h2>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="bg-transparent hover:bg-gray-700"
                    disabled={!document1 || !document2 || !comparisonResult}
                    title={!document1 || !document2 || !comparisonResult ? "Complete a comparison to export" : ""}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveModal(true)}
                    className="bg-transparent hover:bg-gray-700"
                    disabled={!comparisonResult.document1_id || !comparisonResult.document2_id}
                    title={!comparisonResult.document1_id || !comparisonResult.document2_id ? "Complete a comparison to save" : ""}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Save to Notes
                  </Button>
                </div>
              </div>
              {comparisonResult.is_json ? (
                <SyntaxHighlighter
                  language="json"
                  style={tomorrow}
                  customStyle={{ padding: "16px", borderRadius: "8px", background: "#1F2937" }}
                >
                  {JSON.stringify({ summary: comparisonResult.summary }, null, 2)}
                </SyntaxHighlighter>
              ) : (
                <div className="prose prose-invert max-w-none text-gray-200">
                  <ReactMarkdown>{comparisonResult.summary}</ReactMarkdown>
                </div>
              )}
            </Card>

            {/* Save Note Modal */}
            <AnimatePresence>
              {showSaveModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md"
                  >
                    <Card className="p-8 bg-gray-900 shadow-xl border border-gray-700">
                      <h3 className="text-lg font-semibold text-white mb-6">Save to Notes</h3>
                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-medium text-gray-300">Note Title</label>
                          <input
                            type="text"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            placeholder={`Comparison of ${document1?.name || "Document 1"} vs ${document2?.name || "Document 2"}`}
                            className="w-full mt-2 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {!noteTitle.trim() && (
                            <p className="text-xs text-red-400 mt-1">Title is required</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300">Tags (comma-separated)</label>
                          <input
                            type="text"
                            value={noteTags}
                            onChange={(e) => setNoteTags(e.target.value)}
                            placeholder="e.g., comparison, analysis"
                            className="w-full mt-2 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300">Color</label>
                          <select
                            value={noteColor}
                            onChange={(e) => setNoteColor(e.target.value)}
                            className="w-full mt-2 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="blue">Blue</option>
                            <option value="purple">Purple</option>
                            <option value="green">Green</option>
                            <option value="orange">Orange</option>
                            <option value="cyan">Cyan</option>
                            <option value="pink">Pink</option>
                          </select>
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            onClick={handleSaveNote}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            disabled={isSaving || !noteTitle.trim() || !comparisonResult.document1_id || !comparisonResult.document2_id}
                            title={isSaving || !noteTitle.trim() || !comparisonResult.document1_id || !comparisonResult.document2_id ? "Complete all required fields to save" : ""}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowSaveModal(false);
                              setNoteTitle("");
                              setNoteTags("");
                              setNoteColor("purple");
                            }}
                            className="flex-1 bg-transparent hover:bg-gray-700"
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Key Differences */}
            <Card className="p-8 bg-gray-900 shadow-lg border border-gray-700">
              <h2 className="text-2xl font-semibold text-white mb-6">Key Differences</h2>
              <div className="space-y-6">
                {comparisonResult.keyDifferences.map((diff, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-6 bg-gray-800 rounded-xl border border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-white">{diff.category}</h3>
                      <div
                        className={`flex items-center space-x-2 ${diff.type === "positive" ? "text-green-400" : diff.type === "negative" ? "text-red-400" : "text-gray-400"}`}
                      >
                        {diff.type === "positive" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : diff.type === "negative" ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span className="font-medium text-sm">{diff.change}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Document 1</p>
                        <p className="font-medium text-white text-sm">{diff.doc1Value}</p>
                      </div>
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Document 2</p>
                        <p className="font-medium text-white text-sm">{diff.doc2Value}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">{diff.insight}</p>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* AI Insights & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-8 bg-gray-900 shadow-lg border border-gray-700">
                <div className="flex items-center space-x-3 mb-6">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h2 className="text-2xl font-semibold text-white">AI Insights</h2>
                </div>
                <div className="space-y-4">
                  {comparisonResult.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 bg-purple-600/10 border border-purple-600/20 rounded-lg"
                    >
                      <p className="text-sm text-gray-200">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 bg-gray-900 shadow-lg border border-gray-700">
                <div className="flex items-center space-x-3 mb-6">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h2 className="text-2xl font-semibold text-white">Recommendations</h2>
                </div>
                <div className="space-y-4">
                  {comparisonResult.recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg"
                    >
                      <p className="text-sm text-gray-200">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison History */}
      {comparisonHistory.length > 0 && (
        <Card className="p-8 bg-gray-900 shadow-lg border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-6">Comparison History</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comparisonHistory.map((comparison) => (
              <div
                key={comparison.id}
                className={`p-4 bg-gray-800 rounded-xl cursor-pointer transition-colors ${
                  activeHistoryId === comparison.id ? "border border-blue-500 bg-blue-600/10" : "hover:bg-gray-750"
                }`}
                onClick={() => handleViewComparison(comparison)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate" title={`${comparison.document1.name} vs ${comparison.document2.name}`}>
                        {comparison.document1.name} vs {comparison.document2.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(comparison.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewComparison(comparison);
                    }}
                    className="hover:bg-gray-700"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ComparisonPage;