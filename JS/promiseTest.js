/*

function getData(data) {
    return new Promise(function(resolve,reject) {
        data+=100;
        resolve(data,data-100);
    });
}

getData(100).then(function(data,originalData){
    console.log(data);
    console.log(originalData);
});

*/

async function getData(data) {
    return data + 110;
}

async function main() {
    let test = await getData(100);
    console.log(test);
}

main();