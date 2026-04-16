const ERRMSG_SERVICE_ERROR = 'Msg de erro estatica';

angular.module('controllers', []).controller('NavCtrl', ['$rootScope', '$location', '$scope', '$http', 'AuthService', function ($rootScope, $location, $scope, $http, AuthService) {
        document.addEventListener("deviceready", onDeviceReady, false);

        function onDeviceReady() {
            window.open = cordova.InAppBrowser.open;
        }
        $rootScope.isActive = function (path) {
            return ($location.path() === path);
        }
        
        $rootScope.Logado = function () {
            return AuthService.isAuthenticated();
        }
        
        $rootScope.GotoLink = function (url) {
            if (device.platform === 'Android') {
                cordova.InAppBrowser.open(url, '_blank', 'location=yes');
            } else {
                cordova.InAppBrowser.open(url, '_system', 'location=yes');
            }
        }
        $scope.$on('$routeChangeSuccess', function (event, current) {
            $('#page-content-scroll').animate({
                scrollTop: 0
            }, 0);
        });
}])

    .config(function ($rootScopeProvider) {
        $rootScopeProvider.digestTtl(Infinity);
    })

    .controller('LoginCtrl', ['$scope', '$timeout', '$http', '$location', 'AuthService', 'Utils', function ($scope, $timeout, $http, $location, AuthService, Utils) {
        $(document).ready(customInit());

        var _url = config.urlBase + config.apiLogin;



        $scope.LoginCheck = function () {


            var response = $http({
                    method: 'POST',
                    url: _url,
                    params: {
                        login: $scope.uName,
                        senha: $scope.uPass
                    }
                })
                .then(function (response) {
                    var data = response.data;
                    if (data.codigo != 200) {
                        $scope.error = "erro";
                        $scope.errormsg = data.mensagem;
                    } else {
                        var usuario = data.Objeto;

                        AuthService.login(usuario.UsuarioId + '.' + usuario.UsuarioNome, usuario.UsuarioId)


                        //$location.path("/principal").replace();
                        Utils.routeMe("/principal");


                    }

                }, function (response) {
                    $scope.error = "erro";
                    $scope.errormsg = response.data || 'Request failed';
                });


        }




}])

    .controller('LoadingCtrl', ['$scope', '$timeout', '$location', 'AuthService', function ($scope, $timeout, $location, AuthService) {
        $(document).ready(customInit());
        $timeout(function () {
            $location.path("/principal").replace();
        }, 1000);

    }])

    .controller('LogoffCtrl', ['$scope', '$http', '$location', 'AuthService', function ($scope, $http, $location, AuthService) {
        $(document).ready(customInit());
        AuthService.logout();
}])

    .controller('PrincipalCtrl', ['$scope', 'AuthService', function ($scope, AuthService) {
        $(document).ready(customInit());
        AuthService.verifySession();

}])

    .controller('RegistroPontoCtrl', ['$scope', '$http', '$window', '$location', 'AuthService', function ($scope, $http, $window, $location, AuthService) {
        $(document).ready(customInit());
        //AuthService.verifySession();

        $scope.showFormRe = true;

        $scope.ReCheck = function () {

            $scope.error = "";
            $scope.sucesso = "";

            var _url = config.urlBase + config.apiPontoLista

            console.log(_url);

            var response = $http({
                    method: 'POST',
                    url: _url,
                    params: {
                        re: $scope.uRe,
                    }
                })

                .then(function (response) {
                    var data = response.data;
                    if (data.codigo != 200) {
                        $scope.error = "erro";
                        $scope.errormsg = data.mensagem;
                    } else {
                        $scope.showFormRe = false;
                        var opcoes = data.Objeto;

                        $scope.ListaOpcoes = opcoes;

                        $window.scrollTo(0, 0);

                    }

                }, function (response) {
                    $scope.error = "erro";
                    $scope.errormsg = "Ocorreu um erro ao carregar ao registrar";
                    console.log(response.data);
                });
        }

        $scope.Registrar = function () {

            $scope.error = "";
            $scope.sucesso = "";

            var _url = config.urlBase + config.apiPontoRegistra;

            var ItensChecados = [];

            var tipoRegistro = "";

            angular.forEach($scope.ListaOpcoes, function (item) {
                if (!!item.selected) ItensChecados.push(item);
            })

            if (ItensChecados.length > 0) {
                tipoRegistro = ItensChecados[0].campo;
            }


            // constroi o objeto para envio
            var obj = {
                re: $scope.uRe,
                contrasenha: $scope.uContraSenha,
                tiporegistro: tipoRegistro,
                observacao: "Registrado Pelo APP"
            };


            var response = $http({
                    method: 'POST',
                    url: _url,
                    data: obj,
                })
                .then(function (response) {
                    var data = response.data;
                    if (data.codigo != 200) {
                        $scope.sucesso = "";
                        $scope.error = "erro";
                        $scope.errormsg = data.mensagem;

                    } else {
                        $scope.error = "";
                        $scope.sucesso = "sucesso";
                        $scope.sucessomsg = data.mensagem;
                        $scope.showFormRe = false;
                        $scope.ListaOpcoes = false;
                        $scope.showTheButtons = true;
                        //$scope.$apply();

                    }

                }, function (response) {
                    $scope.error = "erro";
                    $scope.errormsg = "Ocorreu um erro ao carregar ao registrar";
                    console.log(response.data);
                });


        }

}])

    .controller('SupervisaoIndexCtrl', ['$scope', '$http', '$location', 'AuthService', function ($scope, $http, $location, AuthService) {
        $(document).ready(customInit());
        AuthService.verifySession();

        SupervisoesListar();

        function SupervisoesListar() {

            var _url = config.urlBase + config.apiSupervisaoListar;
        
            var response = $http({
                    method: 'POST',
                    url: _url,
                    params: {
                        id: AuthService.userid(),
                        EmpresaId: config.apiEmpresaId,
                        doDia: true,
                    }
                })
            
            

                .then(function (response) {
                    var data = response.data;
                    if (data.codigo != 200) {
                        $scope.error = "erro";
                        $scope.errormsg = data.mensagem;
                    } else {
                        var lista = data.Objeto;

                        console.log(lista);

                        $scope.Supervisoes = lista;

                    }

                }, function (response) {
                    $scope.error = "erro";
                    $scope.errormsg = response.data || 'Request failed';
                });


        }

}])

    .controller('SupervisaoCtrl', ['$scope', '$http', '$location', 'AuthService', function ($scope, $http, $location, AuthService) {
        $(document).ready(customInit());
        AuthService.verifySession();

        PostosServicosListar();

        function PostosServicosListar() {

            var _url = config.urlBase + config.apiPostosDeServicosListar

            var response = $http({
                    method: 'POST',
                    url: _url,
                    params: {
                        id: config.apiEmpresaId,
                    }
                })

                .then(function (response) {
                    var data = response.data;
                    if (data.codigo != 200) {
                        $scope.error = "erro";
                        $scope.errormsg = data.mensagem;
                    } else {
                        var opcoes = data.Objeto;

                        console.log(opcoes.Items);

                        $scope.PostosDeServicos = opcoes.Items;

                    }

                }, function (response) {
                    $scope.error = "erro";
                    $scope.errormsg = response.data || 'Request failed';
                });


        }

}])

    .controller('SupervisaoCriarCtrl', ['$scope', '$anchorScroll', '$filter', '$window', '$routeParams', '$http', '$location', 'AuthService', function ($scope, $anchorScroll, $filter, $window, $routeParams, $http, $location, AuthService) {
        $(document).ready(customInit());
        AuthService.verifySession();


        var usuarioId = AuthService.userid();
        var PostoDeServicoId = $routeParams.id;
        var PostoDeServicoNome = $routeParams.nome;

        $scope.PostoDeServicoNome = PostoDeServicoNome;
        $scope.PostoDeServicoId = PostoDeServicoId;

        Inicializar(0);

        function Inicializar(SupervisaoId) {

            var _url = config.urlBase + config.apiSupervisaoCarregar;

            console.log('response:' + _url + '?id=' + SupervisaoId + '&EmpresaiD=' + config.apiEmpresaId + '&PostoDeServicoId=' + PostoDeServicoId);

            $scope.showTheForm = true;

            var response = $http({
                    method: 'POST',
                    url: _url,
                    params: {
                        id: SupervisaoId,
                        EmpresaId: config.apiEmpresaId,
                        PostoDeServicoId: PostoDeServicoId,
                    }
                })

                .then(function (response) {


                    var data = response.data;

                    if (data.codigo != 200) {
                        $scope.error = "erro";
                        $scope.errormsg = data.mensagem;
                    } else {
                        var lista = data.Objeto;

                        $scope.ListSupervisaoItemView = lista.ListSupervisaoItemView;
                        $scope.ListCompactoPostoDeServicoServico = lista.ListCompactoPostoDeServicoServico;


                    }



                }, function (response) {
                    $scope.error = "erro";
                    $scope.errormsg = "Ocorreu um erro ao carregar o checklist";
                    console.log(response.data);
                });


        }

        $scope.RegistrarTeste = function () {
            if (confirm("Confirma o registro dessa supervisão?")) {

                $scope.error = "";
                $scope.sucesso = "";

                if ($scope.supervisaoForm.$invalid) {
                    $scope.error = "erro";
                    $scope.errormsg = "Preencha os campos obrigatórios";
                    $location.hash('divtopo');
                    console.log("$anchorScroll");
                    $anchorScroll();
                    return false;
                }

                var dt = $filter('date')(new Date($scope.PontoInicio), 'HH:mm');

                console.log(dt);

                $scope.sucesso = "sucesso";
                $scope.sucessomsg = "Tudo ok";
                $scope.showTheForm = false;
                $scope.showTheButtons = true;
                $window.scrollTo(0, angular.element(document.getElementById('divtopo')).offsetTop);
            }

        }


        $scope.Registrar = function () {
            if (confirm("Confirma o registro dessa supervisão?")) {

                $scope.error = "";
                $scope.sucesso = "";

                if ($scope.supervisaoForm.$invalid) {
                    $scope.error = "erro";
                    $scope.errormsg = "Preencha os campos obrigatórios";
                    $location.hash('divtopo');
                    console.log("$anchorScroll");
                    $anchorScroll();
                    return false;
                }



                var _url = config.urlBase + config.apiSupervisaoCadastrar;

                var ItensChecados = [];

                angular.forEach($scope.ListSupervisaoItemView, function (item) {
                    if (!!item.selected) ItensChecados.push(item);
                })


                // constroi o objeto para envio
                var obj = {
                    PostoDeServicoId: PostoDeServicoId,
                    SupervisaoDescricao: $scope.SupervisaoDescricao,
                    PontoInicio: $filter('date')(new Date($scope.PontoInicio), 'HH:mm'),
                    PontoFim: $filter('date')(new Date($scope.PontoFim), 'HH:mm'),
                    ListSupervisaoItemViewChecados: ItensChecados,
                    RegIdInicio: usuarioId,
                    EmpresaId: config.apiEmpresaId,
                    ListSupervisaoItemView: $scope.ListSupervisaoItemView,
                    ListCompactoPostoDeServicoServico: $scope.ListCompactoPostoDeServicoServico,
                    ListCompactoPostoDeServicoPessoa: $scope.ListCompactoPostoDeServicoPessoa,
                };

                console.log(obj);


                var response = $http({
                        method: 'POST',
                        url: _url,
                        data: JSON.stringify(obj),
                        dataType: 'json',
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8'
                        },
                    })

                    .then(function (response) {
                        var data = response.data;
                        if (data.codigo != 200) {
                            $scope.error = "erro";
                            $scope.errormsg = data.mensagem;
                            $window.scrollTo(0, angular.element(document.getElementById('divtopo')).offsetTop);

                        } else {
                            $scope.sucesso = "sucesso";
                            $scope.sucessomsg = data.mensagem;
                            $scope.showTheForm = false;
                            $scope.showTheButtons = true;
                            $window.scrollTo(0, angular.element(document.getElementById('divtopo')).offsetTop);
                        }

                    }, function (response) {
                        $scope.error = "erro";
                        $scope.errormsg = "Ocorreu um erro ao carregar ao registrar";
                        console.log(response.data);
                        $window.scrollTo(0, angular.element(document.getElementById('divtopo')).offsetTop);
                    });

            }
        }


}])

    .controller('SupervisaoViewCtrl', ['$scope', '$window', '$routeParams', '$http', '$location', 'AuthService', function ($scope, $window, $routeParams, $http, $location, AuthService) {
        $(document).ready(customInit());
        AuthService.verifySession();


        var usuarioId = AuthService.userid();
        var SupervisaoId = $routeParams.id;

        $scope.SupervisaoId = SupervisaoId;

        Inicializar(SupervisaoId);

        function Inicializar(SupervisaoId) {

            var _url = config.urlBase + config.apiSupervisaoCarregar;

            console.log('response:' + _url + '?id=' + SupervisaoId + '&EmpresaiD=' + config.apiEmpresaId);

            $scope.showTheForm = true;

            var response = $http({
                    method: 'POST',
                    url: _url,
                    params: {
                        id: SupervisaoId,
                        EmpresaId: config.apiEmpresaId,
                    }
                })

                .then(function (response) {


                    var data = response.data;

                    if (data.codigo != 200) {
                        $scope.error = "erro";
                        $scope.errormsg = data.mensagem;
                    } else {
                        var lista = data.Objeto;

                        $scope.Dados = lista;
                        //$scope.ListSupervisaoItemView = lista.ListSupervisaoItemView;
                        //$scope.ListCompactoPostoDeServicoServico = lista.ListCompactoPostoDeServicoServico;


                    }



                }, function (response) {
                    $scope.error = "erro";
                    $scope.errormsg = "Ocorreu um erro ao carregar os dados da Supervisão";
                    console.log(response.data);
                });


        }


}])

    .controller('CheckinoutCtrl', ['$scope', '$http', '$location', 'AuthService', function ($scope, $http, $location, AuthService) {
        $(document).ready(customInit());
        //AuthService.verifySession();

        
}])

