const wikipedia = require("node-wikipedia");

exports.searchWiki = function (args, message) {
    if (args[1] == "imagem") {
        args.splice(0, 2);
        let ans = args.join(" ");
        wikipedia.page.image(ans, function (response) {
            if (response) {
                message.channel.send("http:" + response);
            } else {
                message.channel.send("Não foi possivel encontrar uma imagem").then(msg => msg.delete(5000));
            }
        });
    } else {
        args.shift();
        let ans = args.join("%20");
        url = `https://pt.wikipedia.org/w/api.php?action=opensearch&format=json&search=${ans}`;
        fetch(url).then(response => {
            return response.json();
        }).then(data => {
            const embed = {
                "title": data[1][0],
                "description": data[2][0],
                "url": data[3][0],
                "color": 8487297,
                "author": {
                    "name": "Wikipédia",
                    "url": data[3][0],
                    "icon_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/60px-Wikipedia-logo-v2.svg.png"
                }
            };
            message.reply({
                embed
            });
        }).catch(err => {
            console.log(err);
        });
    }
}