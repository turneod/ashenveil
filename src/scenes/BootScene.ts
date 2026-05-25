import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
    constructor() {
        super({key: 'BootScene' });
    }

    create() {
        console.log('Ashenveil yükleniyor...');
    }
}