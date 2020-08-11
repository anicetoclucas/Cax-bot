const request = require('request');

const url = "https://trace.moe/api/search?url=";

const query = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    id
    coverImage {
      medium
      color
    }
  }
}
`;

exports.recognizeAnime = async function (linkScreenshot, messagehandle){
    request.post(url + linkScreenshot, async (errorRecognition, responseRecognition, bodyRecognition) => {
        if (errorRecognition)
            return console.error('Request recognition failed:', error);
        if (responseRecognition.statusCode != 200) {
            return ":exclamation: Não foi possivel encontrar o anime.";
        }
        const res = JSON.parse(bodyRecognition);
        const resDoc = res.docs[0];
        const animeId = {
            id: resDoc.anilist_id
        };
        request.post({
            url: 'https://graphql.anilist.co',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: animeId
            })
        }, async (error, response, body) => {
            if (error)
                return console.error('Request Anilist failed:', error);
            if (response.statusCode != 200) {
                return ":exclamation: Não foi possivel encontrar o anime no Anilist.";
            }
            body = JSON.parse(body);
            embed = {
                "title": (resDoc.is_adult ? ":underage: | " : "") + resDoc.title_romaji,
                "url": `https://anilist.co/anime/${resDoc.anilist_id}`,
                "description": `${resDoc.title_english}\n${resDoc.title_native}`,
                "color": parseInt((body["data"]["Media"]["coverImage"]["color"]).substr(1), 16),
                "thumbnail": {
                    "url": body.data.Media.coverImage.medium
                },
                "fields": [
                    {
                        "name": "Episódio",
                        "value": resDoc.episode,
                        "inline": true
                    },
                    {
                        "name": "Tempo",
                        "value": `\`${new Date(parseInt(resDoc.at) * 1000).toISOString().substr(11, 8)}\``,
                        "inline": true
                    }
                ],
                "footer": {
                    "text": `Precisão: ${(resDoc.similarity * 100).toFixed(2)}% | Usos restantes: ${res.quota} - reseta em ${new Date((res.quota_ttl) * 1000).toISOString().substr(11, 8)}`
                }
            };
            messagehandle.reply({embed});
        });
    });
};