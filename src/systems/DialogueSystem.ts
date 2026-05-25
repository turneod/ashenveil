import type { DialogueTree, DialogueNode } from "../dialogue/DialogueTree";

export class DailogueSystem {
    private currentTree: DialogueTree | null = null;
    private currentNode: DialogueNode | null = null;

    startDialogue(tree: DialogueTree): void {
        this.currentTree = tree;
        this.currentNode = this.findNode(tree.startId);
    }

    getCurrentNode(): DialogueNode | null {
        return this.currentNode
    }

    selectResponse(responseIndex: number): void {
        if (!this.currentNode) return;

        const responses = this.currentNode.line.responses;
        if (!responses || responseIndex >= responses.length) return;

        const nextId = responses[responseIndex].nextId;
        this.currentNode = this.findNode(nextId);
    }

    isFinished(): boolean {
        return this.currentNode === null;
    }

    private findNode(id: string): DialogueNode | null {
        if (!this.currentTree) return null;
        return this.currentTree.nodes.find(n => n.id === id) ?? null;
    }
}