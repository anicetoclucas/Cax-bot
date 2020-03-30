const Discord = require('discord.js');
const cfg = require('./config.json');
const ytdl = require('ytdl-core');
const YouTube = require('youtube-node');
const mongodb = require('mongodb');
const GphApiClient = require('giphy-js-sdk-core');
const leet = require('leet');
const wikipedia = require("node-wikipedia");
const https = require('https');
const xmlconvert = require('xml-js');
const fs = require('fs');
const request = require('request');
const Imgur = require('imgur');

//Calendário
const meses = require('./src/meses');
const semanas = require('./src/semanas');

//Variáveis Globais
var dbOk = 0;
var emoteList = new Array();
var chanceReact = 8; //chance = valor^-1
var chanceAudio = 100; //chance = valor^-1
var servidor = "RussosSuados"; //Servidor princial //TODO: separar os arquivos de DEV com os arquivos do github
// var servidor = "Bot test";       //Servidor de teste
var fusohorario = -3;
var jaTocando = false;
var jaAudioLoop = false;
var jaDiaAudio = false;
var jaHoraManhaAudio = false;
var jaHoraZeroAudio = false;

//Máscaras
const eventMask = { //event mask for use in calendar
    "timestamp":null,
    "mensagem":null
};

//Função Sleep
function esperar(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

//Carregar arquivos locais
var musicCfg = require(cfg.caminhoConfigMusic);
var HelpList = require(cfg.caminhoHelpList);
const salvarJSON = require(cfg.caminhoFunçãoSalvarJSON);
const remAcento = require(cfg.caminhoRemAcento);

//MongoDB
var MongoClient = mongodb.MongoClient;
const url_DB = cfg.tokenDB;
MongoClient.connect(url_DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(async conn  =>  {
        client_db = conn.db('cax_discord_bot');
        console.log("Conexão com MongoDB realizada com sucesso.");
        rankingFile = await client_db.collection(cfg.dbRanking).findOne();
        ResponseList = await client_db.collection(cfg.dbAutoResposta).findOne();
        BlackList = await client_db.collection(cfg.dbBlackList).findOne();
        playlists = await client_db.collection(cfg.dbPlaylists).findOne();
        audiosAleatorios = await client_db.collection(cfg.dbAudiosAleatorios).findOne();
        eventos = await client_db.collection(cfg.dbEventos).findOne();
        botActivities = await client_db.collection(cfg.dbbotActivities).findOne();
        msgsOn = await client_db.collection(cfg.dbmsgOn).findOne();
        dbOk = 1 //server running successfully
    })
    .catch(err => {
        console.log(`Erro ao conectar o MongoClient. [ ${err}]`);
        dbOk = 2; //connection server error
    });

//Giphy
giphy = GphApiClient(cfg.tokenGiphy);

//Imgur
Imgur.setClientId(cfg.tokenImgur);
Imgur.setAPIUrl('https://api.imgur.com/3/');

//Variáveis auxiliares
var auxiliarAlgum = false;
var auxiliarAddAutoresposta = false;
var auxiliarRemAutoresposta = false;
var auxiliarVotação = false;
var auxiliarEvento = false;
var lastResponseList = "";
var contadorVote = {};
var fraseVote = null;
var playlistChoice = null;

//Youtube
var youTube = new YouTube();

youTube.setKey(cfg.tokenYT);

//Functions
function uploadGiphy(postData) {
    var options = {
        url: 'https://upload.giphy.com/v1/gifs?api_key=' + cfg.tokenGiphy,
        formData: postData,
        json: true
    };
    console.log('Uploading gif to Giphy');
    const p = new Promise((resolve, reject) => {
        request.post(options, function (e, resp, body) {
            if (e || resp.statusCode !== 200) reject(`Status code: ${resp.statusCode}\nError message: ${resp.body.meta.msg}`);
            resolve('https://media.giphy.com/media/' + body.data.id + '/giphy.jpg');
        });
    });
    return p;
}

async function botStatus() { //change bot status
    let arrayActivities = botActivities.activities;
    while (true) {
        let rand = Math.floor(Math.random() * (arrayActivities.length + 1));
        if (arrayActivities[rand]["url"]) {
            bot.user.setActivity(arrayActivities[rand]["activity"], {
                "type": arrayActivities[rand]["type"],
                "url": arrayActivities[rand]["url"],
            });
        } else {
            bot.user.setActivity(arrayActivities[rand]["activity"], {
                "type": arrayActivities[rand]["type"]
            });
        }
        await esperar(600000);
    }
}

async function checkEvent(text) { //check if a event exist in that time
    while (true) {
        let Now = new Date();
        Now.setSeconds(0, 0);
        if (eventos[Now.getTime()]) {
            embed = {
                "title": "Lembrete",
                "description": eventos[Now.getTime()],
                "color": 16711685,
                "author": {
                    "name": "Cax",
                    "icon_url": "https://cdn.discordapp.com/app-icons/487992303298805761/84f9701521f87e6edd46fd15e4f30c77.png"
                }
            };
            text.send("@everyone", {embed});
            delete eventos[Now.getTime()];
            salvarJSON.salvarDB(client_db, eventos, cfg.dbEventos);
        }
        await esperar(60000);
    }
}

//Discord Bot
const bot = new Discord.Client();
bot.login(cfg.token); //Token do bot

//Inicial bot state 
bot.on('ready', async () => {
    while (dbOk == 0) { //DB not ready yet
        console.log("Esperando a resposta do banco de dados.");
        console.log("Reiniciando em 5 segundos...");
        await esperar(5000);
    }
    if (dbOk == 1) { //Normal inicialization on DB
        var textChannel = bot.channels.get(cfg.textChannel);

        let rand = Math.floor(Math.random() * (msgsOn["msgs"].length + 1));
        textChannel.send(msgsOn["msgs"][rand]);

        console.log("Banco de dados executado com sucesso.");
        console.log('Logado como: ' + bot.user.tag + '!');
        
        var data = new Date();
        
        console.log("===Horário===");
        console.log("Ano: " + data.getUTCFullYear());
        console.log("Mes: " + meses[data.getUTCMonth()]);
        console.log("Dia: " + data.getUTCDate());
        console.log("Semana: " + semanas[data.getUTCDay()]);
        if((data.getUTCHours() + fusohorario)<0){
            newhour = 24+(data.getUTCHours() + fusohorario)
        }else{
            newhour = (data.getUTCHours() + fusohorario)
        }
        console.log("Hora: " + newhour + ":" + data.getUTCMinutes() + ":" + data.getUTCSeconds());

        emoteList = bot.guilds.find(coll => coll.name == servidor).emojis.map(e => e.id);
        
        //Continuos functions
        botStatus();
        checkEvent(textChannel);
        
    } else if (dbOk == 2) { //Error on DB inicialization
        console.log("Erro ao iniciar o bot.");
        var textChannel = bot.channels.get(cfg.textChannel);
        textChannel.send(`Erro ao iniciar o bot.`);
        client_db.close();
    }
});

//Bot removed from a server
bot.on("guildDelete", guild => {
    console.log("O bot foi removido do servidor: " + guild.name + " (id: " + guild.id + ").");
});

//New member on server
bot.on('guildMemberAdd', member => {
    console.log("Novo Usuário: " + member + " - ID: " + member.id);
    rankingFile[member.id] = {
        'Points': 0
    };
    const channel = member.guild.channels.find(ch => ch.name == cfg.canalLogNovosMembros);
    if (!channel) {
        console.log("Canal de 'boas vindas' não existe.");
        return;
    }
    channel.send("Bem vindo ao esgoto do Discord, " + member.user + ". \nEsteja avisado que tudo o que você verá aqui é o mais puro **ódio**, **preconceito** e **niilismo** que já existiu. Mas você entrou assim mesmo. \n\nEntão, @everyone, deem os \"meus pêsames\" para " + member + ".\nhttps://i.imgur.com/2WPnTN1.png");
    salvarJSON.salvarDB(client_db, rankingFile, cfg.dbRanking);
})

//New message typed on text channel
bot.on('message', async message => {
    if (message.author.bot) return; //Ignore msg from bots

    if (auxiliarAddAutoresposta || auxiliarRemAutoresposta || auxiliarVotação || auxiliarEvento) { //check if some auxiliary was changed
        auxiliarAlgum = true;
    } else {
        auxiliarAlgum = false;
    }

    if (!rankingFile[message.author.id]) { //Add people to list of points already on server before bot enters
        rankingFile[message.author.id] = {
            'Points': 0
        };
    }

    //Bot reactions
    reactRand = Math.floor(Math.random() * chanceReact);
    if (reactRand == 0) {
        message.react(emoteList[Math.floor(Math.random() * emoteList.length)]);
    }

    rankingFile[message.author.id]['Points'] = rankingFile[message.author.id]['Points'] + 1;

    if (message.content.startsWith(cfg.prefix) || auxiliarAlgum) { //Commands w/ prefix
        messageClear = message.content.substr(1).toLowerCase(); //Remove prefix of string
        //Help
        if (messageClear.startsWith("help") || messageClear.startsWith("meajudajesus")) {
            if (messageClear.startsWith("help")) {
                var args = messageClear.substr(5);
            } else {
                var args = messageClear.substr(13);
            }
            if (!args) {
                let helps = Object.keys(HelpList);
                let helpsString = "**Lista de comandos:**\n";
                for (i = 0; i < helps.length; i++) {
                    if (i < (helps.length - 1)) {
                        helpsString = helpsString + "`" + helps[i] + "`, ";
                    } else {
                        helpsString = helpsString + "`" + helps[i] + "`.";
                    }
                }
                message.channel.send(helpsString);
                return;
            }
            if (HelpList[args]) {
                message.channel.send(HelpList[args]);
                return;
            }
        }
        //Add auto-resposta
        else if (messageClear.startsWith("addresposta") || auxiliarAddAutoresposta) {
            let args = message.content.substr(13).toLocaleLowerCase();
            if (ResponseList[remAcento.remover(args)] && !auxiliarAddAutoresposta) { //se a resposta já existe
                console.log(`Um novo request de auto-resposta iniciado por [${message.author.username}].`);
                lastResponseList = remAcento.remover(args.toLowerCase());
                auxiliarAddAutoresposta = true;
                message.channel.send(`Já existe uma auto-resposta para ${lastResponseList}.\nQual a nova resposta?`)
                    .then(msg => msg.delete(5000));
                message.delete(5000);
                return;
            } else if (args == "" && !auxiliarAddAutoresposta) { //se a resposta foi digitada
                message.reply("você digitou o comando errado, vai ser burro na cabeça do meu pau!\nA sintaxe correta é: " + cfg.prefix + "resposta [resposta]");
                return;
            }
            if (message.content.toLowerCase() == "cancelar" && auxiliarAddAutoresposta) { //cancelar adição de resposta
                message.reply("adição de resposta cancelada. :sweat_smile:");
                console.log(`Adição de resposta para [${lastResponseList}] cancelada por [${message.author.username}]`);
                lastResponseList = "";
                auxiliarAddAutoresposta = false;
                return;
            }
            if (!auxiliarAddAutoresposta) { //define a PERGUNTA
                console.log(`Um novo request de auto-resposta iniciado por [${message.author.username}].`);
                lastResponseList = remAcento.remover(args.toLowerCase());
                ResponseList[lastResponseList] = [null];
                auxiliarAddAutoresposta = true;
                message.channel.send("Qual a resposta para '" + lastResponseList + "'?")
                    .then(msg => msg.delete(5000));
                message.delete(5000);
            } else { //define a RESPOSTA
                if (ResponseList[lastResponseList][0] != null) {
                    ResponseList[lastResponseList].push(message.content);
                    message.reply("nova resposta para '" + lastResponseList + "' foi adicionado como: " + message.content + ". :kissing_heart:")
                        .then(msg => msg.delete(5000));
                    message.delete(5000);
                    console.log(`Nova auto-resposta adicionada para [${lastResponseList}] como [${message.content}] por [${message.author.username}].`);
                    salvarJSON.salvarDB(client_db, ResponseList, cfg.dbAutoResposta);
                    lastResponseList = "";
                    auxiliarAddAutoresposta = false;
                } else {
                    ResponseList[lastResponseList][0] = message.content;
                    message.reply("sua resposta para '" + lastResponseList + "' foi adicionado como: " + message.content + ". :kissing_heart:")
                        .then(msg => msg.delete(5000));
                    message.delete(5000);
                    console.log(`Nova auto-resposta adicionada para [${lastResponseList}] como [${message.content}] por [${message.author.username}].`);
                    salvarJSON.salvarDB(client_db, ResponseList, cfg.dbAutoResposta);
                    lastResponseList = "";
                    auxiliarAddAutoresposta = false;
                }
            }
            rankingFile[message.author.id]['Points'] = (rankingFile[message.author.id]['Points'] + 3);
            salvarJSON.salvarDB(client_db, rankingFile, cfg.dbRanking);
            return;
        }
        //Remove auto-resposta
        else if (messageClear.startsWith("remresposta") || auxiliarRemAutoresposta) {
            let argsAux = message.content.split(/ +/);
            argsAux.shift();
            argsAux = argsAux.join(" ");
            argsAux = remAcento.remover(argsAux.toLowerCase());
            if (ResponseList[argsAux] || auxiliarRemAutoresposta) { //Se existe a auto-resposta
                if (!auxiliarRemAutoresposta) { //Inicio do request de remoção || auxuliarRemAutorespsota == false
                    var msgstring = "";
                    msgstring = `Remover uma resposta para \`${argsAux}\`:\n`;
                    for (i = 0; i < Object.keys(ResponseList[argsAux]).length; i++) {
                        msgstring += `      [${i+1}] - \`${ResponseList[argsAux][i]}\`\n`;
                    }
                    msgstring += `      [0] - \`Cancelar\`\n`;
                    msgstring += `Selecione uma resposta:`;
                    adrMsgString = await message.channel.send(msgstring);
                    message.delete(1000);
                    auxiliarRemAutoresposta = true;
                    lastResponseList = argsAux;
                } else { //Escolha da resposta || auxuliarRemAutorespsota == true
                    args = message.content;
                    if (args == 0) { //Se [0] - Cancelar
                        message.reply("adição de resposta cancelada. :sweat_smile:").then(msg => msg.delete(5000));
                        console.log(`Remoção de resposta para [${lastResponseList}] cancelada por [${message.author.username}]`);
                        lastResponseList = "";
                        auxiliarRemAutoresposta = false;
                        message.channel.fetchMessage(adrMsgString.id).then(msg => msg.delete(1000));
                        message.delete(1000);
                        return;
                    } else if (!isFinite(args)) { //Se não for um numero inteiro
                        message.reply(`você digitou o comando errado.\nApenas numeros são aceitos.`).then(msg => msg.delete(5000));
                        message.delete(5000);
                        return;
                    } else if ((args < 0) || (args < Object.keys(ResponseList[lastResponseList]).length)) { //Se for menor que zero ou maior que o tamanho da string de auto-resposta
                        message.reply(`você digitou o comando errado.\nApenas os número da opção são aceitos.`).then(msg => msg.delete(5000));
                        message.delete(1000);
                        return;
                    } else { //Remoção da auto-resposta
                        if (Object.keys(ResponseList[lastResponseList]).length > 1) {
                            console.log(`Remoção da resposta [${ResponseList[lastResponseList][args-1]}] para [${lastResponseList}] concluida com sucesso por [${message.author.username}].`);
                            ResponseList[lastResponseList].splice(args - 1, 1);
                        } else if (Object.keys(ResponseList[lastResponseList]).length == 1) {
                            console.log(`Remoção da única resposta [${ResponseList[lastResponseList]}] para [${lastResponseList}] concluida com sucesso por [${message.author.username}].`);
                            delete ResponseList[lastResponseList];
                        }
                        message.reply(`auto-resposta deletada.`).then(msg => msg.delete(5000));
                        salvarJSON.salvarDB(client_db, ResponseList, cfg.dbAutoResposta);
                        lastResponseList = "";
                        auxiliarRemAutoresposta = false;
                        message.channel.fetchMessage(adrMsgString.id).then(msg => msg.delete(1000));
                        message.delete(1000);
                    }
                }
            } else { //Se não existe a auto-resposta
                let args = message.content.split(/ +/);
                args.shift();
                args = args.join(" ");
                message.reply(`não existe [${args}] na lista de auto-resposta.`).then(msg => msg.delete(5000));
                message.delete(5000);
                return;
            }
        }
        //Mostrar pontos
        else if (messageClear.startsWith("pontos")) {
            message.reply("você tem " + rankingFile[message.author.id]['Points'] + " decepções. :confused:");
            return;
        }
        //Ping
        else if (messageClear.startsWith("ping")) {
            const msgPing = await message.channel.send("Ping? :thinking:");
            msgPing.edit("Pong! :ping_pong:\nLatencia da mensagem: " + (msgPing.createdTimestamp - message.createdTimestamp) + "ms\nLatencia do bot: " + Math.round(bot.ping) + "ms");
            rankingFile[message.author.id]['Points'] = (rankingFile[message.author.id]['Points'] + 1);
            salvarJSON.salvarDB(client_db, rankingFile, cfg.dbRanking);
            return;
        }
        //Apagar mensagens
        else if (messageClear.startsWith("limpar")) {
            if (!message.member.roles.some(r => [cfg.cargoAdm, cfg.cargoMod].includes(r.name))) {
                message.reply("Seu cargo não te dá permissão para limpar o chat.");
                return;
            }
            let args = message.content.slice(cfg.prefix.length).split(/ +/);
            args.shift();
            if (args.length == 0) {
                message.reply("a sintaxe correta do comando é: '" + cfg.prefix + "limpar [numero]'.");
                return;
            }
            if (args.length > 1) {
                message.reply("este comando deve conter apenas um argumento.");
                return;
            } else {
                let qntMsgApagar = parseInt(args[0]) + 1;
                message.channel.fetchMessages({
                    limit: qntMsgApagar
                }).then(messages => message.channel.bulkDelete(messages));
                message.reply("as mensagens foram apagadas :relaxed:")
                    .then(msg => msg.delete(1000));
                console.log(`Foram apagadas ${qntMsgApagar-1} mensagens.`);
                rankingFile[message.author.id]['Points'] = (rankingFile[message.author.id]['Points'] + 2);
                salvarJSON.salvarDB(client_db, rankingFile, cfg.dbRanking);
                return;
            }
        }
        //Kick
        else if (messageClear.startsWith("kick")) {
            if (!message.member.roles.some(r => [cfg.cargoAdm, cfg.cargoMod].includes(r.name))) {
                message.reply("Seu cargo não te dá permissão para kickar alguém.");
                return;
            }
            let memberKick = message.mentions.members.first();
            if (!memberKick) {
                message.reply(memberKick + " não é um usuário desse servidor.")
                return;
            }
            if (!memberKick.kickable) {
                message.reply("você não pode kickar esse usuário. Aparentemente ele é mais importante que você, seu lixo!");
                return;
            }
            let fraseKick = message.content.trim().split(/ +/g);
            fraseKick.shift();
            let razãoKick = fraseKick.slice(1).join(" ");
            if (!razãoKick)
                razãoKick = "Sem nenhuma razão, ou seja, porque eu quis.";
            await memberKick.kick(razãoKick).catch(erro => message.reply("Erro ao kickar " + memberKick + ".\nCausa do erro: " + erro));
            // message.author.send("Você foi kickado por " + message.author.username + " por motivos de: " + razãoKick);
            message.reply(memberKick + " foi kickado por " + message.author.username + " por motivos de: " + razãoKick);
        }
        //Ban
        else if (messageClear.startsWith("ban")) {
            if (!message.member.roles.some(r => [cfg.cargoAdm].includes(r.name))) {
                message.reply("Seu cargo não te dá permissão para banir alguém.");
                return;
            }
            let memberBan = message.mentions.members.first();
            if (!memberBan) {
                message.reply(memberBan + " não é um usuário desse servidor.");
                return;
            }
            if (!memberBan.bannable) {
                message.reply("você não pode banir esse usuário. Aparentemente ele é mais importante que você, seu lixo!");
                return;
            }
            let fraseBan = message.content.trim().split(/ +/g);
            fraseBan.shift();
            let razãoBan = fraseBan.slice(1).join(" ");
            if (!razãoBan)
                razãoBan = "Sem nenhuma razão, ou seja, porque eu quis.";
            await memberBan.ban(razãoBan).catch(erro => message.reply("Erro ao banir " + memberBan + ".\nCausa do erro: " + erro));
            // message.author.send("Você foi banido por " + message.author.username + " por motivos de: " + razãoBan);
            message.reply(memberBan + " foi banido por " + message.author.username + " por motivos de: " + razãoBan);
        }
        //Votação
        else if (messageClear.startsWith("votação") || auxiliarVotação) {
            if (!auxiliarVotação) {
                message.channel.send("A votação iniciou! Digite ``resultado`` para encerrar a votação");
                fraseVote = messageClear.substr(7);
                fraseVote = fraseVote.split(',');
                for (let i = 0; i < fraseVote.length; i++) {
                    if (fraseVote[i].startsWith(" ")) {
                        fraseVote[i] = fraseVote[i].substr(1);
                    }
                    contadorVote[fraseVote[i]] = {
                        'Score': 0
                    };
                }
                auxiliarVotação = true;
                rankingFile[message.author.id]['Points'] = (rankingFile[message.author.id]['Points'] + 2);
            } else if (message.content.startsWith("resultado")) {
                var fraseCompleta = ("Pronto, a votação acabou. Estes são os resultados:\n\n");
                for (let i = 0; i < fraseVote.length; i++) {
                    fraseCompleta = (fraseCompleta + fraseVote[i] + ": " + contadorVote[fraseVote[i]]["Score"] + "\n")
                }
                message.channel.send(fraseCompleta);
                auxiliarVotação = false;
                contadorVote = {};
            } else {
                if (contadorVote[message.content]) {
                    contadorVote[message.content]["Score"]++;
                    message.reply("voto computado.");
                    rankingFile[message.author.id]['Points'] = (rankingFile[message.author.id]['Points'] + 1);
                } else {
                    message.reply("essa opção não existe.");
                }
            }
            salvarJSON.salvarDB(client_db, rankingFile, cfg.dbRanking);
            return;
        }
        //Escolher
        else if (messageClear.startsWith("escolher")) {
            var fraseChoose = messageClear.substr(8);
            fraseChoose = fraseChoose.split(',');
            for (let i = 0; i < fraseChoose.length; i++) {
                if (fraseChoose[i].startsWith(" ")) {
                    fraseChoose[i] = fraseChoose[i].substr(1);
                }
            }
            let aleatório = Math.floor((Math.random() * fraseChoose.length) + 1);
            message.reply("o escolhido foi: " + fraseChoose[aleatório - 1]);
            rankingFile[message.author.id]['Points'] = (rankingFile[message.author.id]['Points'] + 1);
            salvarJSON.salvarDB(client_db, rankingFile, cfg.dbRanking);
            return;
        }
        //BlackList
        else if (messageClear.startsWith("blacklist")) {
            let args = remAcento.remover(message.content.substr(11));
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
            salvarJSON.salvarDB(client_db, BlackList, cfg.dbBlackList);
            rankingFile[message.author.id]['Points'] = (rankingFile[message.author.id]['Points'] + 3);
            salvarJSON.salvarDB(client_db, rankingFile, cfg.dbRanking);
            return;
        }
        //Emotes
        else if (messageClear.startsWith("emotes")) {
            let emoteStr = "Lista de emotes do canal:\n"
            let emojiStrE = message.guild.emojis.map(e => e.toString()).join(" ");
            emoteStr = emoteStr + emojiStrE;
            message.channel.send(emoteStr);
        }
        //Gif
        else if (messageClear.startsWith("gif")) {
            let searchGif = messageClear.substr(4);
            giphy.search('gifs', {
                    "q": searchGif,
                    "limit": 1,
                    "rating": "r",
                    "lang": "pt",
                    "sort": "relevant"
                })
                .then((gifObject) => {
                    if (gifObject.pagination.count) {
                        message.channel.send(gifObject.data[0].bitly_url);
                    } else {
                        message.channel.send("```Não foi possível encontrar um resultado para essa pesquisa.```")
                            .then(msg => {
                                msg.delete(1000);
                                message.delete(1000);
                            });
                    }
                })
                .catch((err) => {
                    console.log("Erro ao carregar Giphy", err);
                })
        }
        //Random Gif
        else if (messageClear.startsWith("randomgif")) {
            let searchGif = messageClear.substr(10);
            giphy.random('gifs', {
                    "tag": searchGif,
                    "rating": "r"
                })
                .then((gifObject) => {
                    if (gifObject.data.images.id) {
                        giphy.gifByID(gifObject.data.images.id)
                            .then((ansID) => {
                                message.channel.send(ansID.data.bitly_url);
                            });
                    } else {
                        message.channel.send("```Não foi possível encontrar um resultado para essa pesquisa.```")
                            .then(msg => {
                                msg.delete(1000);
                                message.delete(1000);
                            });
                    }
                })
                .catch((err) => {
                    console.log("Erro ao carregar Giphy", err);
                })
        }
        //Leet
        else if (messageClear.startsWith("leet")) {
            let textRaw = messageClear.substr(5);
            textConverted = leet.convert(textRaw);
            message.channel.send(textConverted);
        }
        //Wikipédia
        else if (messageClear.startsWith("wiki")) {
            let args = message.content.split(/ +/);
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
                    // console.log(response);
                    return response.json();
                }).then(data => {
                    // console.log(data);
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
                    message.reply({embed});
                }).catch(err => {
                    console.log(err);
                });
            }
        }
        //Converter moedas
        else if (messageClear.startsWith("converter")) {
            let args = message.content.split(/ +/);
            args.shift();
            args[0] = args[0].replace(",", ".");
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
        //Rip
        else if (messageClear.startsWith("rip")) {
            let argsRip = message.content.split(/ +/);
            argsRip.shift();
            argsRip = argsRip.join(" ");
            giphy.random('gifs', {
                "tag": "crying"
            }).then(gifObject => {
                var ripmessage = `Sinto a sua falta, ${argsRip}. Volta logo :cry: \n`;
                if (gifObject.data.images.id) {
                    giphy.gifByID(gifObject.data.images.id).then(ansID => {
                        ripmessage += ansID.data.bitly_url;
                        message.channel.send(ripmessage);
                    })
                }
            })
        }
        //Remover background
        else if (messageClear.startsWith("rembg")) {
            let args = message.content.split(/ +/);
            args.shift();
            args = args.join(" ");
            if (args.startsWith("http") || args.startsWith("www")) {
                request.post({
                    url: 'https://api.remove.bg/v1.0/removebg',
                    formData: {
                        image_url: args,
                        size: 'auto',
                    },
                    headers: {
                        'X-Api-Key': cfg.tokenRemBg
                    },
                    encoding: null
                }, function (error, response, body) {
                    if (error) return console.error('Request remove background failed:', error);
                    if (response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
                    fs.writeFileSync("./no-bg.png", body);
                    message.channel.send(`Aqui está:`, {
                        files: [
                            "./no-bg.png"
                        ]
                    });
                });
            } else {
                var Attachment = (message.attachments).array();
                Attachment.forEach(function (attachment) {
                    request.post({
                        url: 'https://api.remove.bg/v1.0/removebg',
                        formData: {
                            image_url: attachment.url,
                            size: 'auto',
                        },
                        headers: {
                            'X-Api-Key': cfg.tokenRemBg
                        },
                        encoding: null
                    }, function (error, response, body) {
                        if (error) return console.error('Request remove background failed:', error);
                        if (response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
                        fs.writeFileSync("./no-bg.png", body);
                        message.channel.send(`Aqui está:`, {
                            files: [
                                "./no-bg.png"
                            ]
                        });
                    });
                });
            }
        }
        //Upload Giphy
        else if (messageClear.startsWith("upgif")) {
            let args = message.content.split(/ +/);
            args.shift();
            args = args.join(" ");
            if (args.startsWith("http") || args.startsWith("www")) {
                var postData = {
                    api_key: cfg.tokenGiphy,
                    source_image_url: args
                };
                uploadGiphy(postData).then((gifUrl) => {
                    message.reply(gifUrl);
                    console.log('Posted to ' + gifUrl);
                }).catch((err) => {
                    console.log(err);
                    message.channel.send(`Upload error: \n${err}`);
                });
            } else {
                var Attachment = (message.attachments).array();
                Attachment.forEach(function (attachment) {
                    var postData = {
                        api_key: cfg.tokenGiphy,
                        source_image_url: attachment.url
                    };
                    uploadGiphy(postData).then((gifUrl) => {
                        message.reply(gifUrl);
                        console.log('Posted to ' + gifUrl);
                    }).catch((err) => {
                        console.log(err);
                        message.channel.send(`Upload error: \n${err}`);
                    });
                });
            }
        }
        //Contar
        else if (messageClear.startsWith("contar")) {
            let args = messageClear.split(/ +/);
            args.shift();
            args = args[0];
            args = args.split(":");
            if (args.length == 1) { //inseriu apenas os segundos
                var time = {
                    segundos: args[0]
                };
                let msgID = await message.channel.send(`Contagem iniciada de \`${time.segundos} segundos\``);
                while (time.segundos >= 0) {
                    msgID.edit(`Contagem: \`${time.segundos}\``);
                    time.segundos--;
                    await esperar(1000);
                }
                msgID.edit(`Contagem encerrada.`);
                message.channel.send(`Contagem de \`${args[0]} segundos\` encerrada.`)
            } else if (args.length == 2) { //inseriu minutos e segundos
                var time = {
                    minutos: args[0],
                    segundos: args[1]
                }
                let msgID = await message.channel.send(`Contagem iniciada de \`${time.minutos} minutos e ${time.segundos} segundos\``);
                while (time.segundos >= 0 && time.minutos >= 0) {
                    msgID.edit(`Contagem: \`${time.minutos}:${time.segundos}\``);
                    if (time.minutos > 0 && time.segundos == 0) {
                        time.minutos--;
                        time.segundos = 60;
                    }
                    time.segundos--;
                    await esperar(1000);
                }
                msgID.edit(`Contagem encerrada.`);
                message.channel.send(`Contagem de \`${args[0]} minutos e ${args[1]} segundos\` encerrada.`);
            } else if (args.length == 3) { //inseriu horas, minutos e segundos
                var time = {
                    horas: args[0],
                    minutos: args[1],
                    segundos: args[2]
                };
                let msgID = await message.channel.send(`Contagem iniciada de \`${time.horas} horas e ${time.minutos} minutos e ${time.segundos} segundos\``);
                while (time.segundos >= 0 && time.minutos >= 0) {
                    msgID.edit(`Contagem: \`${time.horas}:${time.minutos}:${time.segundos}\``);
                    if (time.horas > 0 && time.minutos == 0 && time.segundos == 0) {
                        time.horas--;
                        time.minutos = 59;
                        time.segundos = 60;
                    }
                    if (time.minutos > 0 && time.segundos == 0) {
                        time.minutos--;
                        time.segundos = 60;
                    }
                    time.segundos--;
                    await esperar(1000);
                }
                msgID.edit(`Contagem encerrada.`);
                message.channel.send(`Contagem de \`${args[0]} horas e ${args[1]} minutos e ${args[2]} segundos\` encerrada.`);

            } else { //Erro: inseriu mais do que 3 argumentos
                message.reply(`só são permitidos horas, minutos e segundos.`)
                return;
            }
        }
        //Add Evento
        else if (messageClear.startsWith("addevento") || auxiliarEvento) {
            if (!auxiliarEvento){ //Inicio do request de adição e auxiliarEvento == false
                eventState = eventMask;
                let argsSplited = message.content.split(/ +/);
                argsSplited.shift();
                let dia = argsSplited.shift();
                let hora = argsSplited[0];
                dia = dia.split("/");
                hora = hora.split(":");
                if(dia.length!=3||hora.length!=2){
                    message.reply(`**erro no formato da data.**\nO único formato aceito é: \`[dd/mm/aaaa] [hh:mm]\``);
                    return;
                }
                let eventDate = new Date(dia[2], dia[1]-1, dia[0], hora[0], hora[1]);
                eventState.timestamp = eventDate.getTime();
                message.delete(1000);
                adrMsgStringEvent = await message.reply(`digite o evento que será lembrado no dia \`${dia[0]}/${dia[1]}/${dia[2]}\` às \`${hora[0]}:${hora[1]}\` :\nDigite \`0\` para cancelar.`);
                auxiliarEvento = true;
                return;
            }else{
                if (message.content != 0){ //Se for uma resposta válida
                    eventState.mensagem = message.content;
                    eventos[eventState.timestamp] = eventState.mensagem;
                    salvarJSON.salvarDB(client_db, eventos, cfg.dbEventos);
                    message.channel.send(`Evento adicionado com sucesso. :3`).then(msg=>msg.delete(5000));
                    rankingFile[message.author.id]['Points'] = (rankingFile[message.author.id]['Points'] + 3);
                    salvarJSON.salvarDB(client_db, rankingFile, cfg.dbRanking);
                }
                adrMsgStringEvent.delete(1000);
                message.delete(1000);
                auxiliarEvento = false;
            }
        }
        //Imgur
        else if (messageClear.startsWith("upimgur")){
            let args = message.content.split(/ +/);
            args.shift();
            args = args.join(" ");
            if (args.startsWith("http") || args.startsWith("www")) {
                Imgur.uploadUrl(args)
                    .then(json => {
                        message.reply(json.data.link);
                    })
                    .catch(err => {
                        message.channel.send(err.message);
                    });
            } else {
                var Attachment = (message.attachments).array();
                Attachment.forEach(function (attachment) {
                    Imgur.uploadUrl(attachment.url)
                    .then(json => {
                        message.reply(json.data.link);
                    })
                    .catch(err => {
                        message.channel.send(err.message);
                    });
                });
            }
        }
        //Lista de Auto Resposta
        else if(messageClear.startsWith("respostas")){
            let resposta = message.content.trim().split(/ +/g);
            resposta.shift();
            resposta = resposta.join(" ");
            resposta = remAcento.remover(resposta.toLowerCase());
            if (!resposta){
                let respostas = Object.keys(ResponseList);
                let charLimit = 1900;
                let msg = "";
                let i=0;
                message.reply(`**Lista de auto-respostas:**`);
                while((respostas.length>=1)&&(respostas[0])){
                    msg = "```";
                    while((msg.length<charLimit)&&(respostas[0])){
                        msg += `${respostas[0]}, `;
                        respostas.shift();
                    }
                    msg = msg.slice(0, msg.length - 2);
                    msg += ".```";
                    message.channel.send(`${msg}`)
                    i++;
                }
            }
            else if(ResponseList[resposta]){
                let msg = `Respostas para **${resposta}**:\n\`\`\``;
                for(i=0;i<ResponseList[resposta].length;i++){
                    msg += `    ${i+1} - ${ResponseList[resposta][i]}\n`;
                }
                msg += `\`\`\``;
                message.channel.send(msg);
            }
            else{
                message.channel.send(`Não existe nenhuma resposta para **${resposta}**.`);
            }
        }
        //Unknown command
        else{
            message.channel.send(`Não existe nenhuma resposta para **${resposta}**.`);
        }
        
    } else { //Sem prefixo
        //Auto-resposta
        if (ResponseList[remAcento.remover(message.content.toLowerCase())]) {
            var random = Math.floor(Math.random() * (ResponseList[remAcento.remover(message.content.toLowerCase())].length - 0) + 0);
            message.channel.send(ResponseList[remAcento.remover(message.content.toLowerCase())][random]);
            rankingFile[message.author.id]['Points']++;
        }
        //BlackList
        if (BlackList[remAcento.remover(message.content.toLowerCase())]) {
            message.delete();
            message.reply("palavra bloqueada! :rage:");
            rankingFile[message.author.id]['Points']--; //tira pontos de quem disse a palavra bloqueada
        }
        salvarJSON.salvarDB(client_db, rankingFile, cfg.dbRanking);
        return;
    }
});

//TODO: Refazer o Player de música (depende do host)
//TODO: Gravar audio do canal
//TODO: add erro 404 para quando não existir um comando com "!" PERDIIIIIIIIIIIIIIIIIII