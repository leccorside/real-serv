angular.module('RealServApp', ['ngResource', 'ngRoute', 'controllers', 'services']).config(function ($routeProvider) {
    
    console.log($routeProvider);
    
        $routeProvider.when('/', {
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl'
        }).when('/loading', {
            templateUrl: 'partials/loading.html',
            controller: 'LoadingCtrl'
        }).when('/principal', {
            templateUrl: 'partials/principal.html',
            controller: 'PrincipalCtrl'
        }).when('/registroponto', {
            templateUrl: 'partials/registroponto.html',
            controller: 'RegistroPontoCtrl'
        }).when('/supervisaoindex', {
            templateUrl: 'partials/supervisaoindex.html',
            controller: 'SupervisaoIndexCtrl'
        }).when('/supervisao', {
            templateUrl: 'partials/supervisao.html',
            controller: 'SupervisaoCtrl'
        }).when('/supervisaocriar/:id/:nome', {
            templateUrl: 'partials/supervisaocriar.html',
            controller: 'SupervisaoCriarCtrl'
        }).when('/supervisaoview/:id/', {
            templateUrl: 'partials/supervisaoview.html',
            controller: 'SupervisaoViewCtrl'
        }).when('/checkinout', {
            templateUrl: 'partials/checkinout.html',
            controller: 'CheckinoutCtrl'
        }).when('/logoff', {
            templateUrl: 'partials/logoff.html',
            controller: 'LogoffCtrl'
        }).otherwise({
            redirectTo: '/'
        });
    }).filter('highlight', function ($sce) {
        return function (text, phrase) {
            if (phrase) text = text.replace(new RegExp('(' + phrase + ')', 'gi'), '<span class="highlighted">$1</span>')
            return $sce.trustAsHtml(text)
        }
    })


    .config([
    "$rootScopeProvider",
    "$routeProvider",
    "$locationProvider",
    "$httpProvider",
    function ($rootScopeProvider, $routeProvider, $locationProvider, $httpProvider) {

            //var h5m = (typeof html5Mode !== 'undefined') ? html5Mode : true;
            //$locationProvider.html5Mode(h5m);

            $httpProvider.defaults.headers.common['Access-Control-Allow-Headers'] = '*';
            $rootScopeProvider.digestTtl(Infinity);
    }
])

    .factory('AuthService', function ($http, $q, $location) {
        var LOCAL_TOKEN_KEY = 'tkrealserv';
        var username = '';
        var userid = '';
        var isAuthenticated = false;
        var authToken;




        function loadUserCredentials() {
            var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
            if (token) {
                useCredentials(token);
            }
        }

        function storeUserCredentials(token) {
            window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
            useCredentials(token);
        }

        function useCredentials(token) {
            username = token.split('.')[1];
            userid = token.split('.')[0];
            isAuthenticated = true;
            authToken = token;
            $http.defaults.headers.common['X-Auth-Token'] = token;
        }

        function destroyUserCredentials() {
            authToken = undefined;
            username = '';
            userid = '';
            isAuthenticated = false;
            $http.defaults.headers.common['X-Auth-Token'] = undefined;
            window.localStorage.removeItem(LOCAL_TOKEN_KEY);
        }


        var login = function (name, pw) {
            return $q(function (resolve, reject) {
                storeUserCredentials(name);
            });
        };

        var logout = function () {
            destroyUserCredentials();
            $location.path("/login");
        };


        var isAuthorized = function () {
            console.log('autenticado?= ' + isAuthenticated)

            if (isAuthenticated == false) {
                return false;
            }

            return (isAuthenticated !== -1);
        };

        var verifySession = function () {
            console.log('auotizado? = ' + isAuthorized());

            if (isAuthorized() == false) {
                console.log('verifySession: nao logado');
                $location.path("/login");
            } else {
                console.log('verifySession: logado - ' + username);
            }
        }

        loadUserCredentials();

        return {
            login: login,
            logout: logout,
            verifySession: verifySession,
            isAuthorized: isAuthorized,
            isAuthenticated: function () {
                return isAuthenticated;
            },
            username: function () {
                return username;
            },
            userid: function () {
                return userid;
            },
        };
    })


    .factory('Utils', function ($http, $q, $location, $timeout) {

        function onRouteMe(data) {
            var waitForRender = function () {
                if ($http.pendingRequests.length > 0) {
                    $timeout(waitForRender);
                } else {
                    $location.path(data).replace();
                }
            };
            $timeout(waitForRender);
        }


        var routeMe = function (data) {
            onRouteMe(data);
        };


        return {
            routeMe: routeMe
        };
    })