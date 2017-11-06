angular.module('portalApp')

// Widget controller - runs every time widget is shown
.controller('countdownCtrl', ['$scope', '$http', '$interval', '$q', 'countdownFactory', '$rootScope', function($scope, $http, $interval, $q, countdownFactory, $rootScope) {

        // Import variables and functions from service
        $scope.countdowns = countdownFactory.countdowns;
        $scope.detailsItem = countdownFactory.detailsItem;
        $scope.updateCountdown = countdownFactory.updateCountdown;


        // initialize the service
        countdownFactory.init($scope);

        // Show main view in the first column
        $scope.portalHelpers.showView('countdownMain.html', 1);

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
            var countdown = $scope.countdowns.value.find((e)=>(e.id==item.id));
            countdown.favorite = countdown.favorite ? false : true;
            $scope.syncData();
        }
        $scope.editCountdown = function(item) {
            $scope.portalHelpers.showView('countdownEdit.html', 2);
            $scope.countdownEdit = Object.assign({}, item);
            $scope.countdownEdit.deadline = new Date(item.deadline);
        }
        $scope.saveEdit = function(item) {
            Object.assign($scope.detailsItem.value, $scope.countdownEdit)
            $scope.syncData();
            $scope.portalHelpers.closeLastView();
            $scope.showDetails(item);
        };
        $scope.cancelEdit = function(item) {
            $scope.portalHelpers.showView('countdownDetails.html', 2);
        };
        $scope.deleteCountdown = function(item) {
            $scope.countdowns.value.splice($scope.countdowns.value.indexOf(item), 1);
            $scope.syncData();
            $scope.portalHelpers.showView('countdownMain.html', 1);
        }

    }])
    // Factory maintains the state of the widget
    .factory('countdownFactory', ['$http', '$rootScope', '$filter', '$q', 'pouchService', function($http, $rootScope, $filter, $q, pouchService) {

        var initialized = {
            value: false
        };

        var detailsItem = {
            value: null
        };
        var countdowns = {
            value: null
        };

        function formatDate(countdown) {
            var t = Date.parse(countdown.deadline) - Date.parse(new Date());
            var seconds = Math.floor((t / 1000) % 60);
            var minutes = Math.floor((t / 1000 / 60) % 60);
            var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
            var days = Math.floor(t / (1000 * 60 * 60 * 24));

            var time = "";
            if (t <= 0) {
                time = "Passed";
            } else if (days > 1) {
                time += days + " days";
            } else if (days == 1) {
                time += days + " day";
            } else if (hours > 1) {
                time += hours + " hours";
            } else if (hours == 1) {
                time += hours + " hour";
            } else if (minutes > 1) {
                time += minutes + " minutes";
            } else if (minutes == 1) {
                time += minutes + " minute";
            } else if (seconds > 1) {
                time += seconds + " seconds";
            } else {
                time += seconds + " second";
            }
            countdown.remaining = time;
            countdown.timeremaining = t;
        }

        var updateCountdown = function() {
            for (var i = 0; i < countdowns.value.length; i++) {
                var countdown = countdowns.value[i];
                formatDate(countdown);
            }
        }
        var init = function($scope) {
            if (initialized.value)
                return;

            initialized.value = true;

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
                $scope.detailsItem.value = $scope.countdowns.value.find((e)=>(e.id == $scope.detailsItem.value.id));
            }, true);

            countdowns.value = [];
        }


        // Expose init(), and variables
        return {
            init: init,
            detailsItem: detailsItem,
            countdowns: countdowns,
            updateCountdown: updateCountdown,
        };

    }]);