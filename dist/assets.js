const IMAGE_SOURCES = {
    map: 'img/external/overworld.png?v=no-bushes-no-pink-trees',
    billboard: 'img/external/buildings/billboard.png',
    cinema: 'img/external/buildings/cinema.png',
    musicShop: 'img/external/buildings/music-shop.png',
    gym: 'img/external/buildings/gym.png',
    gymRoof: 'img/external/buildings/gym-roof.png',
    snowMansion: 'img/external/buildings/snow-mansion.png',
    jobCenter: 'img/external/buildings/job-center.png',
    artistStudio: 'img/external/buildings/artist-studio.png',
    feedback: 'img/external/buildings/feedback.png?v=91x97',
    diaryLab: 'img/external/buildings/diary-lab.png',
    bookshop: 'img/external/buildings/bookshop.png',
    zenGarden: 'img/external/buildings/zen-garden.png',
    tori: 'img/external/buildings/tori.png',
    spriteSheet: 'example_character/SpriteSheet.png',
    mike: 'chat/mike/overworld-avatar.png',
    mikeAftermath: 'img/external/mike-aftermath.png',
    niall: 'chat/niall/avatar.png',
    niallSprite: 'chat/niall/niall-sprite.png',
};
export const images = Object.fromEntries(Object.keys(IMAGE_SOURCES).map((name) => [name, new Image()]));
function loadImage(image, src) {
    return new Promise((resolve, reject) => {
        // decode() keeps the 1254x1254 map's bitmap expansion off the first frame's
        // animation callback; it is optional, so a failure there is not fatal.
        image.onload = () => resolve(image.decode?.().catch(() => { }));
        image.onerror = () => reject(new Error(`Failed to load ${src}`));
        image.src = src;
    });
}
export function loadAssets() {
    return Promise.all(Object.entries(IMAGE_SOURCES).map(([name, src]) => loadImage(images[name], src)));
}
//# sourceMappingURL=assets.js.map