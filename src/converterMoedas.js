const xmlconvert = require('xml-js');
const https = require('https');

exports.converterMoedas = function (args, message) {
    url = `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`
    var data = '';
    https.get(url, function (res) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
            res.on('data', function (data_) {
                data += data_.toString();
            });
            res.on('end', function () {
                let jsonV = xmlconvert.xml2js(data, {
                    compact: false,
                    spaces: 1
                });
                let jsonVmoedas = jsonV.elements[0].elements[2].elements[0].elements
                let moedas = {};
                for (let i = 0; i < jsonVmoedas.length; i++) {
                    moedas[jsonVmoedas[i].attributes.currency] = jsonVmoedas[i].attributes.rate;
                }
                if (args[1].toLowerCase() === "eur") { //EUR para outras moedas
                    let valor = args[0];
                    valor = (valor * moedas[args[2].toUpperCase()]);
                    message.channel.send("```" + args[1].toUpperCase() + " " + parseFloat(args[0]).toFixed(2) + " = " + args[2].toUpperCase() + " " + valor.toFixed(2) + "```");
                } else if (args[2].toLowerCase() === 'eur') { //Outras moedas para EUR
                    let valor = args[0];
                    valor = (valor * (1 / parseFloat(moedas[args[1].toUpperCase()])));
                    message.channel.send("```" + args[1].toUpperCase() + " " + parseFloat(args[0]).toFixed(2) + " = " + args[2].toUpperCase() + " " + valor.toFixed(2) + "```");
                } else {
                    let valor = args[0];
                    valor = (valor * (1 / parseFloat(moedas[args[1].toUpperCase()]))); //Joga pra EUR
                    valor = (valor * moedas[args[2].toUpperCase()]); //Joga de EUR pra moeda
                    message.channel.send("```" + args[1].toUpperCase() + " " + parseFloat(args[0]).toFixed(2) + " = " + args[2].toUpperCase() + " " + valor.toFixed(2) + "```");
                }
            });
        } else {
            console.log("Erro ao carregar o site de conversão");
            message.reply("Erro ao carregar o banco de dados da conversão de moedas.");
        }
    });
}