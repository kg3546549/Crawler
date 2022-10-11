const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const dayList = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
let toonList = [];

axios.get('https://comic.naver.com/webtoon/weekday')
    .then(function(response) {
        const $ = cheerio.load(response.data);
        //전체 주들의 DOM을 가지고 있음
        const $weekIdx = $('#content > div.list_area.daily_all > div.col');

        for(let weeks = 1;weeks<=$($weekIdx).length;weeks++) {
            //toonList에 Push할 배열
            let dayToonList = [];

            const weekToonIdx = $($weekIdx[weeks-1]).find('li').length;
            console.log('일 별 웹툰 갯수 : '+weekToonIdx);
            for(let i=1;i<=weekToonIdx;i++) {
                //각 li에 참조
                let selectorString = '#content > div.list_area.daily_all > div:nth-child('+ weeks +') > div > ul > li:nth-child('+ i +') > a';
                const $name = $(selectorString);

                dayToonList.push({
                    idx : i,
                    title : $($name).text(),
                });
            }
            toonList.push(
                {
                    day : dayList[weeks-1],
                    numOfWebtoons : weekToonIdx,
                    webToons : dayToonList
                }
            );
        }
        
        //JSON Writing
        const JSON_weekToonList = JSON.stringify(toonList);
        fs.writeFileSync('Toon Ranking.json',JSON_weekToonList);
        
    })
    .catch(function(error) {
        console.log(error);
    })
    .then(function() {
        
    });