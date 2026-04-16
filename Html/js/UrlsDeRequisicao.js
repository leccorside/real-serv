var UrlWsRequisicao = '';
 

function RetornaUrlProducao() {
   UrlWsRequisicao = 'http://sistema.gruporealserv.com.br/ApiIntegracao/'; 
}

function RetornaUrlHomologacao() {
    UrlWsRequisicao = 'http://localhost:52327/ApiIntegracao/';
}

(function () {
    //RetornaUrlHomologacao();
    RetornaUrlProducao();
})();