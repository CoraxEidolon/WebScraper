const WorkWithFiles = new class {
    #fs = require('fs');


    JSONSaveFromFile(filePath, dataSaveJson) {
        if (!filePath || !dataSaveJson) {
            return;
        }

        if (typeof filePath !== "string") {
            return;
        }

        this.#fs.writeFileSync(filePath, dataSaveJson);
    }

    JSONReadFromFile = function (filePath) {
        if (!this.#fs.existsSync(filePath)) {
            return null;
        }
        const readData = this.#fs.readFileSync(filePath, 'utf8');
        try {
            const result = JSON.parse(readData);
            return result;
        } catch{
            return null;
        }
    }
}

module.exports = WorkWithFiles;