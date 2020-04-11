exports.randomNickname = async function () {
    let url_adjetivos = 'https://raw.githubusercontent.com/dariusk/corpora/master/data/words/adjs.json';
    let url_animais = 'https://gist.githubusercontent.com/borlaym/585e2e09dd6abd9b0d0a/raw/6e46db8f5c27cb18fd1dfa50c7c921a0fbacbad0/animals.json';
    let response_adj = (await (await fetch(url_adjetivos)).json())["adjs"];
    let response_animais = (await (await fetch(url_animais)).json());

    var nick = `${response_adj[Math.floor((Math.random() * response_adj.length) + 1)]}${response_animais[Math.floor((Math.random()* response_animais.length)+1)]}`;
    return(`${nick.charAt(0).toUpperCase()}${nick.substring(1)}`);
}