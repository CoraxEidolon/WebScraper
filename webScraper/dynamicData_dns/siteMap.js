const SiteMapModel = require("./model/siteMapModel");
const Counter = require("../counter/counter");

class CreateDynamicSiteMap {
    #siteMapFilePath = "";
    #siteMap = [];
    #maxDepth = 10;
    #showBrowser = false;
    #startUrl = "";
    #waitTime = 5000;

    #CheckUniqueValue = function (newPageLinkStr) {

        if (!newPageLinkStr) {
            return false;
        }

        if (typeof newPageLinkStr !== "string") {
            return false
        }

        if (this.#siteMap.length === 0) {
            return true;
        }

        const findNewVal = this.#siteMap.find(l => l.url === newPageLinkStr);
        if (findNewVal) {
            return false;
        } else {
            return true;
        }
    }

    #SaveSiteMap = function () {
        const path = require('path');
        const filePath = path.join(__dirname, './result/siteMap.json');
        const workWithFiles = require('../workWithFiles/workWithFiles');
        workWithFiles.JSONSaveFromFile(filePath, this.#siteMap);
    }

    #ReadSiteMap = function () {
        const path = require('path');
        const filePath = path.join(__dirname, this.#siteMapFilePath);
        const workWithFiles = require('../workWithFiles/workWithFiles');
        const readSiteMap = workWithFiles.JSONReadFromFile(filePath);
        if (!Array.isArray(readSiteMap)) {
            return;
        }
        this.#siteMap = readSiteMap;
    }

    CreateSiteMap = async function () {
        if (!this.#startUrl) {
            return;
        }

        if (this.#siteMapFilePath) {//Если есть путь к карте сайта читаем его
            this.#ReadSiteMap();
        }

        const counter = new Counter();
        const Nightmare = require('nightmare');
        let nightmare;
        try {
            nightmare = Nightmare({ show: this.#showBrowser });
            await nightmare
                .goto(this.#startUrl)
                .wait("body");

            let step = 1;
           
            while(true) {

                //#region Скрипты выполняются в браузере             
                const siteData = await nightmare.evaluate(function () {
                    let result = [];
                    const productList = document.getElementsByClassName("product-info__title-link");
                    for (let i = 0; i < productList.length; ++i) {
                        const link = productList[i].getElementsByTagName("a")[0].href;
                        result.push(link);
                    }

                    const btnNextPage = document.getElementsByClassName("pagination-widget__page-link_next");
                    if (btnNextPage.length > 0) {
                        if (btnNextPage[0].classList.contains("pagination-widget__page-link_disabled")) {
                            return false;//Это последняя страница
                        }
                        btnNextPage[0].click();
                    }

                    return result;
                });
                //#endregion Скрипты выполняются в браузере

                //Обработка данных с сайта
                if (!siteData) {
                    return;
                }

                console.log("Страница " + step + ", ссылок получено: ");

                //Проверяем уникальность ссылок
                let addLink = 0; //кол-во добавленных ссылок
                for (let i = 0; i < siteData.length; ++i) {
                    if (this.#CheckUniqueValue(siteData[i])) {
                        const newLink = SiteMapModel();
                        newLink.url = siteData[i];
                        this.#siteMap.push(newLink);
                        addLink++;
                        console.log("    " + addLink + ") " + newLink.url);
                        if (counter.Tick() >= this.#maxDepth) {
                            this.#SaveSiteMap();
                            return;
                        };
                    }
                }


                //Так как не можем получить состояние, что новые данные загружены, првоверяем и ждем
                for (let wait = 0; wait < 100; ++wait) {
                    
                    //#region Скрипты выполняются в браузере             
                    const checkNewValues = await nightmare.evaluate(function () {
                        let result = [];
                        const productList = document.getElementsByClassName("product-info__title-link");
                        for (let i = 0; i < productList.length; ++i) {
                            const link = productList[i].getElementsByTagName("a")[0].href;
                            result.push(link);
                        }
                        return result;
                    });
                    //#endregion Скрипты выполняются в браузере

                    if (!checkNewValues) {
                        await nightmare.wait(10);
                        continue;
                    }
                    
                    if (checkNewValues[0] !== siteData[0]) {
                        break;
                    }
                    await nightmare.wait(10);
                }

                this.#SaveSiteMap();
                await nightmare.wait(this.#waitTime);
                step++;
            }//while

        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            await nightmare.end();
        }
    }

    //#region maxDepth
    set maxDepth(inputNum) {
        if (typeof inputNum === "number") {
            this.#maxDepth = inputNum;
        }
    }

    get maxDepth() {
        return this.#maxDepth;
    }
    //#endregion maxDepth

    //#region waitTime
    set waitTime(inputNum) {
        if (typeof inputNum === "number") {
            this.#waitTime = inputNum;
        }
    }

    get waitTime() {
        return this.#waitTime;
    }
    //#endregion waitTime

    //#region showBrowser
    set showBrowser(inputBool) {
        if (typeof inputBool === "boolean") {
            this.#showBrowser = inputBool;
        }
    }

    get showBrowser() {
        return this.#showBrowser;
    }
    //#endregion showBrowser

    //#region startUrl
    set startUrl(inputStr) {
        if (typeof inputStr === "string") {
            this.#startUrl = inputStr;
        }
    }

    get startUrl() {
        return this.#startUrl;
    }
    //#endregion startUrl

    //#region siteMapFilePath
    set siteMapFilePath(inputStr) {
        if (typeof inputStr === "string") {
            this.#siteMapFilePath = inputStr;
        }
    }

    get siteMapFilePath() {
        return this.#siteMapFilePath;
    }
    //#endregion siteMapFilePath

    //#region siteMap
    set siteMap(inputArr) {
        if (Array.isArray(inputArr)) {
            this.#siteMap = inputArr;
        }
    }

    get siteMap() {
        return this.#siteMap;
    }
    //#endregion siteMap
}

module.exports = CreateDynamicSiteMap;