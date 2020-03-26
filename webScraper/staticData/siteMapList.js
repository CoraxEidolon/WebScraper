class SiteMapList {
    #siteMap = [];
    #index = 0;

    Add(newPage) {
        const tmp = this.#siteMap.find(u => u.url === newPage.url);
        if (tmp) {
            return; //Такая страница уже есть, выходим
        }
        this.#siteMap.push(newPage);
    }

    GetCurrent() {
        if (this.#siteMap[this.#index]) {
            return this.#siteMap[this.#index];
        } else {
            null;
        }
    }

    GetNext() {
        const nextVal = this.#siteMap[this.#index + 1];
        if (nextVal) {
            this.#siteMap[this.#index].visited = true;
            ++this.#index;
            return nextVal;
        }else{
            return null;
        }
    }
}

module.exports = SiteMapList;