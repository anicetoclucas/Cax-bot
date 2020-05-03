const fs = require('fs');
const JSON = require('circular-json');
module.exports = {
    salvarFile: function(caminho, arquivo){
        arquivoOpen = JSON.stringify(arquivo, null, 2);
        fs.writeFile(caminho, arquivoOpen, function(err){
            if(err) return console.log("Erro ao gravar o arquivo.",err);
        });
        console.log("Arquivo "+arquivo+" salvo em: "+caminho+".");
    },
    salvarDB: function(client, origem, destino){
        client.collection(destino).replaceOne({},origem);
    }
}