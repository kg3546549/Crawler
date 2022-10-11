const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const comicURL = 'https://comic.naver.com';
const baseURL = 'https://comic.naver.com/webtoon/list?titleId=752350';
const baseURL1 = 'https://comic.naver.com/webtoon/list?titleId=784886';




async function pageEpisodeList(EpisodesPageURL, param_episodeList) {

    return new Promise(function(resolve,reject) {
        axios.get(EpisodesPageURL)
        .then(function(response) {
            const $ = cheerio.load(response.data);
            // console.log(EpisodesPageURL);
            //웹툰 정보
            const $comicInfo = $('#content > div.comicinfo');
            const $not_episodes = $('#content > table > tbody > tr.band_banner');
            const $episodes = $('#content > table > tbody > tr');
            
            let EpisodeList = [];
            let startIdx = 0;
            // console.log('$not_episodes.length : '+ ($not_episodes.length));
            // console.log('$episodes.length : '+ ($episodes.length - $not_episodes.length));
            if($not_episodes.length != 0) startIdx = 1;
            // console.log(startIdx);
            for(let idx=0;idx<$episodes.length-$not_episodes.length;idx++) {
                // console.log('idx : '+idx);
                //회차별 정보
                const $href = $($episodes).find('td.title > a');
                let href = comicURL+$($href[idx]).attr('href');
                
                
                //Thumbnail
                const $thumbnail = $($episodes).find('td > a > img');
                let episodeTitle = $($thumbnail[idx+startIdx]).attr('title');
                let thumbnailSrc = $($thumbnail[idx+startIdx]).attr('src');

                // console.log('   '+episodeTitle);  //회차 제목
                // console.log('   '+href);
                // console.log('   '+thumbnailSrc);    //썸네일 주소

                //별점
                const $episodeGrade = $($episodes).find('td > div.rating_type > strong');
                let episodeGrade = $($episodeGrade[idx]).text()

                // console.log(episodeGrade);  //회차 별점

                //등록일
                const $episodeDate = $($episodes).find('td.num');
                let episodeDate = $($episodeDate[idx]).text();
                // console.log(episodeDate);  //등록일

                let episodeObj = {
                    title : episodeTitle,
                    href : href,
                    thumbnailSrc : thumbnailSrc,
                    grade : episodeGrade,
                    date : episodeDate,
                }
                EpisodeList.push(episodeObj);
                // param_episodeList.episodeList.push(episodeObj);
            }
            resolve(EpisodeList);

        })
        .catch(function(error) {
            console.log(error);
        })
        .then(function() {

        });
    });
    
}




function toonInfo(toonBaseURL) {
    let toonEpisodeList = {
        baseURL : baseURL,
        numOfEpisode : 0,
        title : '',
        thumbnailSrc : '',
        writterName : '',
        Description : '',
        Genre : [],
        Age : '',
    
        episodeList : [],
    };

    axios.get(toonBaseURL)
    .then(async function(response) {
        const $ = cheerio.load(response.data);

        //웹툰 정보
        const $comicInfo = $('#content > div.comicinfo');

        //썸네일
        const $toonThumbnail = $($comicInfo).find('div.thumb > a > img');
        let toonTitle = $($toonThumbnail[0]).attr('title');
        let toonThumbnailSrc = $($toonThumbnail[0]).attr('src');
        toonEpisodeList.title = toonTitle;
        toonEpisodeList.thumbnailSrc = toonThumbnailSrc;
        // console.log(toonTitle);  //웹툰 제목
        // console.log(toonThumbnailSrc);  //썸네일 이미지 Src
        
        //작가명
        const $toonWritterName = $($comicInfo).find('div.detail > h2 > span.wrt_nm');
        let toonWritterName = $toonWritterName.text().replace(/(\r\n|\n|\r|\t)/gm, "");
        toonEpisodeList.writterName = toonWritterName;
        // console.log(toonWritterName);

        //웹툰 설명
        const $toonDescription = $($comicInfo).find('div.detail > p');
        let toonDescription = $($toonDescription[0]).text();
        toonEpisodeList.Description = toonDescription;
        // console.log(toonDescription);

        //웹툰 장르
        const $toonGenre = $($toonDescription[1]).find('span.genre');
        let toonGenre = $toonGenre.text().split(',');
        toonEpisodeList.Genre = toonGenre;
        // console.log(toonGenre);

        //이용가
        const $toonAge = $($toonDescription[1]).find('span.age');
        let toonAge = $toonAge.text().substring(0,2);
        toonEpisodeList.Age = toonAge;
        // console.log(toonAge);

        // //좋아요  #content > div.comicinfo > div.detail > ul > li:nth-child(5) > div > a > em
        // const $likes = $('');
        // console.log($($likes).html());


        //현제 페이지 에피소드 갯수
        const $episodes = $('#content > table > tbody > tr');
        
        // console.log('현재 페이지 에피소드 갯수 : ' + $episodes.length);
        
        //총 에피소드 갯수 : 마지막 페이지 번호로 유추함....
        const $href = $($episodes).find('td.title > a');
        let href = new URL(comicURL+$($href[0]).attr('href'));
        toonEpisodeList.numOfEpisode = Number(href.searchParams.get('no'));
        // console.log(href.searchParams.get('no'));
        // console.log(toonEpisodeList);
        // console.log(toonEpisodeList.numOfEpisode/10);

        /*============== WebToon INFO END ==============*/

        //페이지 개수만큼 for Loop
        for(let idx = 0;idx<toonEpisodeList.numOfEpisode/10;idx++) {
            const eachPageURL = new URL( toonBaseURL + '&page='+(idx+1) );
            // console.log(eachPageURL.href);

            // console.log();
            const A = await pageEpisodeList(eachPageURL.href,toonEpisodeList);
            for(let jdx = 0;jdx<A.length;jdx++) {
                toonEpisodeList.episodeList.push(A[jdx]);
            }

            // console.log('idx : ' + idx);
        }
        // console.log(toonEpisodeList);

        const JSON_toonEpisodeList = JSON.stringify(toonEpisodeList);
        fs.writeFileSync('./JS/JSON/WebToonEpisodeList.json',JSON_toonEpisodeList);

    })
    .catch(function(error) {
        console.log(error);
    })
    .then(function() {

    });
}


toonInfo(baseURL);
