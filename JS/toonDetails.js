const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const toonImage = require('./toonEpiosdeImage.js');

const comicURL = 'https://comic.naver.com';
//
const baseURL1 = 'https://comic.naver.com/webtoon/list?titleId=752350';
const baseURL2 = 'https://comic.naver.com/webtoon/list?titleId=784886';
const baseURL = 'https://comic.naver.com/webtoon/list?titleId=749055';

/*
    아무런 예외처리가 되어있지 않은 모듈임. 10.11 Gun
    Banner가 하나일때의 에외처리 필요.
    만약 cheerio를 이용한 데이터 파싱에서 delay가 생겨 for Loop에 먼저 도달하게 되면 비어있는 데이터로 JSON이 나올 수 있음.
    await 문법으로 보완 필요/
*/


/**
 * 
 * @param {string} EpisodesPageURL
 * 각 회차는 총 10회로 나누어져 화면에 표시됨. 100회면 1~10으로 페이지가 나누어서 표시되기에\n
 * 인덱스가 포함된 페이지를 Input 함
 * @returns episodeObj 객체를 리턴함. 
 * let episodeObj = { 
        title : episodeTitle, <= 회차 이름 
        href : href, <= 회차 URl 
        thumbnailSrc : thumbnailSrc, <= 썸네일 URL 
        grade : episodeGrade, <= 회차 평점 
        date : episodeDate, <= 등록일 

 */
async function pageEpisodeList(EpisodesPageURL) {

    return new Promise(function(resolve,reject) {
        axios.get(EpisodesPageURL)
        .then(async function(response) {
            const $ = cheerio.load(response.data);
            // console.log(EpisodesPageURL);
            //웹툰 정보
            const $comicInfo = $('#content > div.comicinfo');
            const $not_episodes = $('#content > table > tbody > tr.band_banner');
            const $episodes = $('#content > table > tbody > tr');
            
            

            let EpisodeList = [];
            let startIdx = 0;
            
            /*
                not_episodes : 실제 에피소드가 아닌 것(배너 : 웹툰앱에서 24시간마다 무료로 볼 수 있는 작품입니다 등)
                유료일 경우에는 not_episodes가 0이 아님.
                따라서 startIdx로 for 탐색하는 범위를 수정.
            */
            if($not_episodes.length != 0) startIdx = 1;
            // console.log(startIdx);

            let indexArr = Array.from(Array($episodes.length-$not_episodes.length).keys());

            // for(let idx=0;idx<$episodes.length-$not_episodes.length;idx++) {
            //     EpisodeList.push(OBJ);
            // }
            // console.log(EpisodeList[0]);
            
            let idx = 0;
            for await(let idx of indexArr ) {
                let Episode = {
                    href : '',
                    title : '',
                    thumbnailSrc : '',
                    grade : '',
                    date : '',
                    images : [],
                };
                
                // console.log('idx : '+idx);
                //회차별 정보
                const $href = $($episodes).find('td.title > a');
                let href = comicURL+$($href[idx]).attr('href');
                // console.log(href);
                
                
                //Thumbnail
                const $thumbnail = $($episodes).find('td > a > img');
                let episodeTitle = $($thumbnail[idx+startIdx]).attr('title');
                let thumbnailSrc = $($thumbnail[idx+startIdx]).attr('src');
                

                //별점
                const $episodeGrade = $($episodes).find('td > div.rating_type > strong');
                let episodeGrade = $($episodeGrade[idx]).text()
                

                //등록일
                const $episodeDate = $($episodes).find('td.num');
                let episodeDate = $($episodeDate[idx]).text();

                
                Episode.href = href;
                Episode.title = episodeTitle;
                Episode.thumbnailSrc = thumbnailSrc;
                Episode.grade = episodeGrade;
                Episode.date = episodeDate;
                
                // let images1 =  toonImage.toonEpisodeImage(href)
                // .then(function(response){
                //     Episode.images = response;
                //     console.log(Episode);
                // });

                Episode.images = await toonImage.toonEpisodeImage(href);
                // console.log("======== 에피소드 ========")
                // console.log(Episode);
                EpisodeList.push(Episode);
                
            }

            // console.log(EpisodeList);
            resolve(EpisodeList);
        })
        .catch(function(error) {
            console.log(error);
        })
        .then(function() {

        });
    });
    
}

