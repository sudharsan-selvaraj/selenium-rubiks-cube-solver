const {Builder, By} = require('selenium-webdriver');
const {ServiceBuilder} = require('selenium-webdriver/firefox');
const solver = require('rubiks-cube-solver');
const moveDetails = require("./movementKeyMap.json");

function RubiksPlayer() {

    var sides = ["front", "right", "up", "down", "left", "back"];
    var colorToSideMap = {};

    this.init = async function () {
        global.driver = await new Builder()
            .forBrowser("firefox")
            .setFirefoxService(new ServiceBuilder("/Users/sudharsan/Documents/Applications/geckodriver"))
            .build();
        await this.launchApp();
    };


    this.shuffle = async function () {
        console.log("Shuffling the cube...");
        await driver.findElement(By.css("#actionShuffle")).click();
        await driver.sleep(20000);
        await driver.findElement(By.css("#actionShuffle")).click();
        console.log("Shuffling completed...\n");
        await driver.sleep(2000);
    };

    this.launchApp = async function () {
        await driver.get("http://iamthecu.be/");
        await driver.findElement(By.css("body")).click();
        await driver.sleep(5000);
    };


    this.solve = async function () {
        let solution = await getSolution();
        await play(solution);
    };

    let getSolution = async function () {

        let traversalOrder = {
            "front": ["northWest", "north", "northEast", "west", "origin", "east", "southWest", "south", "southEast"],
            "left": ["northEast", "east", "southEast", "north", "origin", "south", "northWest", "west", "southWest"],
            "right": ["northWest", "north", "northEast", "west", "origin", "east", "southWest", "south", "southEast"],
            "back": ["northEast", "east", "southEast", "north", "origin", "south", "northWest", "west", "southWest"],
            "up": ["northWest", "north", "northEast", "west", "origin", "east", "southWest", "south", "southEast"],
            "down": ["southWest", "west", "northWest", "south", "origin", "north", "southEast", "east", "northEast"]
        };

        sides.map(async function (side) {
            let centerColor = await driver.executeScript(`return cube.${side}.origin.${side}.color.initial`);
            colorToSideMap[centerColor] = side.substring(0, 1);
        });

        let finalValue = sides.map(async function (side) {
            let traversedColorsPromise = traversalOrder[side].map(async function (pos) {
                return driver.executeScript(`return cube.${side}.${pos}.${side}.color.initial`)
            });

            return Promise.all(traversedColorsPromise).then(function (colors) {
                let combinedColors = colors.reduce(function (acc, v) {
                    return acc + colorToSideMap[v];
                }, '');

                return {
                    [side]: combinedColors
                };
            })
        });

        return Promise.all(finalValue).then(function (values) {
            values = values.reduce(function (acc, v) {
                return Object.assign(acc, v);
            }, {});

            let combinedColorsFromAllSides = sides.map(function (side) {
                return values[side]
            }).join("");

            return solver(combinedColorsFromAllSides)
        })
    };


    let play = async function solution(solution) {

        let steps = solution.split(" ");
        console.log("Total number of steps:" + steps.length);

        for (let i = 0; i < steps.length; i++) {
            let step = steps[i];
            let move = step.substring(0, 1);
            let isInverse = false;
            let count = 1;

            if (step.indexOf("prime") >= 0) {
                isInverse = true;
            } else if (step.length === 2) {
                count = 2
            }

            console.log("current Move: " + step + " count:" + count);
            await makeMove(moveDetails[move.toUpperCase()], isInverse, count);
        }
    };


    let makeMove = async function (move, isInverse, noOfTime) {
        let startPoint = move.start,
            endPoint = move.end;
        if (isInverse) {
            startPoint = move.end;
            endPoint = move.start;
        }
        while (noOfTime > 0) {
            let startElement = await getElement(startPoint),
                endElement = await getElement(endPoint);

            await driver.actions().dragAndDrop(startElement, endElement).perform();
            await driver.sleep(500);
            noOfTime--;
        }
    };


    let getElement = async function (pointDetails) {
        let cubeletId = await driver.executeScript(`return cube.${pointDetails.side}.${pointDetails.face}.id`);
        let className = await driver.executeScript(`return cube.${pointDetails.side}.${pointDetails.face}.${pointDetails.side}.element.getAttribute('class')`)
        return driver.findElement(By.css(`.cubeletId-${cubeletId}`)).findElement(By.className(className));
    }

}

module.exports = new RubiksPlayer();

