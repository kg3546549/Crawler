const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const baseURL = 'https://comic.naver.com/webtoon/creation';
const AlphabetList = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ','A','0'];

let allToonList = {
    numOfAllToons : 0,
    baseURL : baseURL,
    toonList : [],
};

axios.get(baseURL)
    .then(function(response) {
        const $ = cheerio.load(response.data);
        
        const $toons = $('#content > div.all_list.all_image > div.section');
        
        //알파벳 갯수는 16개(ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎA0)
        
        for(let alphabet = 0;alphabet<$toons.length;alphabet++) {
            const numOfToons = $($toons[alphabet]).find('li').length;

            let ToonList = {
                alphabet : AlphabetList[alphabet],
                numOfToons : numOfToons,
                toonList : [],
            };

            console.log(AlphabetList[alphabet]+'의 웹툰 개수 : ' + numOfToons);
            allToonList.numOfAllToons += numOfToons;

            for(let index = 1;index < numOfToons; index++) {
                const selectorString = '#content > div.all_list.all_image > div:nth-child('
                +(alphabet+1)+') > ul > li:nth-child('+(index)+') > div > a';

                const imgSelectorString = '#content > div.all_list.all_image > div:nth-child('
                +(alphabet+1)+') > ul > li:nth-child('+(index)+') > div > a > img:nth-child(1)';

                const $selectedToon = $(selectorString);
                const $ImageselectedToon = $(imgSelectorString);

                //ToonList JSON Parsing
                ToonList.toonList.push({
                    idx : index,
                    title : $($selectedToon).attr('title'),
                    finished : '',
                    thumbnail : $($ImageselectedToon).attr('src'),
                    URL : baseURL+$($selectedToon).attr('href'),
                });
                // console.log(ToonList);
            }
            allToonList.toonList.push(ToonList);
        }

        //JSON Writing
        const JSON_weekToonList = JSON.stringify(allToonList);
        fs.writeFileSync('AllToonList.json',JSON_weekToonList);
        
    })
    .catch(function(error) {
        console.log(error);
    })
    .then(function() {
        
    });

    