async function toonInfo(toonBaseURL, totalID) {
    let toonEpisodeList = {
        baseURL : toonBaseURL,
        title : '',
        titleId : 0,
        totalId : totalID,
        thumbnailSrc : '',
        writterName : '',
        Description : '',
        Genre : [],
        Age : '',
        numOfEpisode : 0,
        episodeList : [],
    };

    axios.get(toonBaseURL)
    .then(async function(response) {
        console.log("Step : " +totalID + " / 1985");
        const $ = cheerio.load(response.data);

        //웹툰 정보
        const $comicInfo = $('#content > div.comicinfo');

        //썸네일
        const $toonThumbnail = $($comicInfo).find('div.thumb > a > img');
        let toonTitle = $($toonThumbnail[0]).attr('title');
        let toonThumbnailSrc = $($toonThumbnail[0]).attr('src');
        toonEpisodeList.title = toonTitle;
        toonEpisodeList.thumbnailSrc = toonThumbnailSrc;
        
        //작가명
        const $toonWritterName = $($comicInfo).find('div.detail > h2 > span.wrt_nm');
        let toonWritterName = $toonWritterName.text().replace(/(\r\n|\n|\r|\t)/gm, "");
        toonEpisodeList.writterName = toonWritterName;

        //웹툰 설명
        const $toonDescription = $($comicInfo).find('div.detail > p');
        let toonDescription = $($toonDescription[0]).text();
        toonEpisodeList.Description = toonDescription;

        //웹툰 장르
        const $toonGenre = $($toonDescription[1]).find('span.genre');
        let toonGenre = $toonGenre.text().split(',');
        toonEpisodeList.Genre = toonGenre;

        //이용가
        const $toonAge = $($toonDescription[1]).find('span.age');
        let toonAge = $toonAge.text().substring(0,2);
        toonEpisodeList.Age = toonAge;

        // 좋아요 스크래핑 실패.... 추후 추가해야 함 Geonpoint
        // //좋아요  #content > div.comicinfo > div.detail > ul > li:nth-child(5) > div > a > em
        // const $likes = $('');
        // console.log($($likes).html());


        //현제 페이지 에피소드 갯수
        const $episodes = $('#content > table > tbody > tr');
        
        
        //총 에피소드 갯수 : 마지막 페이지 번호로 유추함....
        const $href = $($episodes).find('td.title > a');
        let href = new URL(comicURL+$($href[0]).attr('href'));
        toonEpisodeList.numOfEpisode = Number(href.searchParams.get('no'));

        const titleID = Number(href.searchParams.get('titleId'));
        toonEpisodeList.titleId = titleID;


        /*
            ============== WebToon INFO END ==============
            await 문법을 이용해서 for loop 시 동기적으로 처리되도록 함.
            그렇게 하지 않으면 for loop로 모든 pageEpisodeList가 힙 영역으로 넘어간 후
            가장 빨리 처리되는 순서로 return 되기에 회차 순서가 꼬임.
        */
        //페이지 개수만큼 for Loop
        for(let idx = 0;idx<toonEpisodeList.numOfEpisode/10;idx++) {
            // console.log("전체 : " + toonEpisodeList.numOfEpisode + " / 현재 : " + idx);
            const eachPageURL = new URL( toonBaseURL + '&page='+(idx+1) );

            // console.log("eachPageURL : " + eachPageURL.href);
            const A = await pageEpisodeList(eachPageURL.href);

            // console.log(A);
            for(let jdx = 0;jdx<A.length;jdx++) {
                toonEpisodeList.episodeList.push(A[jdx]);
            }
        }

        //MakeJSON
        const JSON_toonEpisodeList = JSON.stringify(toonEpisodeList);
        fs.writeFileSync('./JS/JSON/Toons/'+titleID+'.json',JSON_toonEpisodeList);
    })
    .catch(function(error) {
        console.log(error);
    })
    .then(function() {

    });
}

module.exports = {
    toonInfo,
}

toonInfo(baseURL);