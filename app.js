function trocarAba(nome) {
    document.querySelectorAll('.aba').forEach(el => el.classList.remove('ativa'));
    document.querySelectorAll('aside div').forEach(el => el.classList.remove('ativo'));

    const abaAlvo = document.getElementById('aba-' + nome);
    const menuAlvo = document.getElementById('menu-' + nome);

    if (abaAlvo) abaAlvo.classList.add('ativa');
    if (menuAlvo) menuAlvo.classList.add('ativo');
}
