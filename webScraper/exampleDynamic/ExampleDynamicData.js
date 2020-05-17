const ExtractData = require("./extractData");
const SiteMap = require("./siteMap");

class ExampleDynamicData {
    constructor() {
        this.siteMap = new SiteMap();
        this.extractData = new ExtractData();
    }

    async StartExtractData() {
        const _this = this;
        this.siteMap.callbackCreateSiteMap = function(){
            _this.extractData.siteMap = _this.siteMap.siteMap;
            _this.extractData.StartExtractData();
        }
        this.siteMap.CreateSiteMap();
    }




}


const test = new ExampleDynamicData();
test.siteMap.startUrl = "http://localhost/extractDataTest/";
test.siteMap.maxDepth = 10;
test.siteMap.waitTime = 100;

test.extractData.waitTime = 300;

test.StartExtractData();