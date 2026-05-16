import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Send, 
  Mic, 
  MicOff, 
  X, 
  User as UserIcon, 
  Heart, 
  Package, 
  LogOut,
  Camera,
  Upload,
  Search,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Globe,
  ChevronDown,
  Gift,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share2,
  RotateCcw,
  MoreHorizontal,
  SendHorizontal
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { analyzeImage, chatWithAi, comparePrices, generateVirtualTryOn, AnalysisResult, OutfitSuggestion } from '../services/geminiService';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'try-me' | 'compare' | 'profile'>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (img: string) => {
    setAnalyzing(true);
    setResult(null); // Clear previous results
    try {
      const res = await analyzeImage(img);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 font-sans">
      {/* Sidebar */}
      <nav className="w-24 md:w-64 border-r border-white/5 flex flex-col p-6 bg-zinc-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
             <Sparkles className="w-6 h-6 text-black" />
          </div>
          <span className="font-display italic text-2xl font-bold hidden md:block">Luxe AI</span>
        </div>

        <div className="space-y-4 flex-grow">
          <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<TrendingUp />} label="Home" />
          <NavItem active={activeTab === 'try-me'} onClick={() => setActiveTab('try-me')} icon={<Camera />} label="Try Me" />
          <NavItem active={activeTab === 'compare'} onClick={() => setActiveTab('compare')} icon={<Search />} label="Compare" />
          <NavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon />} label="Profile" />
        </div>

        <button 
          onClick={() => signOut(auth)}
          className="mt-auto flex items-center gap-4 p-4 rounded-2xl text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          <LogOut className="w-6 h-6" />
          <span className="font-medium hidden md:block">Sign Out</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-grow overflow-hidden relative">
        <AnimatePresence mode="wait">
          {analyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-40 h-40 border border-white/5 rounded-full flex items-center justify-center"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Sparkles className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 text-center"
              >
                <h2 className="text-3xl font-display italic font-bold mb-2 tracking-widest uppercase">Digital Couture</h2>
                <p className="text-zinc-500 font-medium tracking-[0.3em] text-[10px] uppercase">Crafting your unique style profile</p>
              </motion.div>
            </motion.div>
          )}
          {activeTab === 'home' ? (
            <HomeTab key="home" />
          ) : (
            <div className="h-full overflow-y-auto p-4 md:p-12">
              {activeTab === 'try-me' && <TryMeTab key="try-me" image={image} setImage={setImage} result={result} analyzing={analyzing} onAnalyze={handleAnalyze} />}
              {activeTab === 'compare' && <CompareTab key="compare" image={image} setImage={setImage} />}
              {activeTab === 'profile' && <ProfileTab key="profile" />}
            </div>
          )}
        </AnimatePresence>

        {/* Chat Toggle */}
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-10 right-10 w-16 h-16 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
        >
          <MessageSquare className="w-8 h-8" />
        </button>

        <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </main>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
      active ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:bg-white/5 hover:text-white"
    )}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
    <span className="font-medium hidden md:block">{label}</span>
  </button>
);

