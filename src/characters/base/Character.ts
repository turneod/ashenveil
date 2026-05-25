export interface CharacterStats {
    openness: number;       // 0 - 100, ne kadar açıksözlü
    trust: number;          // 0 - 100, barmene güven
    mood: number;           // 0 - 100, o anki ruh hali
    VisitCount: number;     // kaç kez geldi
}

export interface Character {
    id: string;
    name: string;
    race: string;
    occupation: string;
    homeland: string;
    personality: string;
    stats: CharacterStats;
    currentDialogueId: string | null;
    relationsWith: Record<string, number>;       // diğer karakterlerle ilişki skoru
}
