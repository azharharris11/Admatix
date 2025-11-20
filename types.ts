export enum Phase {
    STRATEGY = 'STRATEGY',
    MATRIX = 'MATRIX',
    EDITOR = 'EDITOR'
}
  
export enum NodeType {
    ROOT = 'ROOT',
    PERSONA = 'PERSONA',
    AWARENESS = 'AWARENESS',
    HOOK = 'HOOK'
}
  
export interface StrategyNode {
    id: string;
    type: NodeType;
    label: string;
    parentId?: string;
    x?: number;
    y?: number;
    data?: any;
}
  
export enum AdFramework {
    UGLY_VISUAL = 'Ugly Visual (Messy)',
    BIG_FONT = 'Big Font (Pattern Interrupt)',
    NOTES_APP = 'Notes App (Native)',
    GMAIL_UX = 'Gmail UX (Familiarity)',
    BILLBOARD = 'Digital Billboard',
    REDDIT = 'Reddit UX',
    STANDARD = 'Standard Polish'
}

export interface AdFormula {
    keyword: string;
    emotion: string;
    qualifier: string;
    outcome: string;
}
  
export interface AdVariant {
    id: string;
    personaId: string;
    framework: AdFramework;
    status: 'EMPTY' | 'GENERATING' | 'DONE';
    thumbnailUrl?: string;
    headline: string;
    bodyText: string; // Formerly subhead, now long text
    cta: string;
    formula: AdFormula;
    entityIdScore: number; // 0-100, lower is better (more unique)
    isRawMode: boolean;
    style: 'Professional' | 'Slang' | 'Urgent' | 'Scientific';
}
  
export interface ProjectState {
    productName: string;
    productImage: string;
    nodes: StrategyNode[];
    variants: AdVariant[];
    activeVariantId: string | null;
}