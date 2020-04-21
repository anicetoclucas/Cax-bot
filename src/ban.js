exports.playerBan = async function(message){
    if (!message.guild.member(message.author).hasPermission('BAN_MEMBERS')) {
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
    await memberBan.ban(razãoBan).then(() => {
        let userReslv = message.guild.members.find("id", message.mentions.members.first().id);
        console.log(`Usuário banido: ${memberBan.id}`);
        userReslv.send(`Você foi banido do servidor por: ${razãoBan}`);
        message.reply(memberBan + " foi banido por " + message.author.username + " por motivos de: " + razãoBan);
    }).catch(erro => message.reply("Erro ao banir " + memberBan + ".\nCausa do erro: " + erro));
}