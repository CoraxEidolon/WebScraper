
const siteMapBasic = require("../basic/siteMapBasic");

class CreateDynamicSiteMap extends siteMapBasic {

    CreateSiteMap() {
        const _this = this;
        const SiteMapModel = require("./model/siteMapModel");
        let currentPage = null;

        function SaveSiteMap() {
            const path = require('path');
            const filePath = path.join(__dirname, "./result/siteMap.json");
            _this.SaveSiteMap(filePath);
        }


        const Nightmare = require('nightmare');
        let nightmare = Nightmare({ show: _this.showBrowser }); //Открываем копию браузера

        async function ExtractDataFromPage(inputPageObj) {
            currentPage = inputPageObj;
            await nightmare.goto(currentPage.url).wait("body"); //Переходим на страницу и ждем загрузку body

            //#region Скрипты выполняются в браузере             
            const siteData = await nightmare.evaluate(function () {
                let result = [];
                const linkList = document.getElementsByTagName("A");
                for (let i = 0; i < linkList.length; ++i) {
                    const link = linkList[i].href;
                    if (link.indexOf("extractDataTest") < 0) {
                        continue;
                    }
                    const href = "http://localhost" + link;
                    result.push(link);
                }
                return result;
            });
            //#endregion Скрипты выполняются в браузере

            //Обработка данных с сайта
            if (!siteData) {
                return;
            }

            // Получаем список ссылок пагинации со страницы
            for (let i = 0; i < siteData.length; ++i) {
                const paginationLink = SiteMapModel();
                paginationLink.url = siteData[i];
                const addNewPage = _this.SiteMapAddUrl(paginationLink);
                if (addNewPage) {
                    console.log("Получена страница: " + siteData[i]);
                }
            }

            //Помечаем текущую страницу как посещенную
            currentPage.visited = true;

            //Находим непосещенные страницы       
            const notVisited = _this.siteMap.filter(l => l.visited === false);
            if (notVisited.length === 0) {

                for (let i = 0; i < _this.siteMap.length; ++i) {
                    _this.siteMap[i].visited = false;
                }
                await nightmare.end();
                SaveSiteMap();
                if (_this.callbackCreateSiteMap) {
                    _this.callbackCreateSiteMap();
                }
                return;
            }

            await nightmare.wait(_this.waitTime);//Ждем указанное время
            ExtractDataFromPage(notVisited[0]);//Переходим на следующую страницу

        }


        //Добавляем стартовую страницу к списку пагинации
        const startPageObj = SiteMapModel();
        startPageObj.url = this.startUrl;
        this.SiteMapAddUrl(startPageObj);
        ExtractDataFromPage(_this.siteMap[0]);

    }
}

module.exports = CreateDynamicSiteMap;