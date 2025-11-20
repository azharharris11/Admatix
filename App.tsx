import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutGrid, 
  Network, 
  Sliders, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Dice5,
  Download,
  Lock,
  ChevronRight,
  Plus,
  Target,
  Layers,
  Type,
  Image as ImageIcon,
  FileText,
  Brain,
  Settings,
  Upload
} from 'lucide-react';
import { 
  Phase, 
  NodeType, 
  StrategyNode, 
  AdFramework, 
  AdVariant, 
  ProjectState 
} from './types';
import { generatePersonas, rewriteCopy, generateAdConcepts, generateAwarenessLevels, generateHooks, generateAdImage } from './services/geminiService';

// --- Constants & Mock Data ---
const MOCK_PRODUCT_IMG = "https://picsum.photos/id/225/400/600"; 
const MOCK_PRODUCT_NAME = "New Project";

const FRAMEWORKS = [
  AdFramework.UGLY_VISUAL,
  AdFramework.BIG_FONT,
  AdFramework.NOTES_APP,
  AdFramework.GMAIL_UX,
  AdFramework.BILLBOARD
];

// --- Helper Components ---

const Button: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}> = ({ onClick, children, variant = 'primary', className = '', disabled = false, icon }) => {
  const baseStyle = "px-4 py-2 rounded-sm font-mono text-sm flex items-center gap-2 transition-all uppercase tracking-wider font-semibold";
  const variants = {
    primary: "bg-[#00FF94] text-black hover:bg-[#00cc76] shadow-[0_0_10px_rgba(0,255,148,0.3)] disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-[#2D9CDB] text-white hover:bg-[#2280b6] disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "border border-[#333] text-gray-300 hover:border-[#00FF94] hover:text-[#00FF94] bg-transparent disabled:opacity-50",
    danger: "bg-red-900/30 text-red-500 border border-red-900 hover:bg-red-900/50",
    ghost: "bg-transparent text-gray-400 hover:text-white disabled:opacity-50"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    'UNIQUE': 'text-[#00FF94] bg-[#00FF94]/10 border-[#00FF94]/30',
    'RISK': 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    'EMPTY': 'text-gray-500 bg-gray-800 border-gray-700'
  };
  const c = colors[status] || colors['EMPTY'];
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${c}`}>
      {status}
    </span>
  );
};

const SetupModal: React.FC<{ onSave: (name: string, img: string) => void }> = ({ onSave }) => {
    const [name, setName] = useState('');
    const [imgUrl, setImgUrl] = useState(MOCK_PRODUCT_IMG);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImgUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-gray-700 p-8 rounded-lg w-[500px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2D9CDB] to-[#00FF94]"></div>
                
                <h2 className="text-2xl font-bold font-mono text-white mb-1">INITIALIZE MISSION</h2>
                <p className="text-gray-500 text-sm mb-6">Configure your tactical target.</p>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs text-[#00FF94] font-bold mb-2 uppercase tracking-wider">Product Name / Code</label>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black border border-gray-700 p-3 rounded text-white focus:border-[#00FF94] outline-none font-mono"
                            placeholder="e.g., Bio-Retinol Serum X"
                        />
                    </div>

                    <div>
                         <label className="block text-xs text-[#00FF94] font-bold mb-2 uppercase tracking-wider">Target Asset (Product Image)</label>
                         <div className="flex items-center gap-4">
                             <div className="w-20 h-20 bg-black border border-gray-700 rounded overflow-hidden flex items-center justify-center">
                                 <img src={imgUrl} alt="Preview" className="w-full h-full object-contain" />
                             </div>
                             <div className="flex-1">
                                 <input 
                                     type="file" 
                                     ref={fileInputRef}
                                     className="hidden"
                                     accept="image/*"
                                     onChange={handleFileChange}
                                 />
                                 <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full justify-center text-xs">
                                     <Upload size={14} /> UPLOAD IMAGE
                                 </Button>
                                 <p className="text-[10px] text-gray-500 mt-2">Recommended: Transparent PNG or solid background.</p>
                             </div>
                         </div>
                    </div>

                    <Button 
                        disabled={!name} 
                        onClick={() => onSave(name, imgUrl)} 
                        className="w-full justify-center py-4 mt-4"
                    >
                        INITIATE ENGINE
                    </Button>
                </div>
            </div>
        </div>
    )
}

// --- Main App Component ---

export default function App() {
  // --- State ---
  const [phase, setPhase] = useState<Phase>(Phase.STRATEGY);
  const [showSetup, setShowSetup] = useState(true);
  
  const [project, setProject] = useState<ProjectState>({
    productName: MOCK_PRODUCT_NAME,
    productImage: MOCK_PRODUCT_IMG,
    nodes: [], // Start empty
    variants: [],
    activeVariantId: null
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleSetupSave = (name: string, img: string) => {
      setProject(prev => ({
          ...prev,
          productName: name,
          productImage: img,
          nodes: [{ id: 'root', type: NodeType.ROOT, label: name, x: 400, y: 300 }]
      }));
      setShowSetup(false);
  }

  // --- Strategy Logic (Deep Tree) ---
  
  const handleNodeClick = async (node: StrategyNode) => {
    if (isGenerating) return;
    
    // Check if children already exist to prevent duplicates
    const hasChildren = project.nodes.some(n => n.parentId === node.id);
    if (hasChildren) return;

    // 1. ROOT -> PERSONA
    if (node.type === NodeType.ROOT) {
        setIsGenerating(true);
        try {
          const personas = await generatePersonas(project.productName);
          const newNodes: StrategyNode[] = [...project.nodes];
          personas.forEach((p, i) => {
            const angle = (i / personas.length) * 2 * Math.PI;
            const radius = 250;
            newNodes.push({
              id: `persona-${i}-${Date.now()}`,
              type: NodeType.PERSONA,
              label: p.name,
              parentId: node.id,
              x: (node.x || 400) + Math.cos(angle) * radius,
              y: (node.y || 300) + Math.sin(angle) * radius,
              data: { hook: p.hook }
            });
          });
          setProject(prev => ({ ...prev, nodes: newNodes }));
        } finally {
          setIsGenerating(false);
        }
    }
    // 2. PERSONA -> AWARENESS
    else if (node.type === NodeType.PERSONA) {
        setIsGenerating(true);
        try {
            const levels = await generateAwarenessLevels(node.label, project.productName);
            const newNodes = [...project.nodes];
            levels.forEach((lvl, i) => {
                const offsetX = 200; 
                const offsetY = (i - 0.5) * 150; 
                newNodes.push({
                    id: `${node.id}-aw-${i}`,
                    type: NodeType.AWARENESS,
                    label: lvl.level,
                    parentId: node.id,
                    x: (node.x || 0) + offsetX,
                    y: (node.y || 0) + offsetY,
                    data: { description: lvl.description }
                });
            });
            setProject(p => ({ ...p, nodes: newNodes }));
        } finally {
            setIsGenerating(false);
        }
    }
    // 3. AWARENESS -> HOOK
    else if (node.type === NodeType.AWARENESS) {
        setIsGenerating(true);
        try {
            const parentPersona = project.nodes.find(n => n.id === node.parentId);
            const hooks = await generateHooks(parentPersona?.label || "", node.label, project.productName);
            const newNodes = [...project.nodes];
            hooks.forEach((hook, i) => {
                const offsetX = 200;
                const offsetY = (i - 1) * 100;
                newNodes.push({
                    id: `${node.id}-hook-${i}`,
                    type: NodeType.HOOK,
                    label: hook,
                    parentId: node.id,
                    x: (node.x || 0) + offsetX,
                    y: (node.y || 0) + offsetY
                });
            });
            setProject(p => ({ ...p, nodes: newNodes }));
        } finally {
            setIsGenerating(false);
        }
    }
  };

  // --- Matrix Logic ---
  const initializeMatrix = () => {
    // Use Hook nodes if available, otherwise fallback to Persona nodes (for lazy users)
    const hookNodes = project.nodes.filter(n => n.type === NodeType.HOOK);
    const targetNodes = hookNodes.length > 0 ? hookNodes : project.nodes.filter(n => n.type === NodeType.PERSONA);

    const newVariants: AdVariant[] = [];

    targetNodes.forEach(node => {
      FRAMEWORKS.forEach(fw => {
        const exists = project.variants.find(v => v.personaId === node.id && v.framework === fw);
        if (!exists) {
          newVariants.push({
            id: `${node.id}-${fw.replace(/\s/g, '')}`,
            personaId: node.id, // Stores the Source Node ID (can be Hook or Persona)
            framework: fw,
            status: 'EMPTY',
            headline: '',
            bodyText: '',
            cta: 'Learn More',
            formula: { keyword: '', emotion: '', qualifier: '', outcome: '' },
            entityIdScore: 0,
            isRawMode: true,
            style: 'Professional'
          });
        }
      });
    });

    setProject(prev => ({ 
      ...prev, 
      variants: [...prev.variants, ...newVariants] 
    }));
    setPhase(Phase.MATRIX);
  };

  const generateAd = async (variantId: string) => {
    const variant = project.variants.find(v => v.id === variantId);
    if (!variant) return;
    
    // TRAVERSE UP TREE to get full context
    const node = project.nodes.find(n => n.id === variant.personaId);
    let personaName = "General";
    let awareness = undefined;
    let hook = undefined;

    if (node) {
        if (node.type === NodeType.HOOK) {
            hook = node.label;
            const awarenessNode = project.nodes.find(n => n.id === node.parentId);
            if (awarenessNode) {
                awareness = awarenessNode.label;
                const personaNode = project.nodes.find(n => n.id === awarenessNode.parentId);
                if (personaNode) personaName = personaNode.label;
            }
        } else if (node.type === NodeType.PERSONA) {
            personaName = node.label;
        }
    }

    // Update status to generating
    setProject(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === variantId ? { ...v, status: 'GENERATING' } : v)
    }));

    try {
      // 1. Generate Text & Concept
      const concept = await generateAdConcepts(variant.framework, personaName, project.productName, hook, awareness);
      
      // 2. Generate Visual (Image) using Gemini 2.5 Flash Image
      // Only generate image if framework needs it (not pure text ones like Gmail/BigFont, though BigFont can use textures)
      let generatedImageUrl = undefined;
      if (variant.framework === AdFramework.UGLY_VISUAL || variant.framework === AdFramework.STANDARD || variant.framework === AdFramework.BILLBOARD) {
         generatedImageUrl = await generateAdImage(concept.visualPrompt);
      }

      setProject(prev => ({
        ...prev,
        variants: prev.variants.map(v => v.id === variantId ? {
          ...v,
          status: 'DONE',
          thumbnailUrl: generatedImageUrl || prev.variants.find(pv => pv.id === variantId)?.thumbnailUrl, // Fallback
          headline: concept.headline,
          bodyText: concept.bodyText,
          formula: concept.formula,
          cta: concept.cta,
          entityIdScore: Math.floor(Math.random() * 20) + 80 
        } : v)
      }));
    } catch (error) {
        console.error("Generation failed", error);
        setProject(prev => ({
            ...prev,
            variants: prev.variants.map(v => v.id === variantId ? { ...v, status: 'EMPTY' } : v)
        }));
    }
  };

  const generateAllColumn = async (framework: AdFramework) => {
     const variantsToGen = project.variants.filter(v => v.framework === framework && v.status === 'EMPTY');
     for (const v of variantsToGen) {
         await generateAd(v.id);
     }
  };

  // --- Editor Logic ---
  const updateActiveVariant = (updates: Partial<AdVariant>) => {
    if (!project.activeVariantId) return;
    setProject(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === prev.activeVariantId ? { ...v, ...updates } : v)
    }));
  };

  const updateFormula = (updates: Partial<AdVariant['formula']>) => {
    if (!project.activeVariantId) return;
    const active = project.variants.find(v => v.id === project.activeVariantId);
    if (!active) return;

    setProject(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === prev.activeVariantId ? { 
          ...v, 
          formula: { ...active.formula, ...updates } 
      } : v)
    }));
  }

  const handleAiRewrite = async () => {
    const active = project.variants.find(v => v.id === project.activeVariantId);
    if (!active) return;

    setIsGenerating(true);
    const newHeadline = await rewriteCopy(active.headline, active.style);
    updateActiveVariant({ headline: newHeadline });
    setIsGenerating(false);
  };
  
  const handleRegenerateImageOnly = async () => {
      const active = project.variants.find(v => v.id === project.activeVariantId);
      if (!active) return;
      
      setIsGenerating(true);
      
      // Re-use context logic if possible, or just generate a generic messy background
      const prompt = active.framework === AdFramework.UGLY_VISUAL 
        ? "A messy, cluttered authentic background, amateur photography, poor lighting" 
        : "A professional product background studio lighting";
        
      const newImg = await generateAdImage(prompt);
      if (newImg) {
          updateActiveVariant({ thumbnailUrl: newImg });
      }
      setIsGenerating(false);
  };

  // --- Renderers ---

  const renderStrategyCanvas = () => {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#151515] bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <Target size={600} className="text-[#2D9CDB]" />
        </div>

        {/* Render Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {project.nodes.map(node => {
            if (!node.parentId) return null;
            const parent = project.nodes.find(n => n.id === node.parentId);
            if (!parent) return null;
            return (
              <line 
                key={`line-${node.id}`}
                x1={parent.x} y1={parent.y}
                x2={node.x} y2={node.y}
                stroke="#333"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {/* Render Nodes */}
        {project.nodes.map(node => {
             const hasChildren = project.nodes.some(n => n.parentId === node.id);
             return (
              <div 
                key={node.id}
                onClick={() => handleNodeClick(node)}
                style={{ 
                  left: node.x, 
                  top: node.y,
                  transform: 'translate(-50%, -50%)' 
                }}
                className={`absolute p-4 rounded-lg border shadow-xl flex flex-col items-center gap-2 transition-all cursor-pointer hover:scale-105
                  ${node.type === NodeType.ROOT 
                    ? 'bg-[#1a1a1a] border-[#00FF94] z-40 w-48' 
                    : node.type === NodeType.PERSONA 
                      ? 'bg-[#1E1E1E] border-gray-700 hover:border-[#2D9CDB] z-30 w-48'
                      : node.type === NodeType.AWARENESS
                        ? 'bg-blue-950/80 border-blue-500/50 hover:border-blue-400 z-20 w-40 backdrop-blur-sm'
                        : 'bg-purple-950/80 border-purple-500/50 hover:border-purple-400 z-10 w-40 backdrop-blur-sm' // HOOK
                  }
                `}
              >
                {node.type === NodeType.ROOT && (
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border border-gray-600 bg-black">
                        <img src={project.productImage} alt="Product" className="w-full h-full object-contain" />
                    </div>
                )}
                <span className={`font-mono text-[10px] font-bold uppercase opacity-70 ${
                    node.type === NodeType.ROOT ? 'text-[#00FF94]' : 
                    node.type === NodeType.AWARENESS ? 'text-blue-300' :
                    node.type === NodeType.HOOK ? 'text-purple-300' : 'text-gray-400'
                }`}>
                  {node.type}
                </span>
                <span className="text-center font-semibold text-sm text-gray-200">{node.label}</span>
                
                {node.type === NodeType.ROOT && project.nodes.length === 1 && (
                  <div className="mt-2 text-[10px] text-[#00FF94] animate-pulse flex items-center gap-1">
                    <Zap size={10} /> CLICK TO START
                  </div>
                )}

                {/* Expansion Indicator */}
                {!hasChildren && node.type !== NodeType.HOOK && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-[#1a1a1a] rounded-full p-1 border border-gray-700 hover:bg-[#00FF94] hover:text-black transition-colors">
                        <Plus size={10} />
                    </div>
                )}
              </div>
            );
        })}

        {project.nodes.length > 1 && (
          <div className="absolute top-4 right-4">
             <Button onClick={initializeMatrix} variant="primary" className="shadow-lg shadow-[#00FF94]/20">
               PUSH TO MATRIX <ChevronRight size={16}/>
             </Button>
          </div>
        )}
      </div>
    );
  };

  const renderMatrix = () => {
    // Group variants by their source node (which are the "Rows")
    const uniqueRowIds = Array.from(new Set(project.variants.map(v => v.personaId)));
    
    return (
      <div className="w-full h-full overflow-auto bg-[#121212] p-8">
        <div className="min-w-[1000px]">
          {/* Header Row */}
          <div className="grid grid-cols-[250px_repeat(5,1fr)] gap-4 mb-4">
            <div className="font-mono text-gray-500 text-xs uppercase tracking-widest self-end pb-2">STRATEGY HOOKS</div>
            {FRAMEWORKS.map(fw => (
              <div key={fw} className="bg-[#1a1a1a] p-3 rounded border border-gray-800 flex flex-col gap-2 group hover:border-[#2D9CDB] transition-colors">
                <span className="font-mono text-xs text-[#2D9CDB] truncate" title={fw}>{fw}</span>
                <button 
                    onClick={() => generateAllColumn(fw)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-2 rounded transition-all flex items-center gap-1 justify-center"
                >
                    <Zap size={10} /> Gen All
                </button>
              </div>
            ))}
          </div>

          {/* Body Rows */}
          {uniqueRowIds.map(rowId => {
            const rowNode = project.nodes.find(n => n.id === rowId);
            if (!rowNode) return null;

            // Get parent context for display
            const parentNode = project.nodes.find(n => n.id === rowNode.parentId);

            return (
            <div key={rowId} className="grid grid-cols-[250px_repeat(5,1fr)] gap-4 mb-4 items-center">
              {/* Row Header Card */}
              <div className="bg-[#1a1a1a] p-4 rounded h-[140px] flex flex-col justify-center border-l-2 border-gray-700 relative overflow-hidden">
                {rowNode.type === NodeType.HOOK && (
                    <div className="absolute top-0 right-0 bg-purple-900 text-purple-200 text-[9px] px-1.5 py-0.5">HOOK</div>
                )}
                <span className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">{parentNode?.label || "Strategy"}</span>
                <span className="font-bold text-sm text-gray-200 leading-tight">{rowNode.label}</span>
              </div>

              {FRAMEWORKS.map(fw => {
                const variant = project.variants.find(v => v.personaId === rowId && v.framework === fw);
                if (!variant) return <div key={fw}></div>;

                const isGenerating = variant.status === 'GENERATING';
                const isEmpty = variant.status === 'EMPTY';

                return (
                  <div 
                    key={variant.id}
                    onClick={() => {
                        if (isEmpty) generateAd(variant.id);
                        else {
                            setProject(p => ({ ...p, activeVariantId: variant.id }));
                            setPhase(Phase.EDITOR);
                        }
                    }}
                    className={`
                      relative h-[140px] rounded border cursor-pointer transition-all group overflow-hidden
                      ${isEmpty ? 'bg-[#151515] border-dashed border-gray-800 hover:border-[#00FF94]/50 hover:bg-[#1a1a1a]' : 'bg-black border-gray-800 hover:border-[#00FF94]'}
                    `}
                  >
                    {isEmpty && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 group-hover:text-[#00FF94]">
                        <Plus size={24} />
                        <span className="text-[10px] mt-2 font-mono">GENERATE</span>
                      </div>
                    )}
                    
                    {isGenerating && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                         <RefreshCw className="animate-spin text-[#00FF94]" />
                       </div>
                    )}

                    {variant.thumbnailUrl && !isEmpty && (
                      <>
                        {/* Ugly Format Preview Logic for Matrix Thumbnail */}
                        {fw === AdFramework.NOTES_APP ? (
                             <div className="w-full h-full bg-[#FEF3C7] text-black p-2 font-handwriting text-[10px] overflow-hidden">
                                {variant.headline}
                             </div>
                        ) : fw === AdFramework.BIG_FONT ? (
                             <div className="w-full h-full bg-white text-black p-1 font-impact uppercase text-xs leading-none flex items-center text-center">
                                {variant.headline}
                             </div>
                        ) : (
                             <img 
                                src={variant.thumbnailUrl} 
                                alt="Ad" 
                                className={`w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity ${variant.isRawMode ? 'brightness-75 contrast-125 sepia-[.2]' : ''}`} 
                             />
                        )}
                        
                        <div className="absolute top-1 right-1">
                            <StatusBadge status={variant.entityIdScore > 90 ? 'RISK' : 'UNIQUE'} />
                        </div>
                        {fw !== AdFramework.BIG_FONT && fw !== AdFramework.NOTES_APP && (
                             <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-2">
                                <p className="text-[10px] text-white truncate font-mono">{variant.headline}</p>
                            </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )})}
        </div>
      </div>
    );
  };

  const renderPreview = (active: AdVariant) => {
      const isMessy = active.framework === AdFramework.UGLY_VISUAL || active.framework === AdFramework.STANDARD;
      const isNotes = active.framework === AdFramework.NOTES_APP;
      const isBigFont = active.framework === AdFramework.BIG_FONT;
      const isGmail = active.framework === AdFramework.GMAIL_UX;
      const isBillboard = active.framework === AdFramework.BILLBOARD;

      return (
        <div className="aspect-square w-full bg-black rounded-lg border border-gray-700 relative overflow-hidden group select-none shadow-2xl">
            
            {/* --- NOTES APP RENDERING --- */}
            {isNotes && (
                <div className="absolute inset-0 bg-[#FAF9F6] flex flex-col p-4">
                    <div className="text-xs text-orange-400 font-bold mb-4 flex items-center gap-1"><ChevronRight size={10}/> Notes</div>
                    <h2 className="font-handwriting text-black text-2xl leading-tight mb-2">{active.headline}</h2>
                    <p className="font-handwriting text-gray-700 text-lg leading-snug">{active.bodyText}</p>
                    <div className="mt-auto border-t border-gray-200 pt-2">
                        <p className="text-[10px] text-gray-400 font-sans">{active.formula.outcome}</p>
                    </div>
                </div>
            )}

            {/* --- BIG FONT RENDERING --- */}
            {isBigFont && (
                <div className="absolute inset-0 bg-white flex flex-col justify-center items-center p-2 text-center">
                    <h1 className="font-impact text-black text-5xl uppercase leading-[0.9] tracking-tighter break-words w-full">{active.headline}</h1>
                    <div className="mt-4 bg-red-600 text-white font-sans font-bold px-2 py-1 text-xs uppercase">
                        {active.cta}
                    </div>
                </div>
            )}

            {/* --- GMAIL UX RENDERING --- */}
            {isGmail && (
                <div className="absolute inset-0 bg-white flex flex-col font-sans">
                     <div className="bg-gray-100 p-2 border-b flex items-center gap-2">
                         <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                         <span className="text-[10px] text-gray-500 font-bold">Gmail</span>
                     </div>
                     <div className="p-3 border-b border-gray-100">
                         <div className="flex justify-between items-baseline">
                             <span className="font-bold text-sm text-black">Team {project.productName}</span>
                             <span className="text-[9px] text-gray-400">10:42 AM</span>
                         </div>
                         <div className="font-bold text-sm text-black mt-0.5">{active.headline}</div>
                         <div className="text-gray-500 text-xs mt-1 line-clamp-2">{active.bodyText}</div>
                     </div>
                     {active.thumbnailUrl && (
                         <div className="m-3 border rounded p-2 bg-gray-50">
                             <div className="flex gap-2 items-center">
                                 <div className="w-8 h-8 bg-gray-300 rounded flex-shrink-0 overflow-hidden">
                                     <img src={active.thumbnailUrl} className="w-full h-full object-cover" alt="att" />
                                 </div>
                                 <div className="text-[10px] text-gray-600 truncate">Proof.pdf</div>
                             </div>
                         </div>
                     )}
                </div>
            )}

            {/* --- BILLBOARD RENDERING --- */}
            {isBillboard && (
                <div className="absolute inset-0 bg-black flex flex-col justify-center items-center p-4 text-center border-4 border-gray-800">
                     {/* Background Image for Billboard */}
                     {active.thumbnailUrl && (
                         <div className="absolute inset-0 opacity-50">
                             <img src={active.thumbnailUrl} className="w-full h-full object-cover" />
                         </div>
                     )}
                     <div className="z-10 text-center">
                        <p className="font-typewriter text-[#00FF94] text-sm mb-2 drop-shadow-md">>> ATTENTION {active.formula.qualifier.toUpperCase()}</p>
                        <h2 className="font-sans font-black text-white text-3xl uppercase italic tracking-tighter drop-shadow-lg">{active.headline}</h2>
                        <p className="text-white/90 text-xs mt-2 drop-shadow-md">{active.bodyText}</p>
                     </div>
                </div>
            )}

            {/* --- UGLY VISUAL / STANDARD COMPOSITE RENDERING --- */}
            {isMessy && (
                <>
                    {/* LAYER 1: VISUAL (Composite) */}
                    <div className={`absolute inset-0 w-full h-full transition-all duration-300 ${active.isRawMode ? 'brightness-[0.85] contrast-[1.1] sepia-[0.15] blur-[0.4px]' : ''}`}>
                        {active.thumbnailUrl && <img src={active.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover" alt="bg" />}
                        <div className="absolute bottom-4 right-4 w-1/3 h-1/3">
                            <img 
                                src={project.productImage} 
                                className="w-full h-full object-contain" 
                                style={{filter: active.isRawMode ? 'none' : 'drop-shadow(0 10px 10px rgba(0,0,0,0.5))'}} 
                                alt="product"
                            />
                        </div>
                    </div>

                    {/* LAYER 2: MESSAGE (Overlay) */}
                    <div className="absolute top-6 left-6 right-6 pointer-events-none">
                        <h2 className={`text-white text-2xl leading-tight font-bold drop-shadow-md font-sans bg-black/50 inline px-1`}>{active.headline}</h2>
                    </div>
                    <div className="absolute bottom-6 left-6 pointer-events-none">
                        <button className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-lg">
                            {active.cta}
                        </button>
                    </div>
                </>
            )}

        </div>
      );
  }

  const renderEditor = () => {
    const active = project.variants.find(v => v.id === project.activeVariantId);
    if (!active) return null;

    return (
      <div className="absolute right-0 top-[60px] bottom-0 w-[450px] bg-[#1a1a1a] border-l border-gray-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        {/* Editor Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#151515]">
            <div>
                <h3 className="font-bold text-[#00FF94] font-mono text-sm truncate w-48">{active.id}</h3>
                <span className="text-xs text-gray-500">{active.framework}</span>
            </div>
            <Button onClick={() => setPhase(Phase.MATRIX)} variant="ghost">Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* --- PREVIEW AREA --- */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase text-gray-500 font-bold tracking-wider flex items-center gap-2">
                      <Layers size={12}/> Live Preview
                  </label>
                  {active.entityIdScore > 90 && (
                      <span className="text-amber-500 text-[10px] font-mono flex items-center gap-1">
                        <AlertTriangle size={10} /> HIGH RISK
                      </span>
                  )}
                </div>
                
                {renderPreview(active)}
            </div>

            {/* --- STRATEGY FORMULA EDITOR --- */}
            <div className="space-y-4 border-t border-gray-800 pt-4">
                 <div className="flex items-center gap-2 text-[#2D9CDB]">
                      <Brain size={14} />
                      <span className="text-xs font-bold font-mono">STRATEGY FORMULA</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Keyword</label>
                            <input 
                                className="w-full bg-[#111] border border-gray-700 rounded p-2 text-xs text-gray-200 focus:border-[#2D9CDB] outline-none font-mono"
                                value={active.formula.keyword}
                                onChange={(e) => updateFormula({ keyword: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Emotion</label>
                            <input 
                                className="w-full bg-[#111] border border-gray-700 rounded p-2 text-xs text-gray-200 focus:border-[#2D9CDB] outline-none font-mono"
                                value={active.formula.emotion}
                                onChange={(e) => updateFormula({ emotion: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Qualifier</label>
                            <input 
                                className="w-full bg-[#111] border border-gray-700 rounded p-2 text-xs text-gray-200 focus:border-[#2D9CDB] outline-none font-mono"
                                value={active.formula.qualifier}
                                onChange={(e) => updateFormula({ qualifier: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Outcome</label>
                            <input 
                                className="w-full bg-[#111] border border-gray-700 rounded p-2 text-xs text-gray-200 focus:border-[#2D9CDB] outline-none font-mono"
                                value={active.formula.outcome}
                                onChange={(e) => updateFormula({ outcome: e.target.value })}
                            />
                        </div>
                   </div>
            </div>

            {/* --- CONTROLS: LAYER 1 (VISUAL) --- */}
            <div className="space-y-4 border-t border-gray-800 pt-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[#2D9CDB]">
                      <ImageIcon size={14} />
                      <span className="text-xs font-bold font-mono">LAYER 1: VISUAL</span>
                   </div>
                   <Button onClick={handleRegenerateImageOnly} variant="ghost" className="h-6 text-[10px] px-2" disabled={isGenerating}>
                      <RefreshCw size={10} className={`mr-1 ${isGenerating ? 'animate-spin' : ''}`}/> REGENERATE
                   </Button>
                </div>

                <div className="bg-[#222] p-3 rounded border border-gray-700 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-200 font-medium">Raw Mode (Ugly Filter)</span>
                        <span className="text-[10px] text-gray-500">Amateur/Organic Grain & Blur</span>
                    </div>
                    <button 
                        onClick={() => updateActiveVariant({ isRawMode: !active.isRawMode })}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors ${active.isRawMode ? 'bg-[#00FF94]' : 'bg-gray-600'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${active.isRawMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                </div>
            </div>

            {/* --- CONTROLS: LAYER 2 (MESSAGE) --- */}
            <div className="space-y-4 border-t border-gray-800 pt-4 pb-12">
                <div className="flex items-center gap-2 text-gray-300">
                   <Type size={14} />
                   <span className="text-xs font-bold font-mono">LAYER 2: MESSAGE</span>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Headline (The Hook)</span>
                        <button 
                            onClick={handleAiRewrite}
                            disabled={isGenerating} 
                            className="text-[#2D9CDB] hover:text-white flex items-center gap-1 text-[10px]"
                        >
                            <Dice5 size={10}/> REWRITE
                        </button>
                    </div>
                    <textarea 
                        className="w-full bg-[#111] border border-gray-700 rounded p-3 text-sm text-gray-200 focus:border-[#00FF94] outline-none font-sans"
                        rows={2}
                        value={active.headline}
                        onChange={(e) => updateActiveVariant({ headline: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <span className="text-xs text-gray-400">Long Body Text (Slippery Slope)</span>
                    <textarea 
                        className="w-full bg-[#111] border border-gray-700 rounded p-3 text-xs text-gray-200 focus:border-[#00FF94] outline-none font-sans"
                        rows={4}
                        value={active.bodyText}
                        onChange={(e) => updateActiveVariant({ bodyText: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <span className="text-xs text-gray-400">Button Label</span>
                    <input 
                        type="text" 
                        className="w-full bg-[#111] border border-gray-700 rounded p-2 text-sm text-gray-200 focus:border-[#00FF94] outline-none"
                        value={active.cta}
                        onChange={(e) => updateActiveVariant({ cta: e.target.value })}
                    />
                </div>
            </div>

            <div className="sticky bottom-0 bg-[#1a1a1a] py-4 border-t border-gray-800">
                <Button variant="primary" className="w-full justify-center py-3">
                    <CheckCircle size={16}/> SAVE CHANGES
                </Button>
            </div>
        </div>
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {showSetup && <SetupModal onSave={handleSetupSave} />}
      
      {/* Top Bar */}
      <header className="h-[60px] bg-[#151515] border-b border-gray-800 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#00FF94] rounded flex items-center justify-center">
            <LayoutGrid className="text-black" size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold font-mono tracking-tight leading-none">ADMATRIX <span className="text-[#00FF94]">ENGINE</span></h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest">STRATEGIC DIVERSITY v1.0</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#1a1a1a] rounded p-1 border border-gray-800">
          <button 
            onClick={() => setPhase(Phase.STRATEGY)}
            className={`px-4 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${phase === Phase.STRATEGY ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Network size={14}/> STRATEGY
          </button>
          <button 
            onClick={() => { if (project.nodes.length > 1) setPhase(Phase.MATRIX); }}
            className={`px-4 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${phase !== Phase.STRATEGY ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'} ${project.nodes.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <LayoutGrid size={14}/> MATRIX
          </button>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-4">
                <span className="text-[10px] text-gray-500 font-mono">PROJECT</span>
                <span className="text-xs text-gray-300 font-bold">{project.productName}</span>
            </div>
            <Button variant="outline" className="h-8 text-xs px-3">
                <Lock size={12} className="mr-1"/> BRAND KIT
            </Button>
            <Button variant="secondary" className="h-8 text-xs px-3">
                <Download size={12} className="mr-1"/> EXPORT
            </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative bg-[#121212] overflow-hidden">
        {phase === Phase.STRATEGY && renderStrategyCanvas()}
        {(phase === Phase.MATRIX || phase === Phase.EDITOR) && renderMatrix()}
        {phase === Phase.EDITOR && renderEditor()}
      </main>
    </div>
  );
}
