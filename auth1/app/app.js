//declare angular module 'authDemo1' that relies on ngRoute as dependency
angular.module('authDemo1', ['ngRoute'])
	.config(function($httpProvider, $routeProvider, $locationProvider) {
		
		// add interceptor
		$httpProvider.interceptors.push('authenticationInterceptor');

		$locationProvider.html5Mode(true);

		// routing logic
		$routeProvider
		.when('/', {
			controller : 'HomePageController',
			templateUrl: 'home.html',
			//resolve block used to provide dependencies that must be 'resolved'
			//before the controller is loaded. Here we say that ghRepos() must run
			//and return a scope variable called 'repos' that will be available to 
			//'HomePageController' & it will contain whatever we have the ghRepos
			//service return 
			resolve: {
				repos: function(ghRepos) {
					return ghRepos();
				}
			}
		})
		.when('/login', {
			templateUrl: 'login.html',
			controller: 'LoginController'
		})
		.when('/logout', {
			template: '',
			controller: 'LogoutController'
		})
		.otherwise({
			redirectTo: '/'
		})
	})
	.factory('userSession', function() {
		return {
			loggedIn: false
		}
	})
	//if '/api/' is found in the URL & user is not logged in, route to /login 
	.factory('authenticationInterceptor', function(userSession, $location) {
		return {
			request: function(request) {
				if(request.url.match(/api/) && !userSession.loggedIn) {
					var previousPage = $location.path();
					$location.path('/login').search({
						previous: previousPage
					});
				}
				return request;
			}
		}
	})
	//use $http service to make call to Github & pull down list of repositories;
	//because '/api/' is in the url, 'authenticationInterceptor' will be triggered, which
	//will redirect user to login page if not already logged in
	.factory('ghRepos', function($http) {
		return function() {
			return $http.get('https://api.github.com/repositories');
		};
	})
	//watch to see if user logged in or not
	.controller('MainController', function($scope, userSession) {
		$scope.loggedIn = userSession.loggedIn; 
		$scope.$watch(function(){return userSession.loggedIn}, function(newVal, oldVal){
			$scope.loggedIn = newVal;
		})
	})
	//check to see if username and password match up to determine loggedIn status
	.controller('LoginController', function(userSession, $location) {
		var ctrl = this;
		ctrl.previousPage = $location.search().previous;
		ctrl.login = function(username, password) {
			this.loginFailed = null;
			if(username == 'user' && password == 'password') {
				userSession.loggedIn = true;
				$location.path(ctrl.previousPage || '/');
			} else {
				this.loginFailed = true;
			}
		}
	})
	.controller("LogoutController", function(userSession, $location){
		userSession.loggedIn=false;
		$location.path('/login');
	})
	.controller('HomePageController', function($scope, repos) {
		$scope.popularRepos = repos.data;
	})