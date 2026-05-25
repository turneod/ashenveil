export interface DialogueLine {
    speaker: string; 
    text: string;
    responses?: DialogueResponse[];
}

export interface DialogueResponse {
    text: string;
    nextId: string;
}

export interface DialogueNode {
    id: string;
    line: DialogueLine;
}

export interface DialogueTree {
    id: string;
    nodes: DialogueNode[];
    startId: string;   
}