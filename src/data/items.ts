export interface DrinkEffect {
    stat: 'openness' | 'trust' | 'mood';
    value: number;
}

export interface DrinkItem {
    id: string;
    name: string;
    price: number;
    origin: string;
    description: string;
    taste: string;
    effect: DrinkEffect;
    rare: boolean;
}

export const DRINKS: DrinkItem[] = [
  {
    id: 'ashenveil-ale',
    name: 'Ashenveil Birası',
    price: 2,
    origin: 'Ashenveil',
    description: 'Durhal\'ın kendi birası. Barmenin büyükbabasının tarifi. Değişmedi hiç.',
    taste: 'Ağır, biraz acı, sonunda sıcak bir his bırakıyor.',
    effect: { stat: 'mood', value: 10 },
    rare: false,
  },
  {
    id: 'valdris-stone-mead',
    name: 'Valdris Taş Balı',
    price: 4,
    origin: 'Valdris',
    description: 'Valdris dağlarının sert balından yapılıyor. Bir fıçısı her mevsim geliyor, bitmeden yenisi gelmez.',
    taste: 'Tatlı ama keskin. Gırtlakta yakıyor.',
    effect: { stat: 'openness', value: 15 },
    rare: false,
  },
  {
    id: 'dorrfell-wine',
    name: 'Dorrfell Kırmızısı',
    price: 5,
    origin: 'Dorrfell',
    description: 'Dorrfell ovalarının en iyi üzümünden. Hafif, kadifemsi, insanı rahatlatıyor.',
    taste: 'Meyve aromalı, yumuşak, uzun bir son tat bırakıyor.',
    effect: { stat: 'trust', value: 12 },
    rare: false,
  },
  {
    id: 'nholmast-black',
    name: 'Nholmast Karası',
    price: 6,
    origin: 'Nholmast',
    description: 'Limanlarda yapılan karanlık bir içki. İçinde ne olduğunu tam kimse bilmiyor. Sorma da.',
    taste: 'Tuzlu, acı, beklenmedik bir tatlılık sonda.',
    effect: { stat: 'openness', value: 20 },
    rare: false,
  },
  {
    id: 'elysvann-silver',
    name: 'Elysvann Gümüşü',
    price: 10,
    origin: 'Elysvann',
    description: 'Elfler tarafından yapılan hafif, şeffaf bir içki. Pahalı ama isteyen var hep.',
    taste: 'Neredeyse tatsız ama içtikten sonra her şey biraz daha net görünüyor.',
    effect: { stat: 'mood', value: 20 },
    rare: false,
  },
  {
    id: 'karath-fire',
    name: 'Karath Ateşi',
    price: 7,
    origin: 'Karath Duum',
    description: 'Dwarf ve Ork demircilerin içtiği. Volkanik taşlarda dinlendiriliyor. Zayıf mideler için değil.',
    taste: 'Yanıyor. Sadece yanıyor.',
    effect: { stat: 'openness', value: 25 },
    rare: false,
  },
  {
    id: 'theyorn-spark',
    name: 'Theyorn Kıvılcımı',
    price: 12,
    origin: 'Theyorn',
    description: 'Gnomlar büyüyle fermante ediyor. Bardakta hafif parlıyor. Merak uyandırıyor.',
    taste: 'Metalik bir his, sonra bir enerji dalgası.',
    effect: { stat: 'mood', value: 25 },
    rare: true,
  },
  {
    id: 'vethara-green',
    name: 'Vethara Yeşili',
    price: 15,
    origin: 'Vethara',
    description: 'Vethara\'dan çok nadir çıkıyor. Orman bitkilerinden yapılıyor. Bir şişesi yıllarca Durhal\'da bekler.',
    taste: 'Taze, toprak ve ot aromalı. Sanki ormanın içindesinmiş gibi.',
    effect: { stat: 'trust', value: 30 },
    rare: true,
  },
  {
    id: 'unknown-brew',
    name: 'Bilinmeyenin Damıtığı',
    price: 0,
    origin: 'Bilinmiyor',
    description: 'Kimse nereden geldiğini bilmiyor. Zaman zaman Durhal\'ın bodrumunda çıkıyor. Barmen satmıyor — ama bazen özel birine veriyor.',
    taste: 'Her içen farklı bir şey tarif ediyor.',
    effect: { stat: 'openness', value: 50 },
    rare: true,
  },
  {
    id: 'water',
    name: 'Su',
    price: 0,
    origin: 'Ashenveil',
    description: 'Dağ suyu. Temiz ve soğuk. Bazıları sadece su içmek için geliyor Durhal\'a.',
    taste: 'Su.',
    effect: { stat: 'mood', value: 5 },
    rare: false,
  },
];