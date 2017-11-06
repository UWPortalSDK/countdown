angular.module('portalApp')

// Widget controller - runs every time widget is shown
.controller('countdownCtrl', ['$scope', '$http', '$interval', '$q', 'countdownFactory', 'pouchService', '$rootScope', function($scope, $http, $interval, $q, countdownFactory, pouchService, $rootScope) {

        // Import variables and functions from service
        $scope.countdowns = countdownFactory.countdowns;
        $scope.detailsItem = countdownFactory.detailsItem;


        // initialize the service
        countdownFactory.init($scope);

        // Show main view in the first column
        $scope.portalHelpers.showView('countdownMain.html', 1);

        $scope.formatDate = function(countdown) {
            var t = Date.parse(countdown.deadline) - Date.parse(new Date());
            var seconds = Math.floor((t / 1000) % 60);
            var minutes = Math.floor((t / 1000 / 60) % 60);
            var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
            var days = Math.floor(t / (1000 * 60 * 60 * 24));

            var time = "";
            if (t < 0) {
                time = "Passed";
            } else if (days > 0) {
                time += days + " days";
                if (days < 7 && hours > 0) time += ", " + hours + " hours";
            } else if (hours > 0) {
                time += hours + " hours, " + minutes + " minutes";
            } else if (minutes > 0) {
                time += minutes + " minutes";
            } else {
                time += seconds + " seconds";
            }
            countdown.remaining = time;
            countdown.timeremaining = t;
        }

        $scope.updateCountdown = function() {
            for (var i = 0; i < $scope.countdowns.value.length; i++) {
                var countdown = $scope.countdowns.value[i];
                $scope.formatDate(countdown);
            }
        }
        $interval($scope.updateCountdown, 1000);

        $scope.createNew = function() {
            $scope.portalHelpers.showView('countdownNew.html', 2);
        }
        $scope.createCountdown = function(item) {
            item.id = Date.now();
            $scope.countdowns.value.push(item);
            $scope.syncData();
            $scope.portalHelpers.showView('countdownMain.html', 1);
        }
        $scope.showDetails = function(item) {
            $scope.detailsItem.value = item;
            $scope.portalHelpers.showView('countdownDetails.html', 2);
        }
        $scope.toggleFavorite = function(item) {
            item.favorite = item.favorite ? false : true;
            $scope.syncData();
        }
        $scope.editCountdown = function(item) {
            $scope.portalHelpers.showView('countdownEdit.html', 2);
            $scope.original = Object.assign({}, item);
            $scope.countdownEdit = item;
            $scope.countdownEdit.deadline = new Date(item.deadline);
        }
        $scope.saveEdit = function(item) {
            var index = $scope.countdowns.value.findIndex((x) => (x.id == item.id));
            $scope.countdowns.value.splice(index, 1, item);
            $scope.showDetails(item);
            $scope.syncData();
        };
        $scope.cancelEdit = function(item) {
            Object.assign($scope.countdownEdit, $scope.original);
            $scope.portalHelpers.showView('countdownDetails.html', 2);
        };
        $scope.deleteCountdown = function(item) {
            $scope.countdowns.value.splice($scope.countdowns.value.indexOf(item), 1);
            $scope.syncData();
            $scope.portalHelpers.showView('countdownMain.html', 1);
        }
        if (typeof pouchService.widgetData['countdown'] != 'undefined') {
            $scope.countdowns.value = pouchService.widgetData['countdown'].find((e) => (e._id == "countdown-countdowns")).value;
        } else {
            pouchService.widgetData['countdown'] = [];
        }
        $scope.data = pouchService.widgetData['countdown'];

        $scope.syncData = function() {
            $rootScope.pouchDbLocal.get('countdown-countdowns').then(
                function(doc) {
                    doc.value = $scope.countdowns.value;
                    $rootScope.pouchDbLocal.put(doc).then(function(succ) {
                        console.log('put success: ', succ);
                    }, function(fail) {
                        console.log('put fail: ', fail);
                    });
                },
                function(err) {
                    if (err.status == 404) {
                        $rootScope.pouchDbLocal.put({
                            _id: 'countdown-countdowns',
                            widget: 'countdown',
                            value: $scope.countdowns.value
                        }).then(function(succ) {
                            console.log('put success: ', succ);
                        }, function(fail) {
                            console.log('put fail: ', fail);
                        });
                    }
                }
            );
        }

        // watch for changes in data: this allows us to handle changes made on another client
        $scope.$watch('data', function() {
            if ($scope.data.length == 0)
                return;
            console.log($scope.data)
            $scope.countdowns.value = $scope.data.find((e) => (e._id == "countdown-countdowns")).value;
        }, true);
    }])
    // Factory maintains the state of the widget
    .factory('countdownFactory', ['$http', '$rootScope', '$filter', '$q', function($http, $rootScope, $filter, $q) {

        var initialized = {
            value: false
        };


        var detailsItem = {
            value: null
        };
        var countdowns = {
            value: null
        };

        var init = function($scope) {
            if (initialized.value)
                return;

            initialized.value = true;

            // Place your init code here:

            countdowns.value = [];
        }


        // Expose init(), and variables
        return {
            init: init,
            detailsItem: detailsItem,
            countdowns: countdowns
        };

    }]);