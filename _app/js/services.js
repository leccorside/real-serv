//RegistroPontoLista
//http://177.70.22.132/testefortuna/ApiIntegracao/RegistroPontoLista/?re=r124

//RegistroPontoRegistrar
//http://177.70.22.132/testefortuna/ApiIntegracao/RegistroPontoRegistrar/?re=r124&contrasenha=1089&tiporegistro=PontoInicio&observacao=Teste

//PostosDeServicosListar
//http://177.70.22.132/testefortuna/ApiIntegracao/PostosDeServicosListar/11

//SupervisaoListar
//http://177.70.22.132/testefortuna/ApiIntegracao/SupervisaoListar/73

//alterado de: urlBase : 'http://177.70.22.132/testefortuna/ApiIntegracao/',

//para: http://gruporealserv.web7600.kinghost.net/sistema/ApiIntegracao/

var config = {
    apiEmpresaId: 11,
    localTokenKey:  'tkrealserv',
	urlBase : 'http://sistema.gruporealserv.com.br/ApiIntegracao/',
	apiLogin : 'Login',
    apiPontoLista: 'RegistroPontoLista',
    apiPontoRegistra: 'RegistroPontoRegistrar',
    apiPostosDeServicosListar: 'PostosDeServicosListar',
    apiSupervisaoListar: 'SupervisaoListar',
    apiSupervisaoCarregar: 'SupervisaoCarregar',
    apiSupervisaoCadastrar: 'SupervisaoCadastrar'
    
}


angular.module('services',[])


