let player = require("./player.js");

(async function () {
    await player.init();
    await player.shuffle();
    await player.solve();
})();

