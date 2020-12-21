const Jimp = require('jimp');

const maxWidth = 210;
const maxHeight = 75;

async function changeMyMind(stringMsg) {
    return new Promise((resolve, reject)=> {
        Jimp.read('./src/img/change_my_mind.jpg', async (err, imagem) => {
            if (err) throw reject(err);

            const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
            
            if(Jimp.measureText(font, stringMsg)>maxWidth){
                const ratioWH = Jimp.measureText(font, stringMsg)/maxWidth;
                if (ratioWH>5){
                    reject('mensagem muito grande');
                }
            }

            let textImg = new Jimp(maxWidth,maxHeight);
            textImg.print(
                font, 0, 0,
                {
                    text: stringMsg,
                    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
                },
                maxWidth, maxHeight
            );
            textImg.scaleToFit(maxWidth, maxHeight);
            textImg.rotate(7);
            imagem.composite(textImg, 210, 210);
            imagem.write('./src/img/temp_changeMyMind.png');
            resolve('./src/img/temp_changeMyMind.png');
        });
    });
}

exports.changeMyMind = changeMyMind
