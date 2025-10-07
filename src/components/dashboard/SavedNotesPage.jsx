"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Plus, BookOpen, Calendar, Tag, Star, MoreVertical, Edit, Trash2, Share } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { toast } from "react-toastify";
import { fetchSavedNotes, deleteNote, updateNote } from "../../utils/api";
import jsPDF from "jspdf";

const SavedNotesPage = ({ accessToken }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      toast.error("Authentication required. Redirecting to login...");
      setTimeout(() => (window.location.href = "/login"), 2000);
      return;
    }
    const loadNotes = async () => {
      try {
        const response = await fetchSavedNotes(accessToken);
        setNotes(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load notes:", error);
        toast.error("Failed to load saved notes");
        setLoading(false);
      }
    };
    loadNotes();
  }, [accessToken]);

  const filters = [
    { id: "all", label: "All Notes", count: notes.length },
    { id: "starred", label: "Starred", count: notes.filter((note) => note.starred).length },
    { id: "recent", label: "Recent", count: notes.slice(0, 5).length },
    ...[...new Set(notes.flatMap((note) => note.tags))].map((tag) => ({
      id: tag,
      label: tag.charAt(0).toUpperCase() + tag.slice(1),
      count: notes.filter((note) => note.tags.includes(tag)).length,
    })),
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "border-blue-500/30 bg-blue-500/5",
      purple: "border-purple-500/30 bg-purple-500/5",
      green: "border-green-500/30 bg-green-500/5",
      orange: "border-orange-500/30 bg-orange-500/5",
      cyan: "border-cyan-500/30 bg-cyan-500/5",
      pink: "border-pink-500/30 bg-pink-500/5",
    };
    return colors[color] || colors.blue;
  };

  const handleStarToggle = async (note) => {
    try {
      await updateNote(note.id, { starred: !note.starred }, accessToken);
      setNotes(notes.map((n) => (n.id === note.id ? { ...n, starred: !n.starred } : n)));
      toast.success(`Note ${note.starred ? "unstarred" : "starred"}`);
    } catch (error) {
      console.error("Failed to update star status:", error);
      toast.error("Failed to update note");
    }
  };

  const handleDelete = async (noteId) => {
    try {
      await deleteNote(noteId, accessToken);
      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
    }
  };

  const handleExport = (note) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(note.title, 20, 20);
    doc.setFontSize(12);
    doc.text(`Source: ${note.source_document?.name || note.source_type} (${note.source_id})`, 20, 30);
    doc.text(`Tags: ${note.tags.join(", ")}`, 20, 40);
    doc.text("Content:", 20, 50);
    doc.text(note.content, 20, 60, { maxWidth: 160 });
    doc.save(`${note.title}.pdf`);
    toast.success("Note exported as PDF");
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "starred" && note.starred) ||
      (selectedFilter === "recent" && notes.indexOf(note) < 5) ||
      note.tags.includes(selectedFilter);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading notes...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Saved Research Notes</h1>
          <p className="text-gray-400">Organize and access your research insights and findings.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notes, tags, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex space-x-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            className={`p-6 hover:border-gray-600 transition-all duration-300 ${getColorClasses(note.color)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <button onClick={() => handleStarToggle(note)}>
                  <Star className={`w-4 h-4 ${note.starred ? "text-yellow-400 fill-current" : "text-gray-400"}`} />
                </button>
              </div>
              <div className="relative">
                <button className="p-1 text-gray-400 hover:text-white transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2">{note.title}</h3>
            <p className="text-gray-300 text-sm mb-4 line-clamp-3">{note.content}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(note.last_modified).toLocaleDateString()}</span>
              </div>
              <span className="truncate max-w-32">{note.source_document?.name || note.source_type}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="flex-1">
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleExport(note)}>
                <Share className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(note.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No notes found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? "Try adjusting your search terms" : "Create your first research note to get started"}
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Note
          </Button>
        </div>
      )}
    </div>
  );
};

export default SavedNotesPage;