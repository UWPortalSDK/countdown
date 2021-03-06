angular.module('portalApp')

// Widget controller - runs every time widget is shown
.controller('countdownCtrl', ['$scope', '$http', '$interval', '$q', 'countdownFactory', '$rootScope', function($scope, $http, $interval, $q, countdownFactory, $rootScope) {

        // Import variables and functions from service
        $scope.countdowns = countdownFactory.countdowns;
        $scope.detailsItem = countdownFactory.detailsItem;
        $scope.updateCountdown = countdownFactory.updateCountdown;
        $scope.formatDate = countdownFactory.formatDate;

        
        // initialize the service
        countdownFactory.init($scope);

        // Show main view in the first column
        $scope.portalHelpers.showView('countdownMain.html', 1);

        $interval($scope.updateCountdown, 1000);

        $scope.createNew = function() {
            $scope.portalHelpers.showView('countdownNew.html', 2);
            $scope.newCountdown= {
                deadline: new Date(Date.now())
            }
        }
        $scope.createCountdown = function(item) {
            item.id = Date.now();
            $scope.countdowns.value.push(item);
            $scope.portalHelpers.showView('countdownMain.html', 1);
            countdownFactory.syncData();
        }
        $scope.showDetails = function(item) {
            $scope.detailsItem.value = item;
            $scope.portalHelpers.showView('countdownDetails.html', 2);
        }
        $scope.toggleFavorite = function(item) {
            var countdown = $scope.countdowns.value.find((e)=>(e.id==item.id));
            countdown.favorite = countdown.favorite ? false : true;
            countdownFactory.syncData();
        }
        $scope.getFavoriteCount = function(){
         	return $scope.countdowns.value.reduce((s,e)=>(e.favorite?s+1:s),0);   
        }
        $scope.editCountdown = function(item) {
            $scope.portalHelpers.showView('countdownEdit.html', 2);
            $scope.countdownEdit = Object.assign({}, item);
            $scope.countdownEdit.deadline = new Date(item.deadline);
        }
        $scope.saveEdit = function(item) {
            Object.assign($scope.detailsItem.value, $scope.countdownEdit);
            $scope.showDetails(item);
            countdownFactory.syncData();
        };
        $scope.cancelEdit = function(item) {
            $scope.portalHelpers.showView('countdownDetails.html', 2);
        };
        $scope.deleteCountdown = function(item) {
            $scope.countdowns.value.splice($scope.countdowns.value.indexOf(item), 1);
            countdownFactory.syncData();
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
            $rootScope.$broadcast('ignoreListChanges');
            for (var i = 0; i < countdowns.value.length; i++) {
                var countdown = countdowns.value[i];
                formatDate(countdown);
            }
        }

        var syncData = function() {
                $rootScope.pouchDbLocal.get('countdown-countdowns').then(
                    function(doc) {
                        doc.value = countdowns.value;
                        $rootScope.pouchDbLocal.put(doc).then(function(succ) {
                            console.log('put success: ', succ, doc);
                        }, function(fail) {
                            console.log('put fail: ', fail);
                        });
                    },
                    function(err) {
                        if (err.status == 404) {
                            $rootScope.pouchDbLocal.put({
                                _id: 'countdown-countdowns',
                                widget: 'countdown',
                                value: countdowns.value
                            }).then(function(succ) {
                                console.log('put success: ', succ);
                            }, function(fail) {
                                console.log('put fail: ', fail);
                            });
                        }
                    }
                );
            };


        var init = function($scope) {
            if (initialized.value)
                return;

            initialized.value = true;

            if (typeof pouchService.widgetData['countdown'] != 'undefined') {
                countdowns.value = pouchService.widgetData['countdown'].find((e) => (e._id == "countdown-countdowns")).value;
                console.log('$scope.countdowns.value: ', countdowns.value);
            } else {
                pouchService.widgetData['countdown'] = [];
            }

            $scope.data = pouchService.widgetData['countdown'];

            //syncData();

            // watch for changes in data: this allows us to handle changes made on another client
            $scope.$watch('data', function(newval,oldval) {
                console.log("newval,oldval", newval,oldval);
                if ( newval !== oldval ) {
                    if ($scope.data.length == 0)
                        return;
                    console.log($scope.data);
                    countdowns.value = $scope.data.find(function(e){return (e._id == "countdown-countdowns")}).value;
                    if($scope.detailsItem.value == null) $scope.detailsItem.value = $scope.countdowns.value[0];
                    $scope.detailsItem.value = countdowns.value.find(function(e){return (e.id == $scope.detailsItem.value.id)});
                    for (var i = 0; i < countdowns.value.length; i++) {
                        var countdown = countdowns.value[i];
                        formatDate(countdown);
                    }
                }
            }, true);

            
        }


        // Expose init(), and variables
        return {
            init: init,
            syncData: syncData,
            detailsItem: detailsItem,
            countdowns: countdowns,
            updateCountdown: updateCountdown,
            formatDate: formatDate,
        };

    }]);