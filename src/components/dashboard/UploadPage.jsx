"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { uploadDocuments, fetchDocuments } from "../../utils/api";

const UploadPage = ({ accessToken }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const fileInputRef = useRef(null); // Ref to access the file input

  useEffect(() => {
    if (!accessToken) {
      toast.error("Please log in to view documents.");
      return;
    }
    const loadDocuments = async () => {
      try {
        const response = await fetchDocuments(accessToken);
        setDocuments(response.data);
      } catch (error) {
        toast.error("Failed to load documents: " + (error.response?.data?.error || error.message));
      }
    };
    loadDocuments();
  }, [accessToken]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList) => {
    const allowedTypes = ["pdf", "docx", "doc", "csv", "xlsx"];
    const maxSize = 10 * 1024 * 1024;
    const newFiles = Array.from(fileList).map((file) => {
      const fileType = file.name.split(".").pop().toLowerCase();
      const isValidType = allowedTypes.includes(fileType);
      const isValidSize = file.size <= maxSize;
      return {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        status: isValidType && isValidSize ? "pending" : "error",
        error: !isValidType ? "Unsupported file type" : !isValidSize ? "File size exceeds 10MB" : null,
        progress: 0,
      };
    });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const uploadFiles = async () => {
    if (!accessToken) {
      toast.error("Please log in to upload files.");
      return;
    }
    setUploading(true);
    const pendingFiles = files.filter((f) => f.status === "pending");

    if (pendingFiles.length === 0) {
      setUploading(false);
      return;
    }

    try {
      const response = await uploadDocuments(pendingFiles, accessToken);
      setFiles((prev) =>
        prev.map((file) => {
          const result = response.data.find((res) => res.name === file.name);
          if (!result) return file;
          return {
            ...file,
            status: result.error ? "error" : "completed",
            error: result.error || null,
            progress: result.error ? 0 : 100,
          };
        })
      );
      const documentsResponse = await fetchDocuments(accessToken);
      setDocuments(documentsResponse.data);
      toast.success("Files uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message); // Debug
      setFiles((prev) =>
        prev.map((file) =>
          file.status === "pending" ? { ...file, status: "error", error: "Upload failed", progress: 0 } : file
        )
      );
      toast.error("Upload failed: " + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleBrowseClick = () => {
    console.log("Browse button clicked"); // Debug
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Programmatically trigger file input
    }
  };

  const acceptedTypes = [".pdf", ".docx", ".doc", ".csv", ".xlsx"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Upload Documents</h1>
        <p className="text-gray-400">Upload your research documents for AI analysis and insights.</p>
      </div>

      <Card className="p-8">
        <div
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
            ${dragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-600 hover:border-gray-500"}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Drop your files here, or browse</h3>
              <p className="text-gray-400 mb-4">Supports PDF, Word documents, and CSV files up to 10MB</p>
              <input
                type="file"
                multiple
                accept={acceptedTypes.join(",")}
                onChange={(e) => {
                  console.log("File input changed, files:", e.target.files); // Debug
                  handleFiles(e.target.files);
                }}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
              <Button onClick={handleBrowseClick} className="cursor-pointer">
                Browse Files
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-400">
              {acceptedTypes.map((type) => (
                <span key={type} className="px-2 py-1 bg-gray-800 rounded">
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {files.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Files ({files.length})</h2>
            <div className="space-x-3">
              <Button variant="outline" onClick={() => setFiles([])} disabled={uploading}>
                Clear All
              </Button>
              <Button onClick={uploadFiles} disabled={uploading || files.every((f) => f.status !== "pending")}>
                {uploading ? "Uploading..." : "Upload All"}
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center space-x-4 flex-1">
                  <FileText className="w-8 h-8 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{file.name}</h3>
                    <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                    {file.status === "error" && (
                      <p className="text-sm text-red-400">{file.error}</p>
                    )}
                    {file.status === "uploading" && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{file.progress}% uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {file.status === "completed" && <CheckCircle className="w-5 h-5 text-green-400" />}
                  {file.status === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {documents.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Uploaded Documents ({documents.length})</h2>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center space-x-4 flex-1">
                  <FileText className="w-8 h-8 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{doc.name}</h3>
                    <p className="text-sm text-gray-400">{formatFileSize(doc.size)}</p>
                    <p className="text-sm text-gray-400">Uploaded: {new Date(doc.uploaded_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upload Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div className="space-y-2">
            <h3 className="font-medium text-white">Supported Formats</h3>
            <ul className="space-y-1">
              <li>• PDF documents (.pdf)</li>
              <li>• Word documents (.docx, .doc)</li>
              <li>• Spreadsheets (.csv, .xlsx)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-white">Best Practices</h3>
            <ul className="space-y-1">
              <li>• Keep files under 10MB for faster processing</li>
              <li>• Use descriptive filenames</li>
              <li>• Ensure text is readable (not scanned images)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UploadPage;