const HomeTab = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Hello! I am your personal AI Stylist. How can I help you elevate your wardrobe today? Tell me about an upcoming event or ask for a look recommendation!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const res = await chatWithAi(textToSend + " suggest specific outfits and matching accessories with direct clickable shopping links from platforms like Myntra, Ajio, Flipkart, or Nykaa. Be very detailed about the style and materials.", messages);
      setMessages(prev => [...prev, { role: 'ai', text: res }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = async () => {
        setIsRecording(false);
        handleSend("Suggest a premium velvet outfit for a winter wedding");
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-0">
      <header className="flex items-center justify-between py-4 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-xl transition-colors group">
          <span className="text-xl font-bold text-white">ChatGPT</span>
          <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-lg text-xs font-semibold text-zinc-300 hover:bg-white/5 cursor-pointer">
              <Gift className="w-4 h-4 text-emerald-500" /> Free offer
           </div>
           <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
           </button>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto no-scrollbar scroll-smooth">
        <div className="py-8 flex flex-col gap-12">
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex w-full group",
                m.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex flex-col gap-3 max-w-[85%] sm:max-w-[75%]",
                m.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-5 py-3 rounded-3xl",
                  m.role === 'user' ? "bg-[#2f2f2f] text-white" : "text-zinc-100 text-left text-lg leading-relaxed"
                )}>
                   <div className="markdown-body">
                      <ReactMarkdown
                        components={{
                          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="font-bold underline highlight-link" />
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                   </div>
                </div>
                
                {m.role === 'ai' && (
                  <div className="flex items-center gap-5 text-zinc-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                     <button className="hover:text-zinc-300 transition-all"><Copy className="w-4 h-4" /></button>
                     <button className="hover:text-zinc-300 transition-all"><ThumbsUp className="w-4 h-4" /></button>
                     <button className="hover:text-zinc-300 transition-all"><ThumbsDown className="w-4 h-4" /></button>
                     <button className="hover:text-zinc-300 transition-all"><Share2 className="w-4 h-4" /></button>
                     <button className="hover:text-zinc-300 transition-all"><RotateCcw className="w-4 h-4" /></button>
                     <button className="hover:text-zinc-300 transition-all"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-2 p-4">
              <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
            </div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>
      </div>

      <div className="shrink-0 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-6 pb-8">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-0">
          <div className="relative bg-[#2f2f2f] rounded-[2rem] border border-white/5 shadow-2xl transition-all focus-within:border-white/10">
             <div className="flex items-end px-4 py-3 min-h-[56px] gap-2">
                <button className="p-2 mb-0.5 text-zinc-500 hover:text-white transition-colors shrink-0 rounded-xl hover:bg-white/5">
                  <Plus className="w-5 h-5" />
                </button>
                <textarea 
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask anything"
                  className="flex-grow bg-transparent border-none focus:ring-0 focus:outline-none text-base placeholder:text-zinc-500 py-2 no-scrollbar resize-none font-sans"
                />
                <div className="flex items-center gap-1.5 shrink-0 px-1 mb-0.5">
                   <button 
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      isRecording ? "text-rose-500 bg-rose-500/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                   >
                     <Mic className="w-5 h-5" />
                   </button>
                   <button 
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      loading || !input.trim() ? "bg-white/20 text-white/40 cursor-not-allowed" : "bg-white text-black hover:scale-105"
                    )}
                   >
                      <div className="rotate-90"><ChevronRight className="w-4 h-4 stroke-[3px]" /></div>
                   </button>
                </div>
             </div>
          </div>
          <p className="text-center text-[11px] text-zinc-600 mt-3 font-medium">
            ChatGPT can make mistakes. Check important info. See <span className="underline cursor-pointer hover:text-zinc-400">Cookie Preferences</span>.
          </p>
        </div>
      </div>
    </motion.div>
  );
};





const TryMeTab = ({ image, setImage, result, analyzing, onAnalyze }: any) => {
  const [videoOpen, setVideoOpen] = useState(false);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitSuggestion | null>(null);
  const [tryingOn, setTryingOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      onAnalyze(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const startCamera = async () => {
    try {
      setVideoOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied:", err);
      setVideoOpen(false);
      alert("Camera access was denied or is not available. Please check your browser permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg');
      setImage(data);
      setVideoOpen(false);
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      onAnalyze(data);
    }
  };

  const handleVirtualTryOn = async () => {
    if (!image || !result?.suggestedOutfits || result.suggestedOutfits.length === 0) return;
    setTryingOn(true);
    
    // Pick the next outfit to try on, or the first one if none selected
    const currentIndex = result.suggestedOutfits.findIndex(o => o.title === selectedOutfit?.title);
    const nextIndex = (currentIndex + 1) % result.suggestedOutfits.length;
    const outfit = result.suggestedOutfits[nextIndex];
    
    setSelectedOutfit(outfit);
    
    try {
      const generatedImage = await generateVirtualTryOn(image, outfit);
      setTryOnImage(generatedImage);
    } catch (e) {
      console.error("Virtual Try On failed:", e);
      // Fallback to previous behavior if generation fails (optional, but good for UX)
      setTryOnImage(image);
    } finally {
      setTryingOn(false);
    }
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="mb-12 relative overflow-hidden p-12 bg-white/5 rounded-[3rem] border border-white/10">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-7xl font-display italic font-bold mb-4 tracking-tighter">Virtual Studio</h1>
          <p className="text-zinc-400 text-xl font-medium max-w-2xl">Our AI engine analyzes your unique silhouette and skin tone to curate a bespoke luxury collection, draped precisely for you.</p>
        </div>
        <Sparkles className="absolute top-10 right-10 w-32 h-32 text-white/5 -rotate-12" />
      </header>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div 
            {...getRootProps()} 
            className="aspect-square rounded-[3rem] border-2 border-dashed border-zinc-700 bg-zinc-900 flex flex-col items-center justify-center p-8 hover:border-white transition-colors cursor-pointer group"
          >
            <input {...getInputProps()} />
            {image ? (
              <div className="relative w-full h-full">
                 <img 
                   src={tryOnImage || image} 
                   className={cn(
                     "w-full h-full object-cover rounded-[2.5rem] transition-all duration-1000 ease-in-out", 
                     tryingOn && "opacity-40 blur-xl grayscale"
                   )} 
                 />

                 {tryingOn && (
                   <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 rounded-[2.5rem] backdrop-blur-2xl overflow-hidden">
                      <div className="flex flex-col items-center gap-6 relative z-30">
                        <div className="w-20 h-20 border-4 border-white/10 border-t-white rounded-full animate-spin" />
                        <div className="flex flex-col items-center">
                          <p className="text-white font-black tracking-[0.5em] uppercase text-[12px] animate-pulse mb-1">Synthesizing</p>
                          <p className="text-white/40 font-bold uppercase text-[9px] tracking-widest">Silhouette & Texture</p>
                        </div>
                      </div>
                      <motion.div 
                        initial={{ top: '-10%' }}
                        animate={{ top: '110%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_30px_white] z-20"
                      />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent animate-pulse" />
                   </div>
                 )}

                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[2.5rem]">
                    <Upload className="w-12 h-12" />
                 </div>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                  <Upload className="w-10 h-10 text-zinc-500" />
                </div>
                <p className="text-xl font-medium mb-2">Drag and drop photo</p>
                <p className="text-zinc-500">or click to browse</p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={startCamera}
              className="flex-grow py-5 bg-white/10 text-white rounded-2xl font-medium flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] border border-white/10"
            >
              <Camera className="w-6 h-6" /> Open Camera
            </button>
            {image && result && (
              <button 
                onClick={handleVirtualTryOn}
                disabled={tryingOn}
                className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
              >
                <Sparkles className={cn("w-6 h-6 text-amber-500", tryingOn && "animate-spin")} />
                {tryingOn ? "Generating Your Look..." : "Virtual Try On"}
              </button>
            )}
          </div>

          <AnimatePresence>
            {selectedOutfit && tryOnImage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-8 bg-white text-black rounded-[2.5rem] shadow-2xl border border-white/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-widest leading-none">Luxe Style Analysis</span>
                  <div className="ml-auto bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-green-500/20">FIT MATCH: 98%</div>
                </div>
                <h3 className="text-2xl font-display italic font-bold mb-1">{selectedOutfit.title}</h3>
                <p className="text-zinc-600 mb-6">{selectedOutfit.brand} • {selectedOutfit.platform}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">{selectedOutfit.price}</span>
                  <a 
                    href={selectedOutfit.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-bold hover:scale-105 transition-transform"
                  >
                    Buy Now <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-8">
          {analyzing ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 border-4 border-white/10 border-t-white rounded-full animate-spin mb-6" />
              <h3 className="text-2xl font-medium mb-2">Analyzing your style...</h3>
              <p className="text-zinc-500">Detecting skin tone, gender, and optimal matches.</p>
            </div>
          ) : result ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex gap-4 mb-8">
                <div className="flex-grow p-6 bg-white/5 rounded-3xl border border-white/10">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-semibold">Detected Gender</p>
                  <p className="text-2xl font-display italic font-bold capitalize">{result.gender || 'Unknown'}</p>
                </div>
                <div className="flex-grow p-6 bg-white/5 rounded-3xl border border-white/10">
                   <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-semibold">Skin Tone</p>
                   <p className="text-2xl font-display italic font-bold capitalize">{result.skinTone || 'Unknown'}</p>
                </div>
              </div>

              <section className="mb-10">
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2"><Sparkles className="text-amber-400" /> Professional Makeup</h3>
                <div className="flex flex-wrap gap-3">
                  {result.suggestedMakeup?.map((m, i) => (
                    <a 
                      key={i} 
                      href={m.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="py-3 px-6 bg-white/5 rounded-full text-xs font-bold border border-white/10 hover:bg-white hover:text-black transition-all flex items-center gap-2 group shrink-0"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 group-hover:text-black" />
                      {m.name}
                    </a>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-semibold flex items-center gap-2"><ShoppingBag className="text-emerald-400" /> Curated Collection</h3>
                  <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2">
                    Swipe to browse <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
                
                <div 
                  ref={carouselRef}
                  className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar -mx-4 px-4 mask-fade-edges"
                >
                  {result.suggestedOutfits?.map((o, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5 }}
                      className={cn(
                        "flex-shrink-0 w-72 p-6 bg-white/5 rounded-[2.5rem] border border-white/10 transition-all snap-start relative group overflow-hidden",
                        selectedOutfit?.title === o.title && "border-white bg-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                      )}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{o.platform}</span>
                        </div>
                        <h4 className="font-bold text-xl mb-1 line-clamp-1">{o.title}</h4>
                        <p className="text-zinc-500 text-[10px] mb-6 font-medium tracking-wide uppercase">{o.brand}</p>
                        
                        <div className="flex flex-col gap-4 mt-auto">
                          <p className="text-lg font-black">{o.price}</p>
                          <a 
                            href={o.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 bg-white text-black rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                          >
                             Shop on {o.platform} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      
                      {selectedOutfit?.title === o.title && (
                        <motion.div 
                          layoutId="active-bg"
                          className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-zinc-500 border border-white/5 bg-white/5 rounded-[3rem]">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-medium mb-2">Discover your silhouette</h3>
              <p>Upload a photo and let our AI curate your look.</p>
            </div>
          )}
        </div>
      </div>

      {videoOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
           <video ref={videoRef} autoPlay playsInline className="w-full max-w-2xl aspect-video rounded-3xl object-cover bg-zinc-900 border border-white/10" />
           <div className="mt-8 flex gap-6">
              <button 
                onClick={() => { setVideoOpen(false); (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop()); }}
                className="w-16 h-16 bg-zinc-800 text-white rounded-full flex items-center justify-center transition-transform hover:bg-zinc-700"
              >
                <X className="w-8 h-8" />
              </button>
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl scale-110"
              >
                 <div className="w-10 h-10 border-2 border-zinc-950 rounded-full" />
              </button>
           </div>
        </div>
      )}
    </motion.div>
  );
};

const CompareTab = ({ image, setImage }: any) => {
  const [comparing, setComparing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleCompare = async (img: string) => {
    setComparing(true);
    setResults([]);
    try {
      const res = await comparePrices(img, "the item in the photo");
      setResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setComparing(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      handleCompare(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
       <header className="mb-12 relative overflow-hidden p-12 bg-white/5 rounded-[3rem] border border-white/10">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-7xl font-display italic font-bold mb-4 tracking-tighter">Market Scan</h1>
          <p className="text-zinc-400 text-xl font-medium max-w-2xl">Upload an image of any couture piece to find its match and the best possible price across all global platforms.</p>
        </div>
        <Search className="absolute top-10 right-10 w-32 h-32 text-white/5 -rotate-12" />
      </header>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div 
            {...getRootProps()}
            className="aspect-square rounded-[3rem] border-2 border-dashed border-zinc-700 bg-zinc-900 flex flex-col items-center justify-center p-8 hover:border-white transition-colors cursor-pointer group"
          >
            <input {...getInputProps()} />
            {image ? (
               <div className="relative w-full h-full">
                 <img src={image} className="w-full h-full object-cover rounded-[2.5rem]" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[2.5rem]">
                    <Upload className="w-12 h-12" />
                 </div>
               </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-zinc-500" />
                </div>
                <p className="text-xl font-medium mb-2">Upload Dress Image</p>
                <p className="text-zinc-500">to start global price comparison</p>
              </>
            )}
          </div>

          {image && !comparing && results.length === 0 && (
             <button 
               onClick={() => handleCompare(image)}
               className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-lg flex items-center justify-center gap-3"
             >
               <TrendingUp className="w-6 h-6" /> Re-scan Market
             </button>
          )}
        </div>

        <div className="space-y-6">
          {comparing ? (
             <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 border-4 border-white/10 border-t-white rounded-full animate-spin mb-8" />
              <h3 className="text-3xl font-display font-bold italic mb-2">Scanning Global Inventory...</h3>
              <p className="text-zinc-500 font-medium tracking-widest uppercase text-[10px]">Filtering through 50+ marketplaces</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-6">
              {results.map((r, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-8 rounded-[2.5rem] border flex items-center justify-between transition-all",
                    i === 0 ? "bg-white text-black border-white shadow-[0_20px_50px_rgba(255,255,255,0.1)] scale-105" : "bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/20"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-black text-3xl italic tracking-tighter uppercase">{r.platform}</span>
                      {i === 0 && (
                        <div className="bg-emerald-500 text-white text-[9px] py-1.5 px-4 rounded-full font-black uppercase tracking-[0.2em] shadow-lg">
                          Best Price
                        </div>
                      )}
                    </div>
                    <p className={cn("text-sm font-medium", i === 0 ? "text-zinc-600" : "text-zinc-500")}>Verified Authentic Link</p>
                  </div>
                  <div className="text-right">
                     <p className="text-3xl font-display font-black italic mb-4">{r.price}</p>
                     <a 
                       href={r.link} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className={cn(
                         "flex items-center gap-2 py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-transform hover:scale-105 active:scale-95",
                         i === 0 ? "bg-zinc-950 text-white shadow-xl" : "bg-white/10 text-white border border-white/10"
                       )}
                     >
                       Shop Now <ExternalLink className="w-4 h-4" />
                     </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-zinc-500 border border-white/5 bg-white/5 rounded-[3rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
              <div className="relative z-10">
                <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-12 h-12 opacity-50" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">No scans performed</h3>
                <p className="max-w-[200px] mx-auto text-sm leading-relaxed">Upload a photo to see real-time price comparisons across the web.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ProfileTab = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const qFav = query(collection(db, 'users', auth.currentUser.uid, 'favorites'));
    const unsubFav = onSnapshot(qFav, (snap) => setFavorites(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const qOrd = query(collection(db, 'users', auth.currentUser.uid, 'orders'));
    const unsubOrd = onSnapshot(qOrd, (snap) => setOrders(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubFav(); unsubOrd(); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
       <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-display italic font-bold mb-4">Profile</h1>
          <p className="text-zinc-500 text-lg">Handle your favorite picks and track your style journey.</p>
        </div>
        <div className="flex items-center gap-6 p-6 bg-white/5 rounded-[2.5rem] border border-white/10">
          <div className="w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center font-bold text-2xl uppercase italic">
             {auth.currentUser?.displayName?.[0] || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-xl">{auth.currentUser?.displayName}</h3>
            <p className="text-zinc-500">{auth.currentUser?.email}</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-12">
        <section>
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
             <Heart className="text-rose-500 fill-rose-500" /> Favorites
          </h2>
          {favorites.length > 0 ? (
            <div className="space-y-4">
               {favorites.map((f, i) => (
                 <div key={i} className="p-6 bg-zinc-900 rounded-3xl border border-white/5 flex items-center gap-6 group">
                   <div className="w-24 h-24 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0">
                      {f.imageUrl && <img src={f.imageUrl} className="w-full h-full object-cover" />}
                   </div>
                   <div className="flex-grow">
                      <h4 className="font-semibold text-lg">{f.title}</h4>
                      <p className="text-zinc-500 text-sm">{f.brand} • {f.price}</p>
                   </div>
                   <a href={f.link} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 text-white rounded-2xl group-hover:bg-white group-hover:text-black transition-all">
                      <ExternalLink className="w-5 h-5" />
                   </a>
                 </div>
               ))}
            </div>
          ) : (
            <p className="p-12 text-center text-zinc-500 border border-dashed border-white/10 rounded-3xl italic">No favorites yet. Start exploring styles!</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
             <Package className="text-zinc-400" /> Active Orders
          </h2>
           {orders.length > 0 ? (
            <div className="space-y-4">
               {orders.map((o, i) => (
                 <div key={i} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 py-2 px-6 bg-amber-400 text-black text-xs font-black uppercase tracking-widest rounded-bl-3xl">
                      {o.status}
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Order #{o.orderNumber}</p>
                    <h4 className="text-xl font-bold mb-4">{o.itemTitle}</h4>
                    <div className="flex justify-between items-end">
                       <span className="text-sm text-zinc-400 flex items-center gap-2"><Globe className="w-4 h-4" /> {o.platform}</span>
                       <span className="text-sm font-semibold italic">Arriving {o.deliveryDate}</span>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <p className="p-12 text-center text-zinc-500 border border-dashed border-white/10 rounded-3xl italic">No active orders found.</p>
          )}
        </section>
      </div>
    </motion.div>
  );
};

const ChatBot = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Hello! I am your personal AI Stylist. How can I help you elevate your wardrobe today?' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const res = await chatWithAi(textToSend, messages);
      setMessages(prev => [...prev, { role: 'ai', text: res }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = async () => {
        setIsRecording(false);
        handleSend("Suggest some trendy summer styles.");
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      alert("Microphone access was denied. Please enable it to use voice features.");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-32 right-6 md:right-10 w-[min(calc(100vw-3rem),480px)] h-[650px] bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] flex flex-col z-50 overflow-hidden backdrop-blur-3xl"
        >
           {/* Minimal Header */}
           <header className="p-3.5 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded-lg transition-colors">
                 <span className="font-bold text-white tracking-tight">ChatGPT</span>
                 <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <button 
                onClick={onClose} 
                className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                 <X className="w-4 h-4" />
              </button>
           </header>

           {/* Chat Area */}
           <div className="flex-grow overflow-y-auto p-4 space-y-10 no-scrollbar scroll-smooth">
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={cn(
                    "flex w-full group",
                    m.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                   <div className={cn(
                     "flex flex-col gap-2 max-w-[85%]",
                     m.role === 'user' ? "items-end" : "items-start"
                   )}>
                     <div className={cn(
                       "px-4 py-2 rounded-2xl",
                       m.role === 'user' ? "bg-zinc-800 text-white" : "text-zinc-100 text-sm leading-relaxed"
                     )}>
                        <div className="markdown-body">
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="font-bold underline" />
                            }}
                          >
                            {m.text}
                          </ReactMarkdown>
                        </div>
                     </div>
                     {m.role === 'ai' && (
                        <div className="flex items-center gap-3 text-zinc-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="hover:text-zinc-300 transition-all"><Copy className="w-3 h-3" /></button>
                           <button className="hover:text-zinc-300 transition-all"><ThumbsUp className="w-3 h-3" /></button>
                           <button className="hover:text-zinc-300 transition-all"><ThumbsDown className="w-3 h-3" /></button>
                           <button className="hover:text-zinc-300 transition-all"><RotateCcw className="w-3 h-3" /></button>
                        </div>
                     )}
                   </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-1 py-2">
                   <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" />
                </div>
              )}
              <div ref={chatEndRef} />
           </div>

           {/* Minimal Input */}
           <div className="p-4 bg-zinc-950/80 border-t border-white/5 backdrop-blur-3xl shrink-0">
              <div className="relative bg-[#2f2f2f] rounded-[1.5rem] border border-white/5">
                 <div className="flex items-end px-3 py-2 gap-2">
                    <button className="p-1.5 text-zinc-500 hover:text-white transition-colors shrink-0 mb-0.5">
                       <Plus className="w-4 h-4" />
                    </button>
                    <textarea 
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask anything"
                      className="flex-grow bg-transparent border-none focus:ring-0 focus:outline-none text-sm placeholder:text-zinc-500 py-1.5 no-scrollbar resize-none"
                    />
                    <div className="flex items-center gap-1 shrink-0 mb-0.5">
                       <button 
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        className={cn("p-1.5 rounded-lg transition-colors", isRecording ? "text-rose-500" : "text-zinc-400 hover:text-white")}
                       >
                         <Mic className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className={cn("w-7 h-7 rounded-full flex items-center justify-center transition-all", loading || !input.trim() ? "bg-white/20 text-white/40" : "bg-white text-black")}
                       >
                          <div className="rotate-90"><ChevronRight className="w-3.5 h-3.5 stroke-[3px]" /></div>
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

