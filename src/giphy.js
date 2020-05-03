const GphApiClient = require('giphy-js-sdk-core');
const cfg = require('../config.json');
Giphy = GphApiClient(cfg.tokenGiphy);

exports.giphy = {
    search: async function(searchGif){
        let resposta = null;
        await Giphy.search('gifs', {
            "q": searchGif,
            "limit": 1,
            "rating": "r",
            "lang": "pt",
            "sort": "relevant"
        })
        .then((gifObject)=>{
            if (gifObject.pagination.count) {
                resposta = gifObject.data[0].bitly_gif_url;
            } else {
                throw "```Não foi possível encontrar um resultado para essa pesquisa.```";
            }
        })
        return resposta;
    },
    random: async function(searchGif){
        let resposta = null;
        await Giphy.random('gifs', {
            "tag": searchGif,
            "rating": "r"
        })
        .then(async (gifObject) =>  {
            if (gifObject.data.images.id) {
                await Giphy.gifByID(gifObject.data.images.id)
                    .then((ansID) => {
                        resposta = ansID.data.bitly_gif_url;
                    });
            } else {
                throw "```Não foi possível encontrar um resultado para essa pesquisa.```";
            }
        })
        return resposta;
    } 
}