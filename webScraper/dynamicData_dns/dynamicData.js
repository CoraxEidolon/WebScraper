class DynamicData {
    constructor() {
        const _siteMap = require("./siteMap");
        const _extractData = require("./extractData");
        this.siteMap = new _siteMap();
        this.extractData = new _extractData();
    }

    async StartExtractData() {
        await this.siteMap.CreateSiteMap();//Составляем карту сайта
        this.extractData.siteMap = this.siteMap.siteMap;
        this.extractData.StartExtractData();
    }

}


const dynamicDataObj = new DynamicData();
dynamicDataObj.siteMap.maxDepth = 5;
dynamicDataObj.siteMap.startUrl = "https://www.dns-shop.ru/catalog/17a8a01d16404e77/smartfony/";
//dynamicDataObj.siteMap.siteMapFilePath = "./result/siteMap.json";
dynamicDataObj.siteMap.waitTime = 500;
dynamicDataObj.siteMap.showBrowser = false;
dynamicDataObj.extractData.waitTime = 500;
dynamicDataObj.StartExtractData();