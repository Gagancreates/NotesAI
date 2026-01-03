"use client"
import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  BookOpen,
  Menu,
  ChevronRight,
  CheckCircle,
  LayoutTemplate,
  List,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button, Badge } from "./ui";
import Sidebar from "./Sidebar";
import { uploadPDF, checkStatus, generateNotes, getNotes, type NoteResponse } from "@/lib/api";

// --- Types ---

type ViewState = 'upload' | 'processing' | 'ready' | 'generating' | 'view' | 'error';

// --- Components ---

const UploadView = ({ onUpload, isUploading }: { onUpload: (file: File) => void; isUploading: boolean }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            onUpload(file);
        } else {
            alert('Please select a PDF file');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-xl w-full text-center space-y-8">
                <div className="space-y-3">
                    <Badge variant="secondary" className="mb-2">Single File Workspace</Badge>
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-primary">Upload Lecture Slides</h2>
                    <p className="text-primary/60 text-base md:text-lg">
                        Focus on one lecture at a time. Upload your PDF to generate a comprehensive study guide.
                    </p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                />

                <div
                    onClick={handleClick}
                    className={`group relative border-2 border-dashed border-black/10 rounded-3xl p-10 md:p-16 hover:border-black/20 hover:bg-white/40 transition-all cursor-pointer bg-white/20 backdrop-blur-sm shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="flex flex-col items-center gap-6">
                        <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-6 w-6 md:h-8 md:w-8 text-primary/80" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg md:text-xl font-medium text-primary/80">
                                {isUploading ? 'Uploading...' : 'Click or drag PDF here'}
                            </p>
                            <p className="text-xs md:text-sm text-primary/50">PDF only (Max 50MB)</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs md:text-sm text-primary/40">
                    <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Auto-Formatting</span>
                    <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Key Terms</span>
                    <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Comprehensive</span>
                </div>
            </div>
        </div>
    );
};

const ProcessingView = ({ progress, stage }: { progress: number; stage: string }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center space-y-8 max-w-md">
                <div className="relative h-24 w-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-black/5 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{progress}%</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-medium">{stage}</h3>
                    <p className="text-primary/50">This may take a few moments...</p>
                </div>

                <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

const ReadyView = ({ onGenerate, isGenerating }: { onGenerate: () => void; isGenerating: boolean }) => (
    <div className="flex flex-col items-center justify-center h-full p-8 animate-in fade-in duration-500">
        <div className="text-center space-y-8 max-w-md">
            <div className="h-24 w-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <div className="space-y-3">
                <h3 className="text-3xl font-serif font-medium text-primary">PDF Processed Successfully!</h3>
                <p className="text-primary/70 text-lg">
                    Your document has been analyzed and is ready for note generation.
                </p>
            </div>

            <Button
                onClick={onGenerate}
                disabled={isGenerating}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
                {isGenerating ? (
                    <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Starting...
                    </span>
                ) : (
                    'Generate Notes'
                )}
            </Button>

            <p className="text-xs text-primary/40">
                This will use AI to create comprehensive study notes
            </p>
        </div>
    </div>
);

const ErrorView = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center space-y-6 max-w-md">
            <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-serif font-medium text-primary">Processing Failed</h3>
                <p className="text-primary/70">{error}</p>
            </div>
            <Button onClick={onRetry} className="bg-primary hover:bg-primary/90">
                Try Again
            </Button>
        </div>
    </div>
);

const NoteView = ({ note }: { note: NoteResponse }) => {
    const { notes } = note;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-500">

                {/* Note Header */}
                <header className="space-y-4 border-b border-black/5 pb-8">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-primary/40 uppercase tracking-widest">
                        <span className="bg-primary/5 px-2 py-0.5 rounded">Generated Note</span>
                        <span>•</span>
                        <span>{new Date(note.generated_at).toLocaleDateString()}</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-serif font-medium text-primary leading-tight">
                        {notes.title}
                    </h1>
                </header>

                {/* Summary Block */}
                {notes.summary && (
                    <section className="bg-white/60 p-6 rounded-2xl border border-black/5 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3 text-primary/80">
                            <LayoutTemplate className="h-4 w-4" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Summary</h3>
                        </div>
                        <p className="text-lg leading-relaxed text-primary/80 font-serif">
                            {notes.summary}
                        </p>
                    </section>
                )}

                {/* Key Terms Grid */}
                {notes.keyTerms && notes.keyTerms.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-primary/80">
                            <List className="h-4 w-4" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Key Terms</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {notes.keyTerms.map((term, i) => (
                                <div key={i} className="bg-white/40 p-4 rounded-xl border border-black/5 hover:bg-white/60 transition-colors group">
                                    <span className="block font-bold text-primary mb-1">{term.term}</span>
                                    <span className="text-sm text-primary/70 leading-relaxed">{term.definition}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Main Content */}
                {notes.sections && notes.sections.length > 0 && (
                    <section className="space-y-8">
                        <div className="flex items-center gap-2 text-primary/80 border-b border-black/5 pb-2">
                            <FileText className="h-4 w-4" />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Detailed Notes</h3>
                        </div>
                        {notes.sections.map((section, i) => (
                            <div key={i} className="space-y-4">
                                <h2 className="text-2xl font-serif font-semibold text-primary/90">{section.heading}</h2>
                                {section.introduction && (
                                    <p className="text-primary/70 leading-relaxed font-serif italic">{section.introduction}</p>
                                )}
                                {section.subsections && section.subsections.map((sub, j) => (
                                    <div key={j} className="ml-4 space-y-2">
                                        <h3 className="text-xl font-serif font-medium text-primary/85">{sub.subheading}</h3>
                                        {sub.points && sub.points.length > 0 && (
                                            <ul className="space-y-2 pl-4">
                                                {sub.points.map((point, k) => (
                                                    <li key={k} className="relative pl-6 text-primary/80 leading-relaxed">
                                                        <span className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-black/20"></span>
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {sub.examples && sub.examples.length > 0 && (
                                            <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-200/30 mt-3">
                                                <p className="text-xs font-bold uppercase tracking-wider text-amber-900/70 mb-2">Examples</p>
                                                {sub.examples.map((example, k) => (
                                                    <p key={k} className="text-sm text-amber-900/80 italic">{example}</p>
                                                ))}
                                            </div>
                                        )}
                                        {sub.formulas && sub.formulas.length > 0 && (
                                            <div className="space-y-2 mt-3">
                                                {sub.formulas.map((formula, k) => (
                                                    <div key={k} className="bg-blue-50/50 p-3 rounded-lg border border-blue-200/30">
                                                        <code className="text-sm font-mono text-blue-900">{formula.formula}</code>
                                                        <p className="text-xs text-blue-900/70 mt-1">{formula.explanation}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
};

// --- Main Dashboard Container ---

const Dashboard = () => {
    const [viewState, setViewState] = useState<ViewState>('upload');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState('');
    const [docId, setDocId] = useState<string | null>(null);
    const [notes, setNotes] = useState<NoteResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Poll status for PDF processing
    useEffect(() => {
        if (!docId || viewState !== 'processing') return;

        const pollInterval = setInterval(async () => {
            try {
                const status = await checkStatus(docId);
                setProgress(status.progress);
                setStage(status.current_stage || 'Processing...');

                if (status.status === 'ready') {
                    // Stop polling and show "Generate Notes" button
                    clearInterval(pollInterval);
                    setViewState('ready');
                } else if (status.status === 'failed') {
                    clearInterval(pollInterval);
                    setError(status.current_stage || 'Processing failed');
                    setViewState('error');
                }
            } catch (err) {
                console.error('Status poll error:', err);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(pollInterval);
    }, [docId, viewState]);

    // Poll status for note generation
    useEffect(() => {
        if (!docId || viewState !== 'generating') return;

        const pollInterval = setInterval(async () => {
            try {
                const status = await checkStatus(docId);
                setProgress(status.progress);
                setStage(status.current_stage || 'Generating notes...');

                if (status.status === 'completed') {
                    // Fetch generated notes
                    clearInterval(pollInterval);
                    const noteData = await getNotes(docId);
                    setNotes(noteData);
                    setViewState('view');
                } else if (status.status === 'failed') {
                    clearInterval(pollInterval);
                    setError(status.current_stage || 'Generation failed');
                    setViewState('error');
                }
            } catch (err) {
                console.error('Generation poll error:', err);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(pollInterval);
    }, [docId, viewState]);

    const handleUpload = async (file: File) => {
        try {
            setIsUploading(true);
            setError(null);
            const response = await uploadPDF(file);
            setDocId(response.doc_id);
            setViewState('processing');
            setProgress(0);
            setStage('Uploading PDF...');
        } catch (err: any) {
            setError(err.message || 'Upload failed');
            setViewState('error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerate = async () => {
        if (!docId) return;

        try {
            setIsGenerating(true);
            await generateNotes(docId);
            setViewState('generating');
            setProgress(0);
            setStage('Starting note generation...');
        } catch (err: any) {
            setError(err.message || 'Failed to start note generation');
            setViewState('error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRetry = () => {
        setViewState('upload');
        setDocId(null);
        setNotes(null);
        setError(null);
        setProgress(0);
    };

    const handleNewClick = () => {
        setViewState('upload');
        setDocId(null);
        setNotes(null);
        setError(null);
        setProgress(0);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#ffeee7]">
            <Sidebar
                isOpen={isMobileSidebarOpen}
                isCollapsed={isDesktopCollapsed}
                toggleCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                closeMobile={() => setIsMobileSidebarOpen(false)}
                onNew={handleNewClick}
                viewState={viewState}
                noteTitle={notes?.notes.title}
            />

            <main className="flex-1 flex flex-col relative bg-[#ffeee7] md:bg-transparent min-w-0">
                {/* Mobile Header Trigger */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-black/5 bg-[#ffeee7]/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="font-serif font-bold text-lg">NotesAI</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>

                {/* Content Container */}
                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0 md:m-4 md:rounded-3xl bg-white/30 backdrop-blur-md shadow-lg border border-white/20 overflow-hidden transition-all">
                        {viewState === 'upload' && <UploadView onUpload={handleUpload} isUploading={isUploading} />}
                        {viewState === 'processing' && <ProcessingView progress={progress} stage={stage} />}
                        {viewState === 'ready' && <ReadyView onGenerate={handleGenerate} isGenerating={isGenerating} />}
                        {viewState === 'generating' && <ProcessingView progress={progress} stage={stage} />}
                        {viewState === 'error' && <ErrorView error={error || 'Unknown error'} onRetry={handleRetry} />}
                        {viewState === 'view' && notes && <NoteView note={notes} />}
                    </div>
                </div>
            </main>
        </div>
    )
};

export default Dashboard;
