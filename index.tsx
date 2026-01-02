import React from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Upload, Sparkles, BookOpen, FileText, CheckCircle2, Menu } from "lucide-react";

// --- UI Components (Simulating Shadcn) ---

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost"; size?: "default" | "sm" | "lg" | "icon" }
>(({ className = "", variant = "default", size = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-primary text-white hover:bg-primary/90 shadow-sm",
    outline: "border border-primary bg-transparent hover:bg-white hover:text-primary",
    ghost: "hover:bg-black/5 hover:text-primary",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-12 rounded-md px-8 text-base",
    icon: "h-10 w-10",
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});
Button.displayName = "Button";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm shadow-sm text-card-foreground ${className}`}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className}`}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-2xl font-serif font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));
CardContent.displayName = "CardContent";

const Badge = ({ className = "", variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" }) => {
  const variants = {
    default: "border-transparent bg-primary text-white hover:bg-primary/80",
    secondary: "border-transparent bg-white text-primary hover:bg-white/80",
    outline: "text-foreground",
  };
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`} {...props} />
  );
};


// --- Page Sections ---

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/5 bg-[#ffeee7]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-serif font-bold tracking-tight">Notedly</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium hover:underline underline-offset-4">Features</a>
          <a href="#" className="text-sm font-medium hover:underline underline-offset-4">Pricing</a>
          <a href="#" className="text-sm font-medium hover:underline underline-offset-4">Community</a>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
          <Button>Get Started</Button>
        </div>
      </div>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <Badge variant="secondary" className="px-4 py-1.5 text-sm shadow-sm border border-black/5">
            ✨ Now with improved AI formatting
          </Badge>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight text-primary leading-[0.9]">
            Turn chaotic slides into <br/>
            <span className="italic">aesthetic notes.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-primary/70 max-w-2xl font-light leading-relaxed">
            Stop struggling with messy lecture PDFs. Upload your slides and let our AI 
            craft beautifully structured, exam-ready study guides in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
            <Button size="lg" className="gap-2 h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
              <Upload className="h-5 w-5" />
              Upload PDF
            </Button>
            <Button size="lg" variant="outline" className="gap-2 h-14 px-8 text-lg rounded-full bg-transparent border-black/10 hover:bg-white/50">
              View Example
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      icon: <Upload className="h-6 w-6" />,
      title: "Upload Slides",
      description: "Drag and drop your PDF lecture slides. We support files up to 50MB."
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI Processing",
      description: "Our engine analyzes content, extracts key points, and restructures layouts."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Get Aesthetic Notes",
      description: "Download your clean, perfectly formatted Notion-style summary."
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif text-primary">How it works</h2>
          <p className="text-primary/60 max-w-lg mx-auto">
            Three simple steps to transform your study routine. No complex settings, just results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <Card className="h-full border-black/5 bg-white/40 hover:bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-[#ffeee7] border border-black/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-primary/70 leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
              
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(100%-20px)] w-[40px] border-t-2 border-dashed border-black/10 z-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Features = () => {
    return (
        <section className="py-24 border-t border-black/5 bg-white/30 backdrop-blur-sm">
            <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-8">
                     <h2 className="text-4xl md:text-5xl font-serif text-primary leading-tight">
                        Study smarter,<br/> not harder.
                    </h2>
                    <div className="space-y-4">
                        {[
                            "Smart summarization of complex topics",
                            "Auto-generated flashcards for revision",
                            "Export to Notion, PDF, or Markdown",
                            "Highlighting of key definitions and formulas"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600/70" />
                                <span className="text-lg text-primary/80">{item}</span>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" className="mt-4 rounded-full px-8 border-black/20">
                        Explore Features
                    </Button>
                </div>
                
                <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#ffeee7] to-white rounded-2xl transform rotate-3 scale-95 opacity-50 blur-lg"></div>
                    <Card className="relative bg-white border-black/5 shadow-xl overflow-hidden transform transition-transform hover:scale-[1.02]">
                        <div className="h-8 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400/50"></div>
                        </div>
                        <div className="p-8 space-y-6 font-serif">
                             <h3 className="text-2xl font-bold border-b pb-2">Lecture 4: Photosynthesis</h3>
                             <div className="space-y-4 text-sm md:text-base text-gray-700">
                                <p><span className="font-bold bg-yellow-100 px-1 rounded">Definition:</span> The process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy.</p>
                                <div className="pl-4 border-l-2 border-green-200">
                                    <p className="italic text-gray-500 mb-1">Key Equation</p>
                                    <p className="font-mono bg-gray-50 p-2 rounded">6CO2 + 6H2O → C6H12O6 + 6O2</p>
                                </div>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Light-dependent reactions occur in thylakoids</li>
                                    <li>Calvin cycle occurs in the stroma</li>
                                </ul>
                             </div>
                        </div>
                    </Card>
                </div>
            </div>
        </section>
    )
}

const Footer = () => {
    return (
        <footer className="py-12 border-t border-black/5">
            <div className="container px-4 mx-auto text-center space-y-4">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 opacity-50" />
                    <span className="font-serif font-bold opacity-50">Notedly</span>
                </div>
                <p className="text-sm text-black/40">© 2024 Notedly AI. All rights reserved.</p>
                <div className="flex justify-center gap-6 text-sm text-black/50">
                    <a href="#" className="hover:text-black">Privacy</a>
                    <a href="#" className="hover:text-black">Terms</a>
                    <a href="#" className="hover:text-black">Twitter</a>
                </div>
            </div>
        </footer>
    )
}

function App() {
  return (
    <div className="notebook-grid font-sans text-primary min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);