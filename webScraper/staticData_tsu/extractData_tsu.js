const ExtractData = require("./extractData");
const SiteMap = require("./siteMap");

class ExtractData_tsu {
    constructor() {
        this.siteMap = new SiteMap();
        this.extractData = new ExtractData();
    }

    StartExtractData() {
        const _this = this;
        this.siteMap.callbackCreateSiteMap = function(){
            _this.extractData.siteMap = _this.siteMap.siteMap;
            _this.extractData.ExtractDataNews();
        }
        this.siteMap.CreateSiteMap();

    }

}


const test = new ExtractData_tsu();
test.siteMap.startUrl = "http://tsu.tula.ru/news/all/?skip=0";
test.siteMap.maxDepth = 10;
test.siteMap.waitTime = 2000;

test.extractData.waitTime = 300;



test.StartExtractData();