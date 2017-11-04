angular.module('portalApp')

// Widget controller - runs every time widget is shown
.controller('countdownCtrl', ['$scope', '$http', '$interval', '$q', 'countdownFactory', function($scope, $http, $interval, $q, countdownFactory) {

        // Import variables and functions from service
        $scope.data = countdownFactory.data;
        $scope.countdowns = countdownFactory.countdowns;
        $scope.detailsItem = countdownFactory.detailsItem;


        // initialize the service
        countdownFactory.init($scope);

        // Show main view in the first column
        $scope.portalHelpers.showView('countdownMain.html', 1);

    	$scope.formatDate = function(deadline){
            var t = Date.parse(deadline) - Date.parse(new Date());
            var seconds = Math.floor((t / 1000) % 60);
            var minutes = Math.floor((t / 1000 / 60) % 60);
            var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
            var days = Math.floor(t / (1000 * 60 * 60 * 24));

            var time = "";
            if (t < 0) {
                time = "Passed";
            } else if (days > 0) {
                time += days + " days";
                if (hours > 0) time += ", " + hours + "hours";
            } else if (hours > 0) {
                time += hours + " hours" + minutes + "minutes";
            } else if (minutes > 0) {
                time += minutes + " minutes";
            } else {
                time += seconds + " seconds";
            }
            return time;
        }

        $scope.updateCountdown = function() {
            for (var i = 0; i < $scope.countdowns.value.length; i++) {
                var countdown = $scope.countdowns.value[i];
                countdown.remaining = $scope.formatDate(countdown.deadline);
            }
        }
        $interval($scope.updateCountdown, 1000);
        // This function gets called when user clicks an item in the list
        $scope.showDetails = function(item) {
            // Make the item that user clicked available to the template
            $scope.detailsItem.value = item;
            $scope.portalHelpers.showView('countdownDetails.html', 2);
        }
        $scope.toggleFavorite = function(item){
         	item.favorite = item.favorite?false:true;   
        }

    }])
    // Factory maintains the state of the widget
    .factory('countdownFactory', ['$http', '$rootScope', '$filter', '$q', function($http, $rootScope, $filter, $q) {

        var initialized = {
            value: false
        };

        // Your variable declarations
        var data = {
            value: null
        };
        var detailsItem = {
            value: null
        };
        // mock data
        var countdowns = {
            value: null
        };

        var init = function($scope) {
            if (initialized.value)
                return;

            initialized.value = true;

            // Place your init code here:
            data.value = {
                message: "Welcome to Portal SDK!"
            };
            countdowns.value = [{
                    name: 'Item 1',
                    deadline: new Date(Date.now() + 480000),
                    remaining: "Loading..."
                },

            ];
        }


        // Expose init(), and variables
        return {
            init: init,
            data: data,
            detailsItem: detailsItem,
            countdowns: countdowns
        };

    }])
    // Custom directive example
    .directive('countdownDirectiveName', ['$http', function($http) {
        return {
            link: function(scope, el, attrs) {

            }
        };
    }])
    // Custom filter example
    .filter('countdownFilterName', function() {
        return function(input, arg1, arg2) {
            // Filter your output here by iterating over input elements
            var output = input;
            return output;
        }
    });