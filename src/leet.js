const characterMap = {
    'a': '4',
    'b': '8',
    'e': '3',
    'g': '6',
    'l': '1',
    'o': '0',
    's': '5',
    't': '7',
    'æ': '43',
    'ø': '03',
    'å': '44'
};

exports.leet = {
    /**
     * Converte uma string para o código 1337
     *
     * @param stringmsg string Texto a ser convertido
     * @return string
     */
    converter: async function(stringmsg){
        stringmsg = stringmsg.toLowerCase();
        var stringConverted = "";
        for (i=0; i<stringmsg.length; i++){
            if(characterMap[stringmsg[i]]){
                stringConverted += characterMap[stringmsg[i]];
            }else{
                stringConverted += stringmsg[i];
            }
        }
        return stringConverted.toUpperCase();
    }
}
