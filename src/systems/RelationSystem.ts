export class RelationSystem {
    private relations: Map<string, Map<string, number>> = new Map();

    setRelation(characterId: string, targetId: string, value: number): void {
        if (!this.relations.has(characterId)) {
            this.relations.set(characterId, new Map());
        }
        this.relations.get(characterId)!.set(targetId, value);
    }

    getRelation(characterId: string, targetId: string): number {
        return this.relations.get(characterId)?.get(targetId) ?? 0;
    }

    changeRelation(characterId: string, targetId: string, delta: number): void {
        const current = this.getRelation(characterId, targetId);
        const newValue = Math.max(0, Math.min(100, current + delta));
        this.setRelation(characterId, targetId, newValue);
    }

    areClose(characterId: string, targetId: string): boolean {
        return this.getRelation(characterId, targetId) >= 60;
    }

    areEnemies(characterId: string, targetId: string): boolean {
        return this.getRelation(characterId, targetId) <= 20;
    }
}