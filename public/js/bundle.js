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
    url: '/thread-detail/:threadId',
    templateUrl: '/html/threadDetail.html',
    controller: 'threadDetailCtrl',
    resolve: {
      thread: ["$threads", "$stateParams", function ($threads, $stateParams) {
        return $threads.getThread($stateParams.threadId).$loaded(); // $firebaseObject
        // return the promise that will resolve into our loaded thread
      }],
      posts: ["$threads", "$stateParams", function ($threads, $stateParams) {
        return $threads.getPosts($stateParams.threadId).$loaded();
      }]
    }
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

app.controller('threadDetailCtrl', ["$scope", "$state", "thread", "posts", function ($scope, $state, thread, posts) {

  $scope.thread = thread;
  $scope.posts = posts; // an array of posts

  // console.log('threadDetailCtrl!!!')
  // console.log('params: ', $state.params)
  // console.log('threads: ', threads)

  console.log('$scope.authData: ', $scope.authData);

  $scope.addThread = function () {

    console.log("new post!");
    $scope.posts.$add($scope.newPost);
    $scope.newPost = {};
  };

  // $scope.remove = function() {
  //   $scope.thread.$remove().then(function() {
  //     $state.go('threads');
  //   }, function(err) {
  //     alert('hey, error in console')
  //     console.error(err);
  //   })
  // };
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

app.service('$threads', ["$firebaseArray", "$firebaseObject", "FB_URL", function ($firebaseArray, $firebaseObject, FB_URL) {
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

  this.getThread = function (threadId) {
    var singleThreadRef = threadsRef.child(threadId);
    return $firebaseObject(singleThreadRef);
  };

  this.getPosts = function (threadId) {
    var postsRef = threadsRef.child(threadId).child('posts');
    return $firebaseArray(postsRef);
  };
}]);

// $threads.create('april fools!')
// .then(function(newThreadRef) {
//
// })
//
// $thread.getArray()
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL21haW5DdHJsLmpzIiwiY29udHJvbGxlcnMvcHJvZmlsZUN0cmwuanMiLCJjb250cm9sbGVycy90aHJlYWREZXRhaWxDdHJsLmpzIiwiY29udHJvbGxlcnMvdGhyZWFkc0N0cmwuanMiLCJzZXJ2aWNlcy9mYWN0b3JpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUEsSUFBSSxNQUFNLFFBQVEsTUFBUixDQUFlLFNBQWYsRUFBMEIsQ0FBQyxVQUFELEVBQWEsV0FBYixFQUEwQixjQUExQixFQUEwQyxXQUExQyxDQUExQixDQUFOOztBQUVKLElBQUksUUFBSixDQUFhLFFBQWIsRUFBdUIsd0NBQXZCOztBQUVBLElBQUksTUFBSixDQUFJLENBQUEsZ0JBQUEsRUFBQSxvQkFBQSxFQUFPLFVBQVMsY0FBVCxFQUF5QixrQkFBekIsRUFBNkM7QUFDdEQsaUJBQ0csS0FESCxDQUNTLE1BRFQsRUFDaUIsRUFBRSxLQUFLLEdBQUwsRUFBVSxhQUFhLGdCQUFiLEVBRDdCLEVBRUcsS0FGSCxDQUVTLFNBRlQsRUFFb0I7QUFDaEIsU0FBSyxVQUFMO0FBQ0EsaUJBQWEsbUJBQWI7QUFDQSxnQkFBWSxhQUFaO0FBQ0EsYUFBUztBQUNQLGVBQUEsQ0FBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBUyxVQUFTLFFBQVQsRUFBbUIsY0FBbkIsRUFBbUM7QUFDMUMsZUFBTyxTQUFTLFlBQVQsR0FBd0IsSUFBeEIsQ0FBNkIsVUFBQSxRQUFBLEVBQUE7QUFDbEMsaUJBQU8sZUFBZSxTQUFTLEdBQVQsQ0FBZixDQUE2QixPQUE3QixFQUFQLENBRGtDO1NBQUEsQ0FBcEMsQ0FEMEM7T0FBbkMsQ0FBVDtLQURGO0dBTkosRUFjRyxLQWRILENBY1MsU0FkVCxFQWNvQjtBQUNoQixTQUFLLFVBQUw7QUFDQSxpQkFBYSxvQkFBYjtBQUNBLGdCQUFZLGFBQVo7R0FqQkosRUFtQkcsS0FuQkgsQ0FtQlMsZUFuQlQsRUFtQjBCO0FB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QUFBLEVBQUEsaUJBQUEsRUFBQSxRQUFBLEVBQVksVUFBUyxjQUFULEVBQXlCLGVBQXpCLEVBQTBDLE1BQTFDLEVBQWtEO0FBQ3hFLE1BQUksTUFBTSxJQUFJLFFBQUosQ0FBYSxNQUFiLENBQU4sQ0FEb0U7QUFFeEUsTUFBSSxhQUFhLElBQUksS0FBSixDQUFVLFNBQVYsQ0FBYjs7OztBQUZvRSxNQU14RSxDQUFLLFFBQUwsR0FBZ0IsWUFBVTtBQUN4QixXQUFPLGVBQWUsVUFBZixDQUFQLENBRHdCO0dBQVYsQ0FOd0Q7QUFTeEUsT0FBSyxNQUFMLEdBQWMsVUFBUyxPQUFULEVBQWtCO0FBQzlCLFdBQU8sS0FBSyxRQUFMLEdBQWdCLE9BQWhCLEdBQ0wsSUFESyxDQUNBLFVBQVMsT0FBVCxFQUFrQjtBQUN0QixhQUFPLFFBQVEsSUFBUixDQUFhO0FBQ2xCLGlCQUFTLE9BQVQ7T0FESyxDQUFQLENBRHNCO0tBQWxCLENBRFAsQ0FEOEI7R0FBbEIsQ0FUMEQ7O0FBa0J4RSxPQUFLLFNBQUwsR0FBaUIsVUFBUyxRQUFULEVBQW1CO0FBQ2xDLFFBQUksa0JBQWtCLFdBQVcsS0FBWCxDQUFpQixRQUFqQixDQUFsQixDQUQ4QjtBQUVsQyxXQUFPLGdCQUFnQixlQUFoQixDQUFQLENBRmtDO0dBQW5CLENBbEJ1RDs7QUF1QnhFLE9BQUssUUFBTCxHQUFnQixVQUFTLFFBQVQsRUFBbUI7QUFDakMsUUFBSSxXQUFXLFdBQVcsS0FBWCxDQUFpQixRQUFqQixFQUEyQixLQUEzQixDQUFpQyxPQUFqQyxDQUFYLENBRDZCO0FBRWpDLFdBQU8sZUFBZSxRQUFmLENBQVAsQ0FGaUM7R0FBbkIsQ0F2QndEO0NBQWxELENBQXhCIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmaXJlQXBwJywgWydmaXJlYmFzZScsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZSddKTtcblxuYXBwLmNvbnN0YW50KCdGQl9VUkwnLCAnaHR0cHM6Ly9tZXNzYWdlMTAxLWFwcC5maXJlYmFzZWlvLmNvbS8nKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdob21lJywgeyB1cmw6ICcvJywgdGVtcGxhdGVVcmw6ICdodG1sL2hvbWUuaHRtbCcgfSlcbiAgICAuc3RhdGUoJ3Byb2ZpbGUnLCB7XG4gICAgICB1cmw6ICcvcHJvZmlsZScsXG4gICAgICB0ZW1wbGF0ZVVybDogJ2h0bWwvcHJvZmlsZS5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdwcm9maWxlQ3RybCcsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIHByb2ZpbGU6IGZ1bmN0aW9uKCRhdXRoT2JqLCBQcm9maWxlRmFjdG9yeSkge1xuICAgICAgICAgIHJldHVybiAkYXV0aE9iai4kcmVxdWlyZUF1dGgoKS50aGVuKChhdXRoRGF0YSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFByb2ZpbGVGYWN0b3J5KGF1dGhEYXRhLnVpZCkuJGxvYWRlZCgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICAuc3RhdGUoJ3RocmVhZHMnLCB7XG4gICAgICB1cmw6ICcvdGhyZWFkcycsXG4gICAgICB0ZW1wbGF0ZVVybDogJy9odG1sL3RocmVhZHMuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAndGhyZWFkc0N0cmwnXG4gICAgfSlcbiAgICAuc3RhdGUoJ3RocmVhZC1kZXRhaWwnLCB7XG4gICAgICB1cmw6ICcvdGhyZWFkLWRldGFpbC86dGhyZWFkSWQnLFxuICAgICAgdGVtcGxhdGVVcmw6ICcvaHRtbC90aHJlYWREZXRhaWwuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAndGhyZWFkRGV0YWlsQ3RybCcsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIHRocmVhZDogZnVuY3Rpb24oJHRocmVhZHMsJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgICAgcmV0dXJuICR0aHJlYWRzLmdldFRocmVhZCgkc3RhdGVQYXJhbXMudGhyZWFkSWQpLiRsb2FkZWQoKTsgLy8gJGZpcmViYXNlT2JqZWN0XG4gICAgICAgICAgLy8gcmV0dXJuIHRoZSBwcm9taXNlIHRoYXQgd2lsbCByZXNvbHZlIGludG8gb3VyIGxvYWRlZCB0aHJlYWRcbiAgICAgICAgfSxcbiAgICAgICAgcG9zdHM6IGZ1bmN0aW9uKCR0aHJlYWRzLCRzdGF0ZVBhcmFtcykge1xuICAgICAgICAgIHJldHVybiAkdGhyZWFkcy5nZXRQb3N0cygkc3RhdGVQYXJhbXMudGhyZWFkSWQpLiRsb2FkZWQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG5cbiAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xufSk7XG5cbmFwcC5maWx0ZXIoJ3JldmVyc2UnLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGl0ZW1zKSB7XG4gICAgcmV0dXJuIGl0ZW1zLnNsaWNlKCkucmV2ZXJzZSgpO1xuICB9O1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZmlyZUFwcCcpO1xuXG5hcHAuY29udHJvbGxlcignbWFpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICR0d2VldHMsICRhdXRoT2JqLCBQcm9maWxlRmFjdG9yeSkge1xuICAkc2NvcGUudHdlZXRzID0gJHR3ZWV0cztcbiAgJHNjb3BlLmF1dGhPYmogPSAkYXV0aE9iajtcblxuICAkc2NvcGUuYXV0aE9iai4kb25BdXRoKGZ1bmN0aW9uKGF1dGhEYXRhKSB7XG4gICAgJHNjb3BlLmF1dGhEYXRhID0gYXV0aERhdGE7XG4gICAgJHNjb3BlLnByb2ZpbGUgPSBQcm9maWxlRmFjdG9yeShhdXRoRGF0YS51aWQpO1xuICB9KTtcblxuICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgJHNjb3BlLmF1dGhPYmouJHVuYXV0aCgpO1xuICB9O1xuXG4gICRzY29wZS5yZWdpc3RlciA9IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAkc2NvcGUuYXV0aE9iai4kY3JlYXRlVXNlcih1c2VyKVxuICAgIC50aGVuKGZ1bmN0aW9uKHVzZXJEYXRhKSB7XG4gICAgICBjb25zb2xlLmxvZygndXNlciBjcmVhdGVkOicsIHVzZXJEYXRhKTtcbiAgICAgIHJldHVybiAkc2NvcGUuYXV0aE9iai4kYXV0aFdpdGhQYXNzd29yZCh1c2VyKTtcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKGF1dGhEYXRhKSB7XG4gICAgICBjb25zb2xlLmxvZygndXNlciBsb2dnZWQgaW46JywgYXV0aERhdGEpO1xuICAgIH0pXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ2VycjonLCBlcnIpO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAkc2NvcGUuYXV0aE9iai4kYXV0aFdpdGhQYXNzd29yZCh1c2VyKVxuICAgIC50aGVuKGZ1bmN0aW9uKGF1dGhEYXRhKSB7XG4gICAgICBjb25zb2xlLmxvZygndXNlciBsb2dnZWQgaW46JywgYXV0aERhdGEpO1xuICAgIH0pXG4gICAgLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ2VycjonLCBlcnIpO1xuICAgIH0pO1xuICB9O1xuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmaXJlQXBwJyk7XG5cbmFwcC5jb250cm9sbGVyKCdwcm9maWxlQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHVpYk1vZGFsLCAkbG9nLCBwcm9maWxlKSB7XG4gICRzY29wZS5wcm9maWxlID0gcHJvZmlsZTtcblxuICAkc2NvcGUub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgICAgdGVtcGxhdGVVcmw6ICdodG1sL2VkaXRQcm9maWxlTW9kYWwuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnZWRpdFByb2ZpbGVNb2RhbEN0cmwnLFxuICAgICAgc2l6ZTogJ2xnJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgcHJvZmlsZVRvRWRpdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weSgkc2NvcGUucHJvZmlsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uKGVkaXRlZFByb2ZpbGUpIHtcbiAgICAgICRzY29wZS5wcm9maWxlLm5hbWUgPSBlZGl0ZWRQcm9maWxlLm5hbWU7XG4gICAgICAkc2NvcGUucHJvZmlsZS5jb2xvciA9IGVkaXRlZFByb2ZpbGUuY29sb3I7XG4gICAgICAkc2NvcGUucHJvZmlsZS4kc2F2ZSgpO1xuICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgJGxvZy5pbmZvKCdNb2RhbCBkaXNtaXNzZWQgYXQ6ICcgKyBuZXcgRGF0ZSgpKTtcbiAgICB9KTtcbiAgfTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignZWRpdFByb2ZpbGVNb2RhbEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlLCBwcm9maWxlVG9FZGl0KSB7XG4gICRzY29wZS5lZGl0UHJvZmlsZSA9IHByb2ZpbGVUb0VkaXQ7XG4gICRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoJHNjb3BlLmVkaXRQcm9maWxlKTtcbiAgfTtcbiAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoKTtcbiAgfTtcbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZpcmVBcHAnKTtcblxuYXBwLmNvbnRyb2xsZXIoJ3RocmVhZERldGFpbEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgdGhyZWFkLCBwb3N0cykge1xuXG4gICRzY29wZS50aHJlYWQgPSB0aHJlYWQ7XG4gICRzY29wZS5wb3N0cyA9IHBvc3RzOyAvLyBhbiBhcnJheSBvZiBwb3N0c1xuXG4gIC8vIGNvbnNvbGUubG9nKCd0aHJlYWREZXRhaWxDdHJsISEhJylcbiAgLy8gY29uc29sZS5sb2coJ3BhcmFtczogJywgJHN0YXRlLnBhcmFtcylcbiAgLy8gY29uc29sZS5sb2coJ3RocmVhZHM6ICcsIHRocmVhZHMpXG5cbiAgY29uc29sZS5sb2coJyRzY29wZS5hdXRoRGF0YTogJywgJHNjb3BlLmF1dGhEYXRhKVxuXG4gICRzY29wZS5hZGRUaHJlYWQgPSBmdW5jdGlvbigpIHtcblxuICAgIGNvbnNvbGUubG9nKCBcIm5ldyBwb3N0IVwiKVxuICAgICRzY29wZS5wb3N0cy4kYWRkKCRzY29wZS5uZXdQb3N0KTtcbiAgICAkc2NvcGUubmV3UG9zdCA9IHt9O1xuICB9O1xuXG4gIC8vICRzY29wZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgLy8gICAkc2NvcGUudGhyZWFkLiRyZW1vdmUoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAvLyAgICAgJHN0YXRlLmdvKCd0aHJlYWRzJyk7XG4gIC8vICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gIC8vICAgICBhbGVydCgnaGV5LCBlcnJvciBpbiBjb25zb2xlJylcbiAgLy8gICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgLy8gICB9KVxuICAvLyB9O1xuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmaXJlQXBwJyk7XG5cbmFwcC5jb250cm9sbGVyKCd0aHJlYWRzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHRocmVhZHMpIHtcbiAgY29uc29sZS5sb2coJ3RocmVhZHNDdHJsISEhIScpO1xuXG4gICRzY29wZS50aHJlYWRzID0gJHRocmVhZHMuZ2V0QXJyYXkoKTsgLy8gdGhyZWUtd2F5IGRhdGEtYmluZGluZ1xuXG4gICRzY29wZS50aHJlYWRzLiRsb2FkZWQoKS50aGVuKGZ1bmN0aW9uKHRocmVhZHMpIHtcbiAgICBjb25zb2xlLmxvZygnZmlyc3QgdGhyZWFkOicgLCB0aHJlYWRzWzBdKTtcbiAgfSlcblxuICAkc2NvcGUuYWRkVGhyZWFkID0gZnVuY3Rpb24oKSB7XG4gICAgJHRocmVhZHMuY3JlYXRlKCRzY29wZS5uZXdUaHJlYWQuc3ViamVjdClcbiAgICAvLyAudGhlbihmdW5jdGlvbihyZWYpIHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKCdyZWY6ICcsIHJlZik7XG4gICAgLy8gfSlcbiAgICAvLyAuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAvLyAgIGNvbnNvbGUubG9nKCdlcnI6ICcsIGVycik7XG4gICAgLy8gfSlcbiAgICAkc2NvcGUubmV3VGhyZWFkID0ge31cbiAgfTtcblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZmlyZUFwcCcpO1xuXG5hcHAuZmFjdG9yeSgnUHJvZmlsZUZhY3RvcnknLCBmdW5jdGlvbigkZmlyZWJhc2VPYmplY3QsIEZCX1VSTCkge1xuICByZXR1cm4gZnVuY3Rpb24odWlkKSB7XG4gICAgaWYoIXVpZCkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH07XG4gICAgdmFyIHByb2ZpbGVzUmVmID0gbmV3IEZpcmViYXNlKEZCX1VSTCArICdwcm9maWxlcycpO1xuICAgIHZhciB1c2VyUmVmID0gcHJvZmlsZXNSZWYuY2hpbGQodWlkKTtcbiAgICByZXR1cm4gJGZpcmViYXNlT2JqZWN0KHVzZXJSZWYpO1xuICB9O1xufSk7XG5cbmFwcC5mYWN0b3J5KCckdHdlZXRzJywgZnVuY3Rpb24oJGZpcmViYXNlQXJyYXksIEZCX1VSTCkge1xuICB2YXIgcmVmID0gbmV3IEZpcmViYXNlKEZCX1VSTCk7XG4gIHZhciB0d2VldHNSZWYgPSByZWYuY2hpbGQoJ3R3ZWV0cycpO1xuICByZXR1cm4gJGZpcmViYXNlQXJyYXkodHdlZXRzUmVmKTtcbn0pO1xuXG5hcHAuZmFjdG9yeSgnJGF1dGhPYmonLCBmdW5jdGlvbigkZmlyZWJhc2VBdXRoLCBGQl9VUkwpIHtcbiAgdmFyIHJlZiA9IG5ldyBGaXJlYmFzZShGQl9VUkwpO1xuICByZXR1cm4gJGZpcmViYXNlQXV0aChyZWYpO1xufSk7XG5cbmFwcC5zZXJ2aWNlKCckdGhyZWFkcycsIGZ1bmN0aW9uKCRmaXJlYmFzZUFycmF5LCAkZmlyZWJhc2VPYmplY3QsIEZCX1VSTCkge1xuICB2YXIgcmVmID0gbmV3IEZpcmViYXNlKEZCX1VSTCk7XG4gIHZhciB0aHJlYWRzUmVmID0gcmVmLmNoaWxkKCd0aHJlYWRzJyk7XG5cbiAgLy8gcmV0dXJuIHtcbiAgLy8gICBnZXRBcnJheTogZnVuY3Rpb24oKSB7XG4gIHRoaXMuZ2V0QXJyYXkgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAkZmlyZWJhc2VBcnJheSh0aHJlYWRzUmVmKTtcbiAgfTtcbiAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbihzdWJqZWN0KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXJyYXkoKS4kbG9hZGVkKClcbiAgICAgLnRoZW4oZnVuY3Rpb24odGhyZWFkcykge1xuICAgICAgIHJldHVybiB0aHJlYWRzLiRhZGQoe1xuICAgICAgICAgc3ViamVjdDogc3ViamVjdFxuICAgICAgIH0pO1xuICAgICB9KTtcbiAgfVxuXG4gIHRoaXMuZ2V0VGhyZWFkID0gZnVuY3Rpb24odGhyZWFkSWQpIHtcbiAgICB2YXIgc2luZ2xlVGhyZWFkUmVmID0gdGhyZWFkc1JlZi5jaGlsZCh0aHJlYWRJZCk7XG4gICAgcmV0dXJuICRmaXJlYmFzZU9iamVjdChzaW5nbGVUaHJlYWRSZWYpO1xuICB9O1xuXG4gIHRoaXMuZ2V0UG9zdHMgPSBmdW5jdGlvbih0aHJlYWRJZCkge1xuICAgIHZhciBwb3N0c1JlZiA9IHRocmVhZHNSZWYuY2hpbGQodGhyZWFkSWQpLmNoaWxkKCdwb3N0cycpO1xuICAgIHJldHVybiAkZmlyZWJhc2VBcnJheShwb3N0c1JlZilcbiAgfTtcbn0pO1xuXG5cbi8vICR0aHJlYWRzLmNyZWF0ZSgnYXByaWwgZm9vbHMhJylcbi8vIC50aGVuKGZ1bmN0aW9uKG5ld1RocmVhZFJlZikge1xuLy9cbi8vIH0pXG4vL1xuLy8gJHRocmVhZC5nZXRBcnJheSgpXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
