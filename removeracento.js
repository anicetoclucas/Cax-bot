/**
 * Remove acentos de caracteres
 * @param  {String} stringComAcento [string que contem os acentos]
 * @return {String}                 [string sem acentos]
 */

module.exports = {
    remover: function (newStringComAcento) {
        var string = newStringComAcento;
        var mapaAcentosHex = {
            a: /[\xE0-\xE6]/gi,
            e: /[\xE8-\xEB]/gi,
            i: /[\xEC-\xEF]/gi,
            o: /[\xF2-\xF6]/gi,
            u: /[\xF9-\xFC]/gi,
            c: /\xE7/gi,
            n: /\xF1/gi,
            '': /[-,.]/g
        };
    
        for (var letra in mapaAcentosHex) {
            var expressaoRegular = mapaAcentosHex[letra];
            string = string.replace(expressaoRegular, letra);
        }
    
        return string;
    }
}