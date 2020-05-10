const siteMapBasic = require("../basic/siteMapBasic");

class CreateStaticSiteMap extends siteMapBasic {


    CreateSiteMap() {
        const _this = this;
        const request = require("request");
        const cheerio = require("cheerio");
        const SiteMapModel = require("./model/siteMapModel");
        const PaginationLinkModel = require("./model/paginationLinkModel");
        let currentPage = null;
        const paginationLinkListVisited = [];

        /**
         * Проверяет уникальность ссылок пагинации
         * @param {object} newPageLinkStr 
         */
        function CheckUniquePaginationLink(newPageLinkStr) {
            if (!newPageLinkStr) {
                return false;
            }

            if (typeof newPageLinkStr !== "string") {
                return false
            }

            if (paginationLinkListVisited.length === 0) {
                return true;
            }

            const findNewVal = paginationLinkListVisited.find(l => l.url === newPageLinkStr);
            if (findNewVal) {
                return false;
            } else {
                return true;
            }
        }

        function SaveSiteMap() {
            const path = require('path');
            const filePath = path.join(__dirname, "./result/siteMap.json");
            _this.SaveSiteMap(filePath);
        }

        function ExtractData(err, res, body) {
            if (err) throw err;
            if (res.statusCode !== 200) {
                console.log("Статус страницы: " + res.statusCode);
                if(_this.callbackCreateSiteMap){
                    _this.callbackCreateSiteMap();
                }
                return;
            }

            // парсим DOM
            const $ = cheerio.load(body);
            const paginationLinkList = $(".pages a");//Ссылки пагинации
            const newsLinkList = $(".news_headline a");//Ссылки новостей

            // Получаем список ссылок пагинации на странице
            for (let i = 0; i < paginationLinkList.length - 1; ++i) {
                const href = "http://tsu.tula.ru/news/all/" + $(paginationLinkList[i]).attr("href");//Извлекаем ссылку
                const paginationLink = PaginationLinkModel();
                paginationLink.url = href;

                //Проверяем уникальность ссылки
                if (CheckUniquePaginationLink(paginationLink.url)) {
                    paginationLinkListVisited.push(paginationLink);
                }
            }

            // Получаем список ссылок новостей на странице
            for (let i = 0; i < newsLinkList.length; ++i) {
                const href = $(newsLinkList[i]).attr("href");
                const numberNews = href.replace(/[^\d]/g, "");
                const resultLink = "http://tsu.tula.ru/news/all/" + numberNews;
                const newNews = SiteMapModel();
                newNews.url = resultLink;
                const isAddNewVal = _this.SiteMapAddUrl(newNews);
                if (isAddNewVal) {
                    console.log("Добавлена страница: " +  newNews.url);
                }        
                // Достигнуто желаемое количество страниц
                if (_this.siteMap.length >= _this.maxDepth) {
                    SaveSiteMap();
                    if(_this.callbackCreateSiteMap){
                        _this.callbackCreateSiteMap();
                    }
                    return;
                }
            }

            //Помечаем текущую страницу как посещенную
            currentPage.visited = true;
            //Находим непосещенные страницы
            const notVisited = paginationLinkListVisited.filter(l => l.visited === false);
            if (notVisited.length === 0) {
                SaveSiteMap();
                if(_this.callbackCreateSiteMap){
                    _this.callbackCreateSiteMap();
                }
                return;
            }
            
            setTimeout((function () {
                ExtractDataFromPage(notVisited[0]);
            }), _this.waitTime);
        }

        function ExtractDataFromPage(inputPageObj) {
            currentPage = inputPageObj;
            //Делаем запрос на стартовую страницу
            request(inputPageObj.url, ExtractData);
        }

        //Добавляем стартовую страницу к списку пагинации
        const startPageObj = PaginationLinkModel();
        startPageObj.url = this.startUrl;
        paginationLinkListVisited.push(startPageObj);
        ExtractDataFromPage(paginationLinkListVisited[0]);
    }
}

module.exports = CreateStaticSiteMap;