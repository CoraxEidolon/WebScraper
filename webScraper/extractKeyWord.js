class ExtractKeyWord {
    #natural = require('natural');
    #searchWords = [];
    #text = "";
    #searchThreshold = 0.7;

    #NormalizationText = function (textForNormalization) {
        if (typeof textForNormalization !== "string") {
            return;
        }

        let result = textForNormalization.replace(/[^a-zA-ZА-ЯЁа-яё\s]/g, "");//Убираем все кроме русских и английских символов
        result = result.replace(/[ё]/g, "е");
        result = result.replace(/\s+.?\s+/g, " ");//Удаляем все предлоги
        result = result.toLowerCase();
        result = result.replace(/\s+/g, " "); //Оставояем только один пробел
        result = result.trim();
        return result;
    }

    #UniqueArrVal = function (inputArr) {
        if (!Array.isArray(inputArr)) {
            return null;
        }
        return Array.from(new Set(inputArr));
    }

    #DefineLanguageText = function (inputText) {
        const LANG = {
            rus: function (checkText) {
                return /[А-ЯЁа-яё]/g.test(checkText);
            },
            eng: function (checkText) {
                return /[a-zA-Z]/g.test(checkText);
            }
        }

        let resultLangList = [];
        for (const langKey in LANG) {
            if (LANG[langKey](inputText)) {
                resultLangList.push(langKey);
            }
        }

        return resultLangList;
    }

    #DeleteStopWords = function (tokensArr, langArr = ["rus"]) {
        if (!Array.isArray(tokensArr)) {
            return null;
        }

        if (!Array.isArray(langArr)) {
            return null;
        }

        const sw = require("stopword");
        const LANG = {
            rus: function (inputTokens) {
                return sw.removeStopwords(inputTokens, sw.ru);
            },

            eng: function (inputTokens) {
                return sw.removeStopwords(inputTokens, sw.en);
            }
        }

        let result = tokensArr;
        for (let i = 0; i < langArr.length; ++i) {
            if (LANG.hasOwnProperty(langArr[i])) {
                result = LANG[langArr[i]](result);
            }
        }
        return result;
    }

    #PorterStemmer = function (tokensArr) {

        if (!Array.isArray(tokensArr)) {
            return null;
        }
        const _this = this;
        const LANG = {
            rus: function (inputToken) {
                return _this.#natural.PorterStemmerRu.stem(inputToken);
            },

            eng: function (inputToken) {
                return _this.#natural.PorterStemmer.stem(inputToken);
            }
        }

        for (let i = 0; i < tokensArr.length; ++i) {
            const langTokenArr = this.#DefineLanguageText(tokensArr[i]);
            const langToken = langTokenArr[0];

            if (LANG.hasOwnProperty(langToken)) {
                tokensArr[i] = LANG[langToken](tokensArr[i]);
            }
        }
        return tokensArr;
    }

    #CountTfidf = function (tokensArr) {
        if (!Array.isArray(tokensArr)) {
            return null;
        }
        const TfIdf = this.#natural.TfIdf;
        const tfidf = new TfIdf();

        tfidf.addDocument(tokensArr);
        const tokensMeasure = [];
        for (let i = 0; i < tokensArr.length; ++i) {
            tfidf.tfidfs(tokensArr[i], function (k, measure) {
                tokensMeasure.push(
                    JSON.stringify({
                        token: tokensArr[i],
                        tfidf: measure
                    }));
            });
        }
        const result = this.#UniqueArrVal(tokensMeasure);

        for (let i = 0; i < result.length; ++i) {
            result[i] = JSON.parse(result[i]);
        }

        result.sort((a, b) => a.tfidf > b.tfidf ? -1 : 1);
        return result;
    }

    #NormalizationValue = function (inputArr) {
        if (!Array.isArray(inputArr)) {
            return null;
        }

        if (inputArr.length <= 1) {
            return null;
        }

        const max = inputArr[0].tfidf;
        const min = inputArr[inputArr.length - 1].tfidf;
        for (let i = 0; i < inputArr.length; ++i) {
            inputArr[i].rating = (inputArr[i].tfidf - min) / (max - min);
        }
        return inputArr;
    }

    #NormalizationSearchWords = function () {
        const t = this.#searchWords;
        if (this.#searchWords.length === 0) {
            return null;
        }

        const resultNormalizationText = [];
        //Нормализуем все ключевые слова
        for (let i = 0; i < this.#searchWords.length; ++i) {
            const tmp = this.#NormalizationText(this.#searchWords[i]);
            resultNormalizationText.push(tmp);
        }

        const resultPorterStemmer = this.#PorterStemmer(resultNormalizationText);
        const resultUniqueArrVal = this.#UniqueArrVal(resultPorterStemmer);
        return resultUniqueArrVal;
    }

    //#region SearchWords
    AddSearchWordsList(inputArr) {
        if (!Array.isArray(inputArr)) {
            return;
        }
        this.#searchWords = this.#searchWords.concat(inputArr);
    }

    ClearSearchWordsList() {
        this.#searchWords = [];
    }
    //#endregion SearchWords

    //#region text
    set text(inputStr) {
        if (typeof inputStr !== "string") {
            return;
        }
        this.#text = inputStr;
    }

    get text() {
        return this.#text = inputStr;
    }
    //#endregion text

    //#region searchThreshold

    set searchThreshold(inputNum) {
        if (typeof inputNum !== "number") {
            return;
        }
        if (inputNum > 1 || inputNum < 0) {
            return;
        }

        this.#searchThreshold = inputNum;
    }

    get searchThreshold() {
        return this.#searchThreshold;
    }

    //#endregion searchThreshold

    GetKeyWordList() {
        const tokenizer = new this.#natural.WordTokenizer();
        const textForSearch = this.#NormalizationText(this.#text);//Нормализуем текст  
        const LANG_TEXT_ARR = this.#DefineLanguageText(textForSearch);// Определяем языки в тексте
        const tokens = tokenizer.tokenize(textForSearch); //Разбиваем на токены
        const tokensWithoutStopWord = this.#DeleteStopWords(tokens, LANG_TEXT_ARR); //Удаляем стоп слова
        const tokensWordBasis = this.#PorterStemmer(tokensWithoutStopWord); // Стеммер Портера, выделяем основы слов
        const resultTfidf = this.#CountTfidf(tokensWordBasis);
        const resultTfidfNormalizationValue = this.#NormalizationValue(resultTfidf);
        const normalizationSearchWords = this.#NormalizationSearchWords();
        const resultKeywords = [];
        for (let i = 0; i < resultTfidfNormalizationValue.length; ++i) {
            if (resultTfidfNormalizationValue[i].rating >= this.#searchThreshold) {
                for (let j = 0; j < normalizationSearchWords.length; ++j) {
                    if (normalizationSearchWords[j] === resultTfidfNormalizationValue[i].token) {
                        resultKeywords.push(resultTfidfNormalizationValue[i]);
                        continue;
                    }
                }
            }
        }
        return resultKeywords;
    }
}
const text = "В магистерской диссертации на тему «Методы и алгоритмы получения неструктурированной информации с веб сайтов путем анализа их исходного кода» рассмотрены проблемы извлечения информации с современных веб-сайтов путем анализа.  С целью решения задачи были проанализированы существующие методы извлечения информации с веб-сайтов, выявлены их преимущества и недостатки, а так же уместность применения того или иного метода в конкретной ситуации. Были разработаны алгоритмы создания карты с веб сайтов. Разработана методика и даны рекомендации по извлечению данных с веб-сайтов. Используя разработанную методику извлечения данных можно добиваться более высоких показателей по извлечению данных с веб-сайтов";
const extractKeyWordObj = new ExtractKeyWord();
extractKeyWordObj.text = text;
extractKeyWordObj.AddSearchWordsList(["извлечение", "вебсайт", "методика", "кот"]);
extractKeyWordObj.GetKeyWordList();