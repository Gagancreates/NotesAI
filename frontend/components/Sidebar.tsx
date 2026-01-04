"use client"
import React from "react";
import {
  Plus,
  Upload,
  FileText,
  Share,
  Download,
  BookOpen,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutTemplate,
  List,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { Button } from "./ui";

type ViewState = 'upload' | 'processing' | 'view';

const SidebarItem = ({
    icon: Icon,
    label,
    onClick,
    collapsed,
    active,
    variant = "default"
}: {
    icon: React.ComponentType<{ className?: string }>,
    label: string,
    onClick?: () => void,
    collapsed?: boolean,
    active?: boolean,
    variant?: "default" | "danger"
}) => {
    const baseColors = active
        ? "bg-primary/10 text-primary"
        : "text-primary/60 hover:bg-primary/5 hover:text-primary";

    const dangerColors = "text-red-500/70 hover:bg-red-50 hover:text-red-600";

    return (
        <button
            onClick={onClick}
            className={`
                group flex items-center gap-3 p-3 rounded-xl transition-all w-full
                ${variant === 'danger' ? dangerColors : baseColors}
                ${collapsed ? 'justify-center px-0 h-10 w-10 mx-auto' : ''}
            `}
            title={collapsed ? label : undefined}
        >
            <Icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`} />
            {!collapsed && <span className="text-sm font-medium truncate animate-in fade-in duration-200">{label}</span>}
        </button>
    );
};

interface SidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    toggleCollapse: () => void;
    closeMobile: () => void;
    onNew: () => void;
    viewState: ViewState;
    noteTitle?: string;
}

const Sidebar = ({
    isOpen,
    isCollapsed,
    toggleCollapse,
    closeMobile,
    onNew,
    viewState,
}: SidebarProps) => {
    const sidebarContent = (
        <div className="flex flex-col h-full bg-white/40 backdrop-blur-md">
            {/* Header */}
            <div className={`flex items-center p-5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex items-center gap-2 text-primary/80">
                         <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center">
                            <BookOpen className="h-5 w-5" />
                         </div>
                         <span className="font-serif font-bold text-lg">NotesAI</span>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    {/* Mobile Close */}
                    <button onClick={closeMobile} className="md:hidden p-2 hover:bg-black/5 rounded-lg text-primary/60">
                        <X className="h-5 w-5" />
                    </button>

                    {/* Desktop Collapse */}
                    <button
                        onClick={toggleCollapse}

                    >
                        {isCollapsed ? <PanelLeftOpen className="h-6 w-6" /> : <PanelLeftClose className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* New Upload Action */}
            <div className={`px-5 pb-6 ${isCollapsed ? 'px-2 flex justify-center' : ''}`}>
                {isCollapsed ? (
                    <button
                        onClick={() => { onNew(); closeMobile(); }}
                        className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
                        title="New Upload"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                ) : (
                    <Button
                        onClick={() => { onNew(); closeMobile(); }}
                        className="w-full h-12 rounded-xl shadow-sm gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        New Upload
                    </Button>
                )}
            </div>

            {/* Navigation / Content */}
            <div className="flex-1 overflow-y-auto px-3 space-y-6">

                {viewState === 'view' && (
                    <div className="space-y-1">
                        {!isCollapsed && <div className="px-3 py-2 text-xs font-bold text-primary/40 uppercase tracking-widest">In this note</div>}
                        <SidebarItem icon={LayoutTemplate} label="Summary" collapsed={isCollapsed} active />
                        <SidebarItem icon={List} label="Key Terms" collapsed={isCollapsed} />
                        <SidebarItem icon={FileText} label="Detailed Notes" collapsed={isCollapsed} />
                        <SidebarItem icon={HelpCircle} label="Quiz" collapsed={isCollapsed} />
                    </div>
                )}

                {viewState !== 'view' && !isCollapsed && (
                    <div className="px-4 py-8 text-center space-y-2 opacity-50">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/5 mb-2">
                             <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium">No active note</p>
                        <p className="text-xs">Upload a document to see content navigation.</p>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 mt-auto border-t border-black/5 space-y-1">
                {viewState === 'view' && (
                    <>
                        <SidebarItem icon={Download} label="Export PDF" collapsed={isCollapsed} />
                        <SidebarItem icon={Share} label="Share Note" collapsed={isCollapsed} />
                        <div className="my-1 border-t border-black/5 mx-2"></div>
                        <SidebarItem icon={Trash2} label="Clear Workspace" variant="danger" collapsed={isCollapsed} onClick={onNew} />
                    </>
                )}
                {/* User Profile Mini */}
                 <div className={`mt-2 flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 cursor-pointer transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-orange-200 to-pink-200 border border-white flex items-center justify-center text-xs font-serif font-bold text-primary/70 shrink-0">
                        JD
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-primary">John Doe</p>
                            <p className="text-[10px] text-primary/50">Free Plan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`
                hidden md:flex flex-col border-r border-black/5 h-full transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-20' : 'w-72'}
            `}>
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                        onClick={closeMobile}
                    ></div>
                    <div className="relative w-72 h-full bg-[#ffeee7] shadow-2xl animate-in slide-in-from-left duration-300">
                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
