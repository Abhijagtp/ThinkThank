"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, FileText, Sparkles, BarChart3, TrendingUp, BookOpen, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { fetchDocuments, analyzeDocument, fetchChatHistory } from "../../utils/api";

const AnalysisPage = ({ accessToken }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content:
        "Hello! I'm your AI research assistant powered by Grok 4 Fast. Select a document from the left panel and ask me anything about it. I can summarize, analyze trends, extract key insights, and answer specific questions.",
      timestamp: new Date(),
      insights: [],
      is_json: false,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [outputFormat, setOutputFormat] = useState("markdown");
  const [showSaveModal, setShowSaveModal] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteTags, setNoteTags] = useState("");
  const [noteColor, setNoteColor] = useState("blue");
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef(null);
  const isProcessingRef = useRef(false); // Flag to prevent duplicate processing

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

  // Fetch chat history when document is selected (debounced)
  useEffect(() => {
    if (!selectedDocument || !accessToken || isProcessingRef.current) return;

    const loadChatHistory = async () => {
      isProcessingRef.current = true;
      try {
        const response = await fetchChatHistory(selectedDocument.id, accessToken);
        const history = response.data
          .map((item) => ({
            ...item.message,
            timestamp: new Date(item.message.timestamp),
          }))
          // Deduplicate by unique ID and timestamp
          .filter(
            (msg, index, self) =>
              index ===
              self.findIndex(
                (m) => m.id === msg.id && new Date(m.timestamp).getTime() === new Date(msg.timestamp).getTime()
              )
          );
        const welcomeMessage = messages[0].type === "ai" && !history.length ? [messages[0]] : [];
        setMessages([...welcomeMessage, ...history]);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        toast.error("Failed to load chat history");
      } finally {
        isProcessingRef.current = false;
      }
    };

    const timeoutId = setTimeout(loadChatHistory, 100); // Debounce by 100ms
    return () => clearTimeout(timeoutId);
  }, [selectedDocument, accessToken]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedDocument || !accessToken || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
      insights: [],
      is_json: false,
      token_usage: null,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const chatHistory = messages
        .filter((msg) => msg.type !== "ai" || msg.id !== 1)
        .map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        }));

      const response = await analyzeDocument(selectedDocument.id, inputMessage, chatHistory, accessToken, {
        output_format: outputFormat,
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: response.data.content,
        timestamp: new Date(),
        insights: response.data.insights || [],
        token_usage: response.data.token_usage,
        is_json: outputFormat === "json",
      };

      // Add AI message only if not already present
      setMessages((prev) => {
        const existingMessage = prev.find(
          (msg) => msg.type === "ai" && msg.content === aiMessage.content && msg.timestamp.getTime() === aiMessage.timestamp.getTime()
        );
        return existingMessage ? prev : [...prev, aiMessage];
      });
    } catch (error) {
      console.error("Analysis error:", error.response?.data || error.message);
      const errorMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: "Sorry, I encountered an error analyzing your query. Please try again.",
        timestamp: new Date(),
        insights: [],
        is_json: false,
        token_usage: null,
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Analysis failed: " + (error.response?.data?.error || error.message));
    } finally {
      setIsTyping(false);
      isProcessingRef.current = false;
    }
  };

  const handleSaveNote = async (message) => {
    if (!selectedDocument || !accessToken) {
      toast.error("No document selected or unauthorized access");
      return;
    }

    const tags = noteTags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag);
    const finalTitle = noteTitle.trim() || `Analysis of ${selectedDocument.name}`;

    if (!finalTitle) {
      toast.error("Note title cannot be empty");
      return;
    }

    setIsSaving(true);
    const noteData = {
      note_title: finalTitle,
      content: message.content,
      tags: tags.length > 0 ? tags : ["analysis", selectedDocument.name.toLowerCase().replace(/\s/g, "-")],
      source_document: selectedDocument.id,
      source_type: "analysis",
      source_id: message.id.toString(),
      starred: false,
      color: noteColor,
      save_to_notes: true,
    };

    try {
      const response = await analyzeDocument(selectedDocument.id, message.content, [], accessToken, noteData);
      if (response.data.saved_note) {
        toast.success("Note saved successfully");
        setShowSaveModal(null);
        setNoteTitle("");
        setNoteTags("");
        setNoteColor("blue");
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

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "docx":
        return "📝";
      case "csv":
        return "📊";
      default:
        return "📄";
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="h-full flex gap-6 animate-fade-in">
      {/* Left Panel - Documents */}
      <div className="w-1/3 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Document Analysis</h1>
          <p className="text-gray-400">Select a document to start analyzing with AI</p>
        </div>
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Your Documents</h2>
          <div className="space-y-3">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc)}
                  className={`
                    p-4 rounded-xl cursor-pointer transition-all duration-200
                    ${
                      selectedDocument?.id === doc.id
                        ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50"
                        : "bg-gray-800 hover:bg-gray-750 border border-transparent"
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-xl">{getFileIcon(doc.file_type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm truncate" title={doc.name}>{doc.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">{formatFileSize(doc.size || 0)}</p>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400">
                          <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Analyze with AI
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">
                No documents uploaded yet.{" "}
                <Button onClick={() => (window.location.href = "/dashboard?tab=upload")}>Upload now</Button>
              </p>
            )}
          </div>
        </Card>
        {selectedDocument && (
          <Card className="p-4">
            <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-transparent"
                onClick={() => setInputMessage("Summarize this document")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Summary
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-transparent"
                onClick={() => setInputMessage("Extract key insights and trends")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Extract Key Insights
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-transparent"
                onClick={() => setInputMessage("Create a detailed report")}
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">AI Research Assistant (Grok 4 Fast)</h2>
                  <p className="text-sm text-gray-400">
                    {selectedDocument ? `Analyzing: ${selectedDocument.name}` : "Select a document to start"}
                  </p>
                </div>
              </div>
              {selectedDocument && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Ready</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-12">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${message.type === "user" ? "justify-end" : "justify-start"} animate-message-in`}
              >
                <div
                  className={`flex items-start space-x-4 max-w-3xl ${
                    message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                      message.type === "user" ? "bg-blue-500" : "bg-gradient-to-r from-purple-600 to-purple-500"
                    }`}
                  >
                    {message.type === "user" ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl p-6 w-full break-words flex-1 ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-l-md rounded-r-2xl"
                        : "bg-gray-700 text-gray-50 rounded-r-md rounded-l-2xl border border-gray-600 shadow-sm animate-pulse-once"
                    }`}
                  >
                    {message.is_json ? (
                      <pre className="text-sm leading-relaxed overflow-x-auto bg-gray-800 p-3 rounded-lg border border-gray-600 max-w-full">
                        {typeof message.content === "string"
                          ? JSON.stringify(JSON.parse(message.content), null, 2)
                          : JSON.stringify(message.content, null, 2)}
                      </pre>
                    ) : (
                      <div className="prose prose-invert max-w-full">
                        <ReactMarkdown
                          components={{
                            h1: ({ node, ...props }) => (
                              <h1 className="text-xl font-bold text-white mt-4 mb-3 border-b border-gray-600 pb-2" {...props} />
                            ),
                            h2: ({ node, ...props }) => (
                              <h2 className="text-lg font-semibold text-white mt-3 mb-2" {...props} />
                            ),
                            h3: ({ node, ...props }) => (
                              <h3 className="text-base font-medium text-white mt-2 mb-1" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul className="list-disc list-inside text-gray-50 space-y-2 mt-2 ml-4" {...props} />
                            ),
                            li: ({ node, ...props }) => <li className="text-sm text-gray-50 break-words" {...props} />,
                            p: ({ node, ...props }) => <p className="text-sm leading-relaxed text-gray-50 mb-3 break-words" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    {message.insights && message.insights.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Key Insights:</h4>
                        {message.insights.map((insight, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-600/50 rounded-lg border border-gray-500 break-words"
                          >
                            <span className="text-sm text-gray-200 break-words">{insight.label}</span>
                            <span className="text-sm font-medium text-white break-words">{insight.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.type === "ai" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-gray-300 hover:text-white hover:bg-gray-600"
                        onClick={() => setShowSaveModal(message.id)}
                        title="Save this response to notes"
                      >
                        <BookOpen className="w-5 h-5 mr-2" />
                        Save to Notes
                      </Button>
                    )}
                    <p
                      className={`text-xs font-medium mt-3 ${
                        message.type === "user" ? "text-blue-300" : "text-purple-300"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start w-full">
                <div className="flex items-start space-x-4 max-w-3xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-gray-700 rounded-r-md rounded-l-2xl p-6 border border-gray-600 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {showSaveModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-white mb-4">Save to Notes</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300">Note Title</label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder={`Analysis of ${selectedDocument?.name}`}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={noteTags}
                      onChange={(e) => setNoteTags(e.target.value)}
                      placeholder="e.g., analysis, summary"
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Color</label>
                    <select
                      value={noteColor}
                      onChange={(e) => setNoteColor(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="blue">Blue</option>
                      <option value="purple">Purple</option>
                      <option value="green">Green</option>
                      <option value="orange">Orange</option>
                      <option value="cyan">Cyan</option>
                      <option value="pink">Pink</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleSaveNote(messages.find((msg) => msg.id === showSaveModal))}
                      className="flex-1"
                      disabled={isSaving || !noteTitle.trim()}
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
                        setShowSaveModal(null);
                        setNoteTitle("");
                        setNoteTags("");
                        setNoteColor("blue");
                      }}
                      className="flex-1 bg-transparent"
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder={
                    selectedDocument
                      ? "Ask me anything about this document..."
                      : "Select a document first to start asking questions"
                  }
                  disabled={!selectedDocument}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !selectedDocument || isTyping}
                className="px-4 py-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>Press Enter to send</span>
              {selectedDocument && <span>Context: {selectedDocument.name}</span>}
            </div>
          </div>
        </Card>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulseOnce {
          0% {
            background-color: rgba(55, 65, 81, 0.5); /* bg-gray-700 */
          }
          50% {
            background-color: rgba(75, 85, 99, 0.8); /* slightly lighter */
          }
          100% {
            background-color: rgba(55, 65, 81, 0.5);
          }
        }
        .animate-message-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-pulse-once {
          animation: pulseOnce 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AnalysisPage;