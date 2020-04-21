exports.playerKick = async function(message){
    if (!message.guild.member(message.author).hasPermission('KICK_MEMBERS')) {
        message.reply("Seu cargo não te dá permissão para kickar alguém.");
        return;
    }
    let memberKick = message.mentions.members.first();
    if (!memberKick) {
        message.reply(memberKick + " não é um usuário desse servidor.");
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
    await memberKick.kick(razãoKick).then(() => {
        let userReslv = message.guild.members.find("id", message.mentions.members.first().id);
        console.log(`Usuário kickado: ${memberKick.id}`);
        userReslv.send(`Você foi kickado do servidor por: ${razãoKick}`);
        message.reply(memberKick + " foi kickado por " + message.author.username + " por motivos de: " + razãoKick);
    }).catch(erro => message.reply("Erro ao kickar " + memberKick + ".\nCausa do erro: " + erro));
}