import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 540, 
  height: 960,
  backgroundColor: '#0a0a0a',
  scene: [ BootScene ],
};

new Phaser.Game(config);