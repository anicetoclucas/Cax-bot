const Jimp = require('jimp');

async function espelho(inputMsg) {
    return new Promise((resolve, reject)=> {
        Jimp.read(inputMsg, async (err, imagem) => {
            if (err) throw reject(err);
            let imagem2 = imagem.clone();
            imagem2.crop(0, 0, imagem.getWidth() / 2, imagem.getHeight());
            imagem.composite(imagem2.mirror(true, false), imagem2.getWidth(), 0);
            imagem.write('temp_jooj.png');
            resolve('temp_jooj.png');
        });
    });
}

exports.jooj = espelho

