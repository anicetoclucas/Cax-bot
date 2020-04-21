const cfg = require('../config.json');

exports.addBlacklist = function (BlackList, args, message) {
    if (BlackList[args]) { //se a palavra já existe
        if (!message.member.roles.some(r => [cfg.cargoAdm].includes(r.name))) {
            message.reply("Seu cargo não te dá permissão para desbanir uma palavra.");
            return;
        }
        delete BlackList[args];
        message.reply("essa palavra foi desbanida.");
        console.log("Palavra desbanida: " + args + ". Por: " + message.author.username);
    } else if (args == "") { //se nao for digitado nada
        message.reply("você digitou o comando errado, vai ser burro na cabeça do meu pau!\nA sintaxe correta é: `!blacklist [palavra]`")
        return;
    } else {
        BlackList[args] = "TEJE BANIDO";
        message.reply("palavra adicionada à blacklist.");
        console.log("Nova palavra banida: " + args + ". Por: " + message.author.username);
    }
}