export interface GameEvent {
    id: string;
    trigger: 'day' | 'visit' | 'relation' | 'random';
    probability: number;        // 0 - 1 arası, 1 kesin gerçekleşir
    conditions?: {
        minDay?: number;
        characterId?: string;
        minRelation?: number;
    };
    execute: () => void;
}

export class EventSystem {
    private events: GameEvent[] = [];
    private triggeredEvents: Set<string> = new Set();

    registerEvent(event: GameEvent): void {
        this.events.push(event);
    }

    checkEvents(trigger: GameEvent['trigger']): void {
        this.events
        .filter(e => e.trigger === trigger)
        .filter(e => !this.triggeredEvents.has(e.id))
        .filter(e => Math.random() <= e.probability)
        .forEach(e => {
            e.execute();
            if (e.probability === 1) {
                this.triggeredEvents.add(e.id);
            }
        });
    }

    hasTriggered(eventId: string): boolean {
        return this.triggeredEvents.has(eventId);
    }

    reset(): void {
        this.triggeredEvents.clear();
    }
}