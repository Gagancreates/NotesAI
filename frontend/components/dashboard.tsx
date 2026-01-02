"use client"
import React, { useState, useEffect } from "react";
import {
  Upload,
  Sparkles,
  BookOpen,
  Menu,
  ChevronRight,
  CheckCircle,
  LayoutTemplate,
  List,
  FileText,
  HelpCircle,
} from "lucide-react";
import { Button, Badge } from "./ui";
import Sidebar from "./Sidebar";

// --- Types ---

type ViewState = 'upload' | 'processing' | 'view';

interface NoteData {
    id: number;
    title: string;
    date: string;
    summary: string;
    keyTerms: { term: string; def: string }[];
    content: { heading: string; points: string[] }[];
}

// --- Mock Data ---

const MOCK_GENERATED_NOTE: NoteData = {
    id: 999,
    title: "Lecture 4: The Renaissance",
    date: "Just now",
    summary: "This lecture covers the cultural rebirth in Florence during the 14th-17th centuries, focusing on the Medici family's patronage, key figures like Da Vinci and Michelangelo, and the shift towards humanism in art and philosophy.",
    keyTerms: [
        { term: "Humanism", def: "An intellectual movement focusing on human potential and achievements." },
        { term: "Patronage", def: "Financial support given by wealthy families (e.g., Medici) to artists." },
        { term: "Perspective", def: "Artistic technique creating an illusion of three-dimensional depth." },
    ],
    content: [
        {
            heading: "The Medici Influence",
            points: [
                "The Medici family rose to power through banking and commerce.",
                "Cosimo de' Medici established the family as the de facto rulers of Florence.",
                "Lorenzo 'The Magnificent' was a major patron of the arts, sponsoring Botticelli and Michelangelo."
            ]
        },
        {
            heading: "Artistic Innovations",
            points: [
                "Shift from religious symbolism to realistic representation.",
                "Brunelleschi's Dome (Duomo) demonstrated the revival of classical architecture.",
                "Donatello's 'David' was the first free-standing bronze nude since antiquity."
            ]
        }
    ]
};

// --- Components ---

const UploadView = ({ onUpload }: { onUpload: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full p-6 md:p-8 animate-in fade-in duration-500">
        <div className="max-w-xl w-full text-center space-y-8">
            <div className="space-y-3">
                <Badge variant="secondary" className="mb-2">Single File Workspace</Badge>
                <h2 className="text-3xl md:text-4xl font-serif font-medium text-primary">Upload Lecture Slides</h2>
                <p className="text-primary/60 text-base md:text-lg">
                    Focus on one lecture at a time. Upload your PDF to generate a comprehensive study guide.
                </p>
            </div>

            <div 
                onClick={onUpload}
                className="group relative border-2 border-dashed border-black/10 rounded-3xl p-10 md:p-16 hover:border-black/20 hover:bg-white/40 transition-all cursor-pointer bg-white/20 backdrop-blur-sm shadow-sm"
            >
                <div className="flex flex-col items-center gap-6">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-6 w-6 md:h-8 md:w-8 text-primary/80" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg md:text-xl font-medium text-primary/80">Click or drag PDF here</p>
                        <p className="text-xs md:text-sm text-primary/50">Supports PDF, PPTX (Max 50MB)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs md:text-sm text-primary/40">
                <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Auto-Formatting</span>
                <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Key Terms</span>
                <span className="flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Smart Quiz</span>
            </div>
        </div>
    </div>
);

const ProcessingView = ({ onComplete }: { onComplete: () => void }) => {
    const [step, setStep] = useState(0);
    const steps = [
        "Reading document structure...",
        "Analyzing key concepts...",
        "Generating formatting...",
        "Finalizing study guide..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep(prev => {
                if (prev >= steps.length - 1) {
                    clearInterval(interval);
                    setTimeout(onComplete, 800);
                    return prev;
                }
                return prev + 1;
            });
        }, 1200);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center space-y-8 max-w-md">
                <div className="relative h-24 w-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-black/5 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-medium">{steps[step]}</h3>
                    <p className="text-primary/50">This usually takes about 10-15 seconds.</p>
                </div>

                <div className="flex justify-center gap-2">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-primary/20'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const NoteView = ({ note }: { note: NoteData }) => (
    <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Note Header */}
            <header className="space-y-4 border-b border-black/5 pb-8">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-primary/40 uppercase tracking-widest">
                    <span className="bg-primary/5 px-2 py-0.5 rounded">Generated Note</span>
                    <span>•</span>
                    <span>{note.date}</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-serif font-medium text-primary leading-tight">
                    {note.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-none">
                        High Confidence
                    </Badge>
                    <span className="text-xs text-primary/40">Read time: 5 mins</span>
                </div>
            </header>

            {/* Summary Block */}
            <section className="bg-white/60 p-6 rounded-2xl border border-black/5 shadow-sm backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="h-24 w-24" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-primary/80 relative z-10">
                    <LayoutTemplate className="h-4 w-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Executive Summary</h3>
                </div>
                <p className="text-lg leading-relaxed text-primary/80 font-serif relative z-10">
                    {note.summary}
                </p>
            </section>

            {/* Key Terms Grid */}
            <section>
                <div className="flex items-center gap-2 mb-4 text-primary/80">
                    <List className="h-4 w-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Key Definitions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {note.keyTerms.map((term, i) => (
                        <div key={i} className="bg-white/40 p-4 rounded-xl border border-black/5 hover:bg-white/60 transition-colors group">
                            <span className="block font-bold text-primary mb-1 group-hover:text-primary/100 transition-colors">{term.term}</span>
                            <span className="text-sm text-primary/70 leading-relaxed">{term.def}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Main Content */}
            <section className="space-y-8">
                 <div className="flex items-center gap-2 text-primary/80 border-b border-black/5 pb-2">
                    <FileText className="h-4 w-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Detailed Notes</h3>
                </div>
                {note.content.map((section, i) => (
                    <div key={i} className="space-y-3">
                        <h2 className="text-2xl font-serif font-semibold text-primary/90">{section.heading}</h2>
                        <ul className="space-y-3 pl-4">
                            {section.points.map((point, j) => (
                                <li key={j} className="relative pl-6 text-primary/80 leading-relaxed group">
                                    <span className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-black/20 group-hover:bg-primary transition-colors"></span>
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>

            {/* Quiz Section Placeholder */}
            <section className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#fff0e6] to-white border border-black/5">
                <div className="flex items-center gap-2 mb-4 text-primary/80">
                    <HelpCircle className="h-4 w-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Knowledge Check</h3>
                </div>
                <div className="space-y-4">
                    <p className="font-serif text-xl font-medium">Which family was the primary driver of patronage in Renaissance Florence?</p>
                    <div className="grid grid-cols-1 gap-2">
                        {['The Borgias', 'The Medicis', 'The Habsburgs'].map((opt, i) => (
                            <button key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/50 border border-black/5 hover:bg-white hover:border-black/20 transition-all text-sm group">
                                <span>{opt}</span>
                                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    </div>
);

// --- Main Dashboard Container ---

const Dashboard = () => {
    const [viewState, setViewState] = useState<ViewState>('upload');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    // Simulate flow
    const handleUpload = () => {
        setViewState('processing');
    };

    const handleProcessComplete = () => {
        setViewState('view');
    };

    const handleNewClick = () => {
        setViewState('upload');
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
                noteTitle={viewState === 'view' ? MOCK_GENERATED_NOTE.title : undefined}
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
                        {viewState === 'upload' && <UploadView onUpload={handleUpload} />}
                        {viewState === 'processing' && <ProcessingView onComplete={handleProcessComplete} />}
                        {viewState === 'view' && <NoteView note={MOCK_GENERATED_NOTE} />}
                    </div>
                </div>
            </main>
        </div>
    )
};

export default Dashboard;