const Jimp = require('jimp');

async function espelho(inputMsg) {
    return new Promise((resolve, reject)=> {
        Jimp.read(inputMsg, async (err, imagem) => {
            if (err) throw reject(err);
            let imagem2 = imagem.clone();
            imagem2.crop(imagem.getWidth() / 2,0,imagem.getWidth()/2, imagem.getHeight());
            imagem.composite(imagem2.mirror(true, false), 0, 0);
            imagem.write('temp_ojjo.png');
            resolve('temp_ojjo.png');
        });
    });
}

exports.ojjo = espelho
