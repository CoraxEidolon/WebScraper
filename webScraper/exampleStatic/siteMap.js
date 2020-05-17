const siteMapBasic = require("../basic/siteMapBasic");

class CreateStaticSiteMap extends siteMapBasic {

    CreateSiteMap() {
        const _this = this;
        const request = require("request");
        const cheerio = require("cheerio");
        const SiteMapModel = require("./model/siteMapModel");
        let currentPage = null;

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
            const paginationLinkList = $("#Pagination a");//Ссылки пагинации
          

            // Получаем список ссылок пагинации на странице
            for (let i = 0; i < paginationLinkList.length; ++i) {
                const linkHref = $(paginationLinkList[i]).attr("href");//Извлекаем ссылку

                if (linkHref.indexOf("extractDataTest") < 0) {
                    continue;
                }
                const href = "http://localhost" + linkHref;
                const paginationLink = SiteMapModel();
                paginationLink.url = href;
                const addNewPage = _this.SiteMapAddUrl(paginationLink);

                if(addNewPage){
                    console.log("Получена страница: "+href);
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


        /**
         * Получить данные с страницы
         * @param {object} inputPageObj  - страница
         */
        function ExtractDataFromPage(inputPageObj) {
            currentPage = inputPageObj;
            //Делаем запрос на стартовую страницу
            request(inputPageObj.url, ExtractData);
        }

        //Добавляем стартовую страницу к списку пагинации
        const startPageObj = SiteMapModel();
        startPageObj.url = this.startUrl;
        this.SiteMapAddUrl(startPageObj);
        ExtractDataFromPage(this.siteMap[0]);
    }
}

module.exports = CreateStaticSiteMap;