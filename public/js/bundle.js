'use strict';

var app = angular.module('fireApp', ['firebase', 'ui.router', 'ui.bootstrap', 'ngAnimate']);

app.constant('FB_URL', 'https://message101-app.firebaseio.com/');

app.config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {
  $stateProvider.state('home', { url: '/', templateUrl: 'html/home.html' }).state('profile', {
    url: '/profile',
    templateUrl: 'html/profile.html',
    controller: 'profileCtrl',
    resolve: {
      profile: ["$authObj", "ProfileFactory", function ($authObj, ProfileFactory) {
        return $authObj.$requireAuth().then(function (authData) {
          return ProfileFactory(authData.uid).$loaded();
        });
      }]
    }
  }).state('threads', {
    url: '/threads',
    templateUrl: '/html/threads.html',
    controller: 'threadsCtrl'
  }).state('thread-detail', {
    url: '/thread-detail',
    templateUrl: '/html/threadDetail.html',
    controller: 'threadDetailCtrl'
  });

  $urlRouterProvider.otherwise('/');
}]);

app.filter('reverse', function () {
  return function (items) {
    return items.slice().reverse();
  };
});
'use strict';

var app = angular.module('fireApp');

app.controller('mainCtrl', ["$scope", "$tweets", "$authObj", "ProfileFactory", function ($scope, $tweets, $authObj, ProfileFactory) {
  $scope.tweets = $tweets;
  $scope.authObj = $authObj;

  $scope.authObj.$onAuth(function (authData) {
    $scope.authData = authData;
    $scope.profile = ProfileFactory(authData.uid);
  });

  $scope.logout = function () {
    $scope.authObj.$unauth();
  };

  $scope.register = function (user) {
    $scope.authObj.$createUser(user).then(function (userData) {
      console.log('user created:', userData);
      return $scope.authObj.$authWithPassword(user);
    }).then(function (authData) {
      console.log('user logged in:', authData);
    }).catch(function (err) {
      console.log('err:', err);
    });
  };

  $scope.login = function (user) {
    $scope.authObj.$authWithPassword(user).then(function (authData) {
      console.log('user logged in:', authData);
    }).catch(function (err) {
      console.log('err:', err);
    });
  };
}]);
'use strict';

var app = angular.module('fireApp');

app.controller('profileCtrl', ["$scope", "$uibModal", "$log", "profile", function ($scope, $uibModal, $log, profile) {
  $scope.profile = profile;

  $scope.open = function () {
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'html/editProfileModal.html',
      controller: 'editProfileModalCtrl',
      size: 'lg',
      resolve: {
        profileToEdit: function profileToEdit() {
          return angular.copy($scope.profile);
        }
      }
    });
    modalInstance.result.then(function (editedProfile) {
      $scope.profile.name = editedProfile.name;
      $scope.profile.color = editedProfile.color;
      $scope.profile.$save();
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };
}]);

app.controller('editProfileModalCtrl', ["$scope", "$uibModalInstance", "profileToEdit", function ($scope, $uibModalInstance, profileToEdit) {
  $scope.editProfile = profileToEdit;
  $scope.save = function () {
    $uibModalInstance.close($scope.editProfile);
  };
  $scope.cancel = function () {
    $uibModalInstance.dismiss();
  };
}]);
'use strict';

var app = angular.module('fireApp');

app.controller('threadDetailCtrl', ["$scope", "$state", function ($scope, $state) {

  console.log('threadDetailCtrl!!!');
  console.log('params: ', $state.params);
}]);
'use strict';

var app = angular.module('fireApp');

app.controller('threadsCtrl', ["$scope", "$threads", function ($scope, $threads) {
  console.log('threadsCtrl!!!!');

  $scope.threads = $threads.getArray(); // three-way data-binding

  $scope.threads.$loaded().then(function (threads) {
    console.log('first thread:', threads[0]);
  });

  $scope.addThread = function () {
    $threads.create($scope.newThread.subject);
    // .then(function(ref) {
    //   console.log('ref: ', ref);
    // })
    // .catch(function(err){
    //   console.log('err: ', err);
    // })
    $scope.newThread = {};
  };
}]);
'use strict';

var app = angular.module('fireApp');

app.factory('ProfileFactory', ["$firebaseObject", "FB_URL", function ($firebaseObject, FB_URL) {
  return function (uid) {
    if (!uid) {
      return {};
    };
    var profilesRef = new Firebase(FB_URL + 'profiles');
    var userRef = profilesRef.child(uid);
    return $firebaseObject(userRef);
  };
}]);

app.factory('$tweets', ["$firebaseArray", "FB_URL", function ($firebaseArray, FB_URL) {
  var ref = new Firebase(FB_URL);
  var tweetsRef = ref.child('tweets');
  return $firebaseArray(tweetsRef);
}]);

app.factory('$authObj', ["$firebaseAuth", "FB_URL", function ($firebaseAuth, FB_URL) {
  var ref = new Firebase(FB_URL);
  return $firebaseAuth(ref);
}]);

app.service('$threads', ["$firebaseArray", "FB_URL", function ($firebaseArray, FB_URL) {
  var ref = new Firebase(FB_URL);
  var threadsRef = ref.child('threads');

  // return {
  //   getArray: function() {
  this.getArray = function () {
    return $firebaseArray(threadsRef);
  };
  this.create = function (subject) {
    return this.getArray().$loaded().then(function (threads) {
      return threads.$add({
        subject: subject
      });
    });
  };
}]);

// $threads.create('april fools!')
// .then(function(newThreadRef) {
//
// })
//
// $thread.getArray()
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL21haW5DdHJsLmpzIiwiY29udHJvbGxlcnMvcHJvZmlsZUN0cmwuanMiLCJjb250cm9sbGVycy90aHJlYWREZXRhaWxDdHJsLmpzIiwiY29udHJvbGxlcnMvdGhyZWFkc0N0cmwuanMiLCJzZXJ2aWNlcy9mYWN0b3JpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUEsSUFBSSxNQUFNLFFBQVEsTUFBUixDQUFlLFNBQWYsRUFBMEIsQ0FBQyxVQUFELEVBQWEsV0FBYixFQUEwQixjQUExQixFQUEwQyxXQUExQyxDQUExQixDQUFOOztBQUVKLElBQUksUUFBSixDQUFhLFFBQWIsRUFBdUIsd0NBQXZCOztBQUVBLElBQUksTUFBSixDQUFJLENBQUEsZ0JBQUEsRUFBQSxvQkFBQSxFQUFPLFVBQVMsY0FBVCxFQUF5QixrQkFBekIsRUFBNkM7QUFDdEQsaUJBQ0csS0FESCxDQUNTLE1BRFQsRUFDaUIsRUFBRSxLQUFLLEdBQUwsRUFBVSxhQUFhLGdCQUFiLEVBRDdCLEVBRUcsS0FGSCxDQUVTLFNBRlQsRUFFb0I7QUFDaEIsU0FBSyxVQUFMO0FBQ0EsaUJBQWEsbUJBQWI7QUFDQSxnQkFBWSxhQUFaO0FBQ0EsYUFBUztBQUNQLGVBQUEsQ0FBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBUyxVQUFTLFFBQVQsRUFBbUIsY0FBbkIsRUFBbUM7QUFDMUMsZUFBTyxTQUFTLFlBQVQsR0FBd0IsSUFBeEIsQ0FBNkIsVUFBQSxRQUFBLEVBQUE7QUFDbEMsaUJBQU8sZUFBZSxTQUFTLEdBQVQsQ0FBZixDQUE2QixPQUE3QixFQUFQLENBRGtDO1NBQUEsQ0FBcEMsQ0FEMEM7T0FBbkMsQ0FBVDtLQURGO0dBTkosRUFjRyxLQWRILENBY1MsU0FkVCxFQWNvQjtBQUNoQixTQUFLLFVBQUw7QUFDQSxpQkFBYSxvQkFBYjtBQUNBLGdCQUFZLGFBQVo7R0FqQkosRUFtQkcsS0FuQkgsQ0FtQlMsZUFuQlQsRUFtQjBCO0FB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O0FBQ3RELE1BQUksTUFBTSxJQUFJLFFBQUosQ0FBYSxNQUFiLENBQU4sQ0FEa0Q7QUFFdEQsTUFBSSxZQUFZLElBQUksS0FBSixDQUFVLFFBQVYsQ0FBWixDQUZrRDtBQUd0RCxTQUFPLGVBQWUsU0FBZixDQUFQLENBSHNEO0NBQWpDLENBQXZCOztBQU1BLElBQUksT0FBSixDQUFZLFVBQVosRUFBWSxDQUFBLGVBQUEsRUFBQSxRQUFBLEVBQVksVUFBUyxhQUFULEVBQXdCLE1BQXhCLEVBQWdDO0FBQ3RELE1BQUksTUFBTSxJQUFJLFFBQUosQ0FBYSxNQUFiLENBQU4sQ0FEa0Q7QUFFdEQsU0FBTyxjQUFjLEdBQWQsQ0FBUCxDQUZzRDtDQUFoQyxDQUF4Qjs7QUFLQSxJQUFJLE9BQUosQ0FBWSxVQUFaLEVBQVksQ0FBQSxnQkFBQSxFQUFBLFFBQUEsRUFBWSxVQUFTLGNBQVQsRUFBeUIsTUFBekIsRUFBaUM7QUFDdkQsTUFBSSxNQUFNLElBQUksUUFBSixDQUFhLE1BQWIsQ0FBTixDQURtRDtBQUV2RCxNQUFJLGFBQWEsSUFBSSxLQUFKLENBQVUsU0FBVixDQUFiOzs7O0FBRm1ELE1BTXZELENBQUssUUFBTCxHQUFnQixZQUFVO0FBQ3hCLFdBQU8sZUFBZSxVQUFmLENBQVAsQ0FEd0I7R0FBVixDQU51QztBQVN2RCxPQUFLLE1BQUwsR0FBYyxVQUFTLE9BQVQsRUFBa0I7QUFDOUIsV0FBTyxLQUFLLFFBQUwsR0FBZ0IsT0FBaEIsR0FDTCxJQURLLENBQ0EsVUFBUyxPQUFULEVBQWtCO0FBQ3RCLGFBQU8sUUFBUSxJQUFSLENBQWE7QUFDbEIsaUJBQVMsT0FBVDtPQURLLENBQVAsQ0FEc0I7S0FBbEIsQ0FEUCxDQUQ4QjtHQUFsQixDQVR5QztDQUFqQyxDQUF4QiIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZmlyZUFwcCcsIFsnZmlyZWJhc2UnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnXSk7XG5cbmFwcC5jb25zdGFudCgnRkJfVVJMJywgJ2h0dHBzOi8vbWVzc2FnZTEwMS1hcHAuZmlyZWJhc2Vpby5jb20vJyk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgnaG9tZScsIHsgdXJsOiAnLycsIHRlbXBsYXRlVXJsOiAnaHRtbC9ob21lLmh0bWwnIH0pXG4gICAgLnN0YXRlKCdwcm9maWxlJywge1xuICAgICAgdXJsOiAnL3Byb2ZpbGUnLFxuICAgICAgdGVtcGxhdGVVcmw6ICdodG1sL3Byb2ZpbGUuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAncHJvZmlsZUN0cmwnLFxuICAgICAgcmVzb2x2ZToge1xuICAgICAgICBwcm9maWxlOiBmdW5jdGlvbigkYXV0aE9iaiwgUHJvZmlsZUZhY3RvcnkpIHtcbiAgICAgICAgICByZXR1cm4gJGF1dGhPYmouJHJlcXVpcmVBdXRoKCkudGhlbigoYXV0aERhdGEpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBQcm9maWxlRmFjdG9yeShhdXRoRGF0YS51aWQpLiRsb2FkZWQoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICAgLnN0YXRlKCd0aHJlYWRzJywge1xuICAgICAgdXJsOiAnL3RocmVhZHMnLFxuICAgICAgdGVtcGxhdGVVcmw6ICcvaHRtbC90aHJlYWRzLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ3RocmVhZHNDdHJsJ1xuICAgIH0pXG4gICAgLnN0YXRlKCd0aHJlYWQtZGV0YWlsJywge1xuICAgICAgdXJsOiAnL3RocmVhZC1kZXRhaWwnLFxuICAgICAgdGVtcGxhdGVVcmw6ICcvaHRtbC90aHJlYWREZXRhaWwuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAndGhyZWFkRGV0YWlsQ3RybCdcbiAgICB9KVxuXG4gICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbn0pO1xuXG5hcHAuZmlsdGVyKCdyZXZlcnNlJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihpdGVtcykge1xuICAgIHJldHVybiBpdGVtcy5zbGljZSgpLnJldmVyc2UoKTtcbiAgfTtcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZpcmVBcHAnKTtcblxuYXBwLmNvbnRyb2xsZXIoJ21haW5DdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkdHdlZXRzLCAkYXV0aE9iaiwgUHJvZmlsZUZhY3RvcnkpIHtcbiAgJHNjb3BlLnR3ZWV0cyA9ICR0d2VldHM7XG4gICRzY29wZS5hdXRoT2JqID0gJGF1dGhPYmo7XG5cbiAgJHNjb3BlLmF1dGhPYmouJG9uQXV0aChmdW5jdGlvbihhdXRoRGF0YSkge1xuICAgICRzY29wZS5hdXRoRGF0YSA9IGF1dGhEYXRhO1xuICAgICRzY29wZS5wcm9maWxlID0gUHJvZmlsZUZhY3RvcnkoYXV0aERhdGEudWlkKTtcbiAgfSk7XG5cbiAgJHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uKCkge1xuICAgICRzY29wZS5hdXRoT2JqLiR1bmF1dGgoKTtcbiAgfTtcblxuICAkc2NvcGUucmVnaXN0ZXIgPSBmdW5jdGlvbih1c2VyKSB7XG4gICAgJHNjb3BlLmF1dGhPYmouJGNyZWF0ZVVzZXIodXNlcilcbiAgICAudGhlbihmdW5jdGlvbih1c2VyRGF0YSkge1xuICAgICAgY29uc29sZS5sb2coJ3VzZXIgY3JlYXRlZDonLCB1c2VyRGF0YSk7XG4gICAgICByZXR1cm4gJHNjb3BlLmF1dGhPYmouJGF1dGhXaXRoUGFzc3dvcmQodXNlcik7XG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbihhdXRoRGF0YSkge1xuICAgICAgY29uc29sZS5sb2coJ3VzZXIgbG9nZ2VkIGluOicsIGF1dGhEYXRhKTtcbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnI6JywgZXJyKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbih1c2VyKSB7XG4gICAgJHNjb3BlLmF1dGhPYmouJGF1dGhXaXRoUGFzc3dvcmQodXNlcilcbiAgICAudGhlbihmdW5jdGlvbihhdXRoRGF0YSkge1xuICAgICAgY29uc29sZS5sb2coJ3VzZXIgbG9nZ2VkIGluOicsIGF1dGhEYXRhKTtcbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnI6JywgZXJyKTtcbiAgICB9KTtcbiAgfTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZmlyZUFwcCcpO1xuXG5hcHAuY29udHJvbGxlcigncHJvZmlsZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICR1aWJNb2RhbCwgJGxvZywgcHJvZmlsZSkge1xuICAkc2NvcGUucHJvZmlsZSA9IHByb2ZpbGU7XG5cbiAgJHNjb3BlLm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbW9kYWxJbnN0YW5jZSA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgIGFuaW1hdGlvbjogdHJ1ZSxcbiAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9lZGl0UHJvZmlsZU1vZGFsLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ2VkaXRQcm9maWxlTW9kYWxDdHJsJyxcbiAgICAgIHNpemU6ICdsZycsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIHByb2ZpbGVUb0VkaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoJHNjb3BlLnByb2ZpbGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgbW9kYWxJbnN0YW5jZS5yZXN1bHQudGhlbihmdW5jdGlvbihlZGl0ZWRQcm9maWxlKSB7XG4gICAgICAkc2NvcGUucHJvZmlsZS5uYW1lID0gZWRpdGVkUHJvZmlsZS5uYW1lO1xuICAgICAgJHNjb3BlLnByb2ZpbGUuY29sb3IgPSBlZGl0ZWRQcm9maWxlLmNvbG9yO1xuICAgICAgJHNjb3BlLnByb2ZpbGUuJHNhdmUoKTtcbiAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICRsb2cuaW5mbygnTW9kYWwgZGlzbWlzc2VkIGF0OiAnICsgbmV3IERhdGUoKSk7XG4gICAgfSk7XG4gIH07XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ2VkaXRQcm9maWxlTW9kYWxDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSwgcHJvZmlsZVRvRWRpdCkge1xuICAkc2NvcGUuZWRpdFByb2ZpbGUgPSBwcm9maWxlVG9FZGl0O1xuICAkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKCRzY29wZS5lZGl0UHJvZmlsZSk7XG4gIH07XG4gICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCk7XG4gIH07XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmaXJlQXBwJyk7XG5cbmFwcC5jb250cm9sbGVyKCd0aHJlYWREZXRhaWxDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUpIHtcblxuICBjb25zb2xlLmxvZygndGhyZWFkRGV0YWlsQ3RybCEhIScpXG4gIGNvbnNvbGUubG9nKCdwYXJhbXM6ICcsICRzdGF0ZS5wYXJhbXMpXG59KVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZpcmVBcHAnKTtcblxuYXBwLmNvbnRyb2xsZXIoJ3RocmVhZHNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkdGhyZWFkcykge1xuICBjb25zb2xlLmxvZygndGhyZWFkc0N0cmwhISEhJyk7XG5cbiAgJHNjb3BlLnRocmVhZHMgPSAkdGhyZWFkcy5nZXRBcnJheSgpOyAvLyB0aHJlZS13YXkgZGF0YS1iaW5kaW5nXG5cbiAgJHNjb3BlLnRocmVhZHMuJGxvYWRlZCgpLnRoZW4oZnVuY3Rpb24odGhyZWFkcykge1xuICAgIGNvbnNvbGUubG9nKCdmaXJzdCB0aHJlYWQ6JyAsIHRocmVhZHNbMF0pO1xuICB9KVxuXG4gICRzY29wZS5hZGRUaHJlYWQgPSBmdW5jdGlvbigpIHtcbiAgICAkdGhyZWFkcy5jcmVhdGUoJHNjb3BlLm5ld1RocmVhZC5zdWJqZWN0KVxuICAgIC8vIC50aGVuKGZ1bmN0aW9uKHJlZikge1xuICAgIC8vICAgY29uc29sZS5sb2coJ3JlZjogJywgcmVmKTtcbiAgICAvLyB9KVxuICAgIC8vIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgIC8vICAgY29uc29sZS5sb2coJ2VycjogJywgZXJyKTtcbiAgICAvLyB9KVxuICAgICRzY29wZS5uZXdUaHJlYWQgPSB7fVxuICB9O1xuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmaXJlQXBwJyk7XG5cbmFwcC5mYWN0b3J5KCdQcm9maWxlRmFjdG9yeScsIGZ1bmN0aW9uKCRmaXJlYmFzZU9iamVjdCwgRkJfVVJMKSB7XG4gIHJldHVybiBmdW5jdGlvbih1aWQpIHtcbiAgICBpZighdWlkKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfTtcbiAgICB2YXIgcHJvZmlsZXNSZWYgPSBuZXcgRmlyZWJhc2UoRkJfVVJMICsgJ3Byb2ZpbGVzJyk7XG4gICAgdmFyIHVzZXJSZWYgPSBwcm9maWxlc1JlZi5jaGlsZCh1aWQpO1xuICAgIHJldHVybiAkZmlyZWJhc2VPYmplY3QodXNlclJlZik7XG4gIH07XG59KTtcblxuYXBwLmZhY3RvcnkoJyR0d2VldHMnLCBmdW5jdGlvbigkZmlyZWJhc2VBcnJheSwgRkJfVVJMKSB7XG4gIHZhciByZWYgPSBuZXcgRmlyZWJhc2UoRkJfVVJMKTtcbiAgdmFyIHR3ZWV0c1JlZiA9IHJlZi5jaGlsZCgndHdlZXRzJyk7XG4gIHJldHVybiAkZmlyZWJhc2VBcnJheSh0d2VldHNSZWYpO1xufSk7XG5cbmFwcC5mYWN0b3J5KCckYXV0aE9iaicsIGZ1bmN0aW9uKCRmaXJlYmFzZUF1dGgsIEZCX1VSTCkge1xuICB2YXIgcmVmID0gbmV3IEZpcmViYXNlKEZCX1VSTCk7XG4gIHJldHVybiAkZmlyZWJhc2VBdXRoKHJlZik7XG59KTtcblxuYXBwLnNlcnZpY2UoJyR0aHJlYWRzJywgZnVuY3Rpb24oJGZpcmViYXNlQXJyYXksIEZCX1VSTCkge1xuICB2YXIgcmVmID0gbmV3IEZpcmViYXNlKEZCX1VSTCk7XG4gIHZhciB0aHJlYWRzUmVmID0gcmVmLmNoaWxkKCd0aHJlYWRzJyk7XG5cbiAgLy8gcmV0dXJuIHtcbiAgLy8gICBnZXRBcnJheTogZnVuY3Rpb24oKSB7XG4gIHRoaXMuZ2V0QXJyYXkgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAkZmlyZWJhc2VBcnJheSh0aHJlYWRzUmVmKTtcbiAgfTtcbiAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbihzdWJqZWN0KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXJyYXkoKS4kbG9hZGVkKClcbiAgICAgLnRoZW4oZnVuY3Rpb24odGhyZWFkcykge1xuICAgICAgIHJldHVybiB0aHJlYWRzLiRhZGQoe1xuICAgICAgICAgc3ViamVjdDogc3ViamVjdFxuICAgICAgIH0pO1xuICAgICB9KTtcbiAgfVxuXG59KTtcblxuXG4vLyAkdGhyZWFkcy5jcmVhdGUoJ2FwcmlsIGZvb2xzIScpXG4vLyAudGhlbihmdW5jdGlvbihuZXdUaHJlYWRSZWYpIHtcbi8vXG4vLyB9KVxuLy9cbi8vICR0aHJlYWQuZ2V0QXJyYXkoKVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
