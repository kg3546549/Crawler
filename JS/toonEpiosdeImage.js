/*
    웹툰 실제 보는 페이지에서 이미지를 긁어옴.
*/

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const comicURL = 'https://comic.naver.com';
const baseURL = 'https://comic.naver.com/webtoon/detail?titleId=26316&no=11&weekday=wed';

async function toonEpisodeImage(toonURL) {
    let toonImages = {
        imgCount : 0,
        imgSrcs : [],
    }
    // console.log("=====input ToonEpisodeImage=====");
    // console.log("     - toonURL : " + toonURL);
    
    await axios.get(toonURL)
    .then(async function(response){
        let $ = cheerio.load(response.data);
        let $images = $('#comic_view_area > div.wt_viewer').find('img');
        // console.log($($images).attr('src'));
        toonImages.imgCount = $images.length;
        // console.log("     - imgCount : " + toonImages.imgCount);
        for(let i=0;i<toonImages.imgCount;i++) {
            let imageObj = {
                index : i,
                src : $($images[i]).attr('src'),
            }
            toonImages.imgSrcs.push(imageObj);
        }
        // console.log(toonImages);
    })
    .catch(function(error) {

    })
    .then(function(){

    });
    // console.log(toonImages);
    return toonImages;
}

// export {toonEpisodeImage};

module.exports = {
    toonEpisodeImage,
}

// toonEpisodeImage(baseURL);