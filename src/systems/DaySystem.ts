export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface GameDate {
    day: number;
    month: number;
    year: number;
    season: Season;
}

export class DaySystem {
    private date: GameDate = {
        day: 1,
        month: 1, 
        year: 1,
        season: 'spring',
    };

    private readonly daysPerMonth = 30;
    private readonly monthsPerYear= 12;

    getDate(): GameDate {
        return this.date;
    }

    nextDay(): void {
        this.date.day++;

        if (this.date.day > this.daysPerMonth){
            this.date.day = 1;
            this.date.month++;
        }

        if (this.date.month > this.monthsPerYear) {
            this.date.month = 1;
            this.date.year++;
        }

        this.date.season = this.calculateSeason();
    }

    calculateSeason(): Season {
        const month = this.date.month;

        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    getSeasonName(): string {
        const names: Record<Season, string> = {
            spring: 'Bahar',
            summer: 'Yaz',
            autumn: 'Sonbahar',
            winter: 'Kış',
        };
        return names[this.date.season]
    }
}