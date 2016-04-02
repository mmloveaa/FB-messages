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
    if ($scope.authData) {
      var newPost = {
        text: $scope.newPost.text,
        name: $scope.profile.name,
        color: $scope.profile.color
      };
      $scope.posts.$add(newPost);
      $scope.newPost = {};
    }
  };
}]);
// console.log( "new post!")
// $scope.posts.$add($scope.newPost);
// $scope.newPost = {};

// $scope.remove = function() {
//   $scope.thread.$remove().then(function() {
//     $state.go('threads');
//   }, function(err) {
//     alert('hey, error in console')
//     console.error(err);
//   })
// };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsImNvbnRyb2xsZXJzL21haW5DdHJsLmpzIiwiY29udHJvbGxlcnMvcHJvZmlsZUN0cmwuanMiLCJjb250cm9sbGVycy90aHJlYWREZXRhaWxDdHJsLmpzIiwiY29udHJvbGxlcnMvdGhyZWFkc0N0cmwuanMiLCJzZXJ2aWNlcy9mYWN0b3JpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUEsSUFBSSxNQUFNLFFBQVEsTUFBUixDQUFlLFNBQWYsRUFBMEIsQ0FBQyxVQUFELEVBQWEsV0FBYixFQUEwQixjQUExQixFQUEwQyxXQUExQyxDQUExQixDQUFOOztBQUVKLElBQUksUUFBSixDQUFhLFFBQWIsRUFBdUIsd0NBQXZCOztBQUVBLElBQUksTUFBSixDQUFJLENBQUEsZ0JBQUEsRUFBQSxvQkFBQSxFQUFPLFVBQVMsY0FBVCxFQUF5QixrQkFBekIsRUFBNkM7QUFDdEQsaUJBQ0csS0FESCxDQUNTLE1BRFQsRUFDaUIsRUFBRSxLQUFLLEdBQUwsRUFBVSxhQUFhLGdCQUFiLEVBRDdCLEVBRUcsS0FGSCxDQUVTLFNBRlQsRUFFb0I7QUFDaEIsU0FBSyxVQUFMO0FBQ0EsaUJBQWEsbUJBQWI7QUFDQSxnQkFBWSxhQUFaO0FBQ0EsYUFBUztBQUNQLGVBQUEsQ0FBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBUyxVQUFTLFFBQVQsRUFBbUIsY0FBbkIsRUFBbUM7QUFDMUMsZUFBTyxTQUFTLFlBQVQsR0FBd0IsSUFBeEIsQ0FBNkIsVUFBQSxRQUFBLEVBQUE7QUFDbEMsaUJBQU8sZUFBZSxTQUFTLEdBQVQsQ0FBZixDQUE2QixPQUE3QixFQUFQLENBRGtDO1NBQUEsQ0FBcEMsQ0FEMEM7T0FBbkMsQ0FBVDtLQURGO0dBTkosRUFjRyxLQWRILENBY1MsU0FkVCxFQWNvQjtBQUNoQixTQUFLLFVBQUw7QUFDQSxpQkFBYSxvQkFBYjtBQUNBLGdCQUFZLGFBQVo7R0FqQkosRUFtQkcsS0FuQkgsQ0FtQlMsZUFuQlQsRUFtQjBCO0FBQ3RCLFNBQUssMEJBQUw7QUFDQSxpQkFBYSx5QkFBYjtBQUNBLGdCQUFZLGtCQUFaO0FBQ0EsYUFBUztBQUNQLGNBQUEsQ0FBQSxVQUFBLEVBQUEsY0FBQSxFQUFRLFVBQVMsUUFBVCxFQUFrQixZQUFsQixFQUFnQztBQUN0QyxlQUFPLFNBQVMsU0FBVCxDQUFtQixhQUFhLFFBQWIsQ0FBbkIsQ0FBMEMsT0FBMUMsRUFBUDs7QUFEc0MsT0FBaEMsQ0FBUjtBQUlBLGFBQUEsQ0FBQSxVQUFBLEVBQUEsY0FBQSxFQUFPLFVBQVMsUUFBVCxFQUFrQixZQUFsQixFQUFnQztBQUNyQyxlQUFPLFNBQVMsUUFBVCxDQUFrQixhQUFhLFFBQWIsQ0FBbEIsQ0FBeUMsT0FBekMsRUFBUCxDQURxQztPQUFoQyxDQUFQO0tBTEY7R0F2QkosRUFEc0Q7O0FBbUN0RCxxQkFBbUIsU0FBbkIsQ0FBNkIsR0FBN0IsRUFuQ3NEO0NBQTdDLENBQVg7O0FBc0NBLElBQUksTUFBSixDQUFXLFNBQVgsRUFBc0IsWUFBVztBQUMvQixTQUFPLFVBQVMsS0FBVCxFQUFnQjtBQUNyQixXQUFPLE1BQU0sS0FBTixHQUFjLE9BQWQsRUFBUCxDQURxQjtHQUFoQixDQUR3QjtDQUFYLENBQXRCO0FDNUNBOztBQUVBLElBQUksTUFBTSxRQUFRLE1BQVIsQ0FBZSxTQUFmLENBQU47O0FBRUosSUFBSSxVQUFKLENBQWUsVUFBZixFQUFlLENBQUEsUUFBQSxFQUFBLFNBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBWSxVQUFTLE1BQVQsRUFBaUIsT0FBakIsRUFBMEIsUUFBMUIsRUFBb0MsY0FBcEMsRUFBb0Q7QUFDN0UsU0FBTyxNQUFQLEdBQWdCLE9BQWhCLENBRDZFO0FBRTdFLFNBQU8sT0FBUCxHQUFpQixRQUFqQixDQUY2RTs7QUFJN0UsU0FBTyxPQUFQLENBQWUsT0FBZixDQUF1QixVQUFTLFFBQVQsRUFBbUI7QUFDeEMsV0FBTyxRQUFQLEdBQWtCLFFBQWxCLENBRHdDO0FBRXhDLFdBQU8sT0FBUCxHQUFpQixlQUFlLFNBQVMsR0FBVCxDQUFoQyxDQUZ3QztHQUFuQixDQUF2QixDQUo2RTs7QUFTN0UsU0FBTyxNQUFQLEdBQWdCLFlBQVc7QUFDekIsV0FBTyxPQUFQLENBQWUsT0FBZixHQUR5QjtHQUFYLENBVDZEOztBQWE3RSxTQUFPLFFBQVAsR0FBa0IsVUFBUyxJQUFULEVBQWU7QUFDL0IsV0FBTyxPQUFQLENBQWUsV0FBZixDQUEyQixJQUEzQixFQUNDLElBREQsQ0FDTSxVQUFTLFFBQVQsRUFBbUI7QUFDdkIsY0FBUSxHQUFSLENBQVksZUFBWixFQUE2QixRQUE3QixFQUR1QjtBQUV2QixhQUFPLE9BQU8sT0FBUCxDQUFlLGlCQUFmLENBQWlDLElBQWpDLENBQVAsQ0FGdUI7S0FBbkIsQ0FETixDQUtDLElBTEQsQ0FLTSxVQUFTLFFBQVQsRUFBbUI7QUFDdkIsY0FBUSxHQUFSLENBQVksaUJBQVosRUFBK0IsUUFBL0IsRUFEdUI7S0FBbkIsQ0FMTixDQVFDLEtBUkQsQ0FRTyxVQUFTLEdBQVQsRUFBYztBQUNuQixjQUFRLEdBQVIsQ0FBWSxNQUFaLEVBQW9CLEdBQXBCLEVBRG1CO0tBQWQsQ0FSUCxDQUQrQjtHQUFmLENBYjJEOztBQTJCN0UsU0FBTyxLQUFQLEdBQWUsVUFBUyxJQUFULEVBQWU7QUFDNUIsV0FBTyxPQUFQLENBQWUsaUJBQWYsQ0FBaUMsSUFBakMsRUFDQyxJQURELENBQ00sVUFBUyxRQUFULEVBQW1CO0FBQ3ZCLGNBQVEsR0FBUixDQUFZLGlCQUFaLEVBQStCLFFBQS9CLEVBRHVCO0tBQW5CLENBRE4sQ0FJQyxLQUpELENBSU8sVUFBUyxHQUFULEVBQWM7QUFDbkIsY0FBUSxHQUFSLENBQVksTUFBWixFQUFvQixHQUFwQixFQURtQjtLQUFkLENBSlAsQ0FENEI7R0FBZixDQTNCOEQ7Q0FBcEQsQ0FBM0I7QUNKQTs7QUFFQSxJQUFJLE1BQU0sUUFBUSxNQUFSLENBQWUsU0FBZixDQUFOOztBQUVKLElBQUksVUFBSixDQUFlLGFBQWYsRUFBZSxDQUFBLFFBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBZSxVQUFTLE1BQVQsRUFBaUIsU0FBakIsRUFBNEIsSUFBNUIsRUFBa0MsT0FBbEMsRUFBMkM7QUFDdkUsU0FBTyxPQUFQLEdBQWlCLE9BQWpCLENBRHVFOztBQUd2RSxTQUFPLElBQVAsR0FBYyxZQUFXO0FBQ3ZCLFFBQUksZ0JBQWdCLFVBQVUsSUFBVixDQUFlO0FBQ2pDLGlCQUFXLElBQVg7QUFDQSxtQkFBYSw0QkFBYjtBQUNBLGtCQUFZLHNCQUFaO0FBQ0EsWUFBTSxJQUFOO0FBQ0EsZUFBUztBQUNQLHVCQUFlLHlCQUFXO0FBQ3hCLGlCQUFPLFFBQVEsSUFBUixDQUFhLE9BQU8sT0FBUCxDQUFwQixDQUR3QjtTQUFYO09BRGpCO0tBTGtCLENBQWhCLENBRG1CO0FBWXZCLGtCQUFjLE1BQWQsQ0FBcUIsSUFBckIsQ0FBMEIsVUFBUyxhQUFULEVBQXdCO0FBQ2hELGFBQU8sT0FBUCxDQUFlLElBQWYsR0FBc0IsY0FBYyxJQUFkLENBRDBCO0FBRWhELGFBQU8sT0FBUCxDQUFlLEtBQWYsR0FBdUIsY0FBYyxLQUFkLENBRnlCO0FBR2hELGFBQU8sT0FBUCxDQUFlLEtBQWYsR0FIZ0Q7S0FBeEIsRUFJdkIsWUFBVztBQUNaLFdBQUssSUFBTCxDQUFVLHlCQUF5QixJQUFJLElBQUosRUFBekIsQ0FBVixDQURZO0tBQVgsQ0FKSCxDQVp1QjtHQUFYLENBSHlEO0NBQTNDLENBQTlCOztBQXlCQSxJQUFJLFVBQUosQ0FBZSxzQkFBZixFQUFlLENBQUEsUUFBQSxFQUFBLG1CQUFBLEVBQUEsZUFBQSxFQUF3QixVQUFTLE1BQVQsRUFBaUIsaUJBQWpCLEVBQW9DLGFBQXBDLEVBQW1EO0FBQ3hGLFNBQU8sV0FBUCxHQUFxQixhQUFyQixDQUR3RjtBQUV4RixTQUFPLElBQVAsR0FBYyxZQUFXO0FBQ3ZCLHNCQUFrQixLQUFsQixDQUF3QixPQUFPLFdBQVAsQ0FBeEIsQ0FEdUI7R0FBWCxDQUYwRTtBQUt4RixTQUFPLE1BQVAsR0FBZ0IsWUFBVztBQUN6QixzQkFBa0IsT0FBbEIsR0FEeUI7R0FBWCxDQUx3RTtDQUFuRCxDQUF2QztBQzdCQTs7QUFFQSxJQUFJLE1BQU0sUUFBUSxNQUFSLENBQWUsU0FBZixDQUFOOztBQUVKLElBQUksVUFBSixDQUFlLGtCQUFmLEVBQWUsQ0FBQSxRQUFBLEVBQUEsUUFBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQW9CLFVBQVMsTUFBVCxFQUFpQixNQUFqQixFQUF5QixNQUF6QixFQUFpQyxLQUFqQyxFQUF3Qzs7QUFFekUsU0FBTyxNQUFQLEdBQWdCLE1BQWhCLENBRnlFO0FBR3pFLFNBQU8sS0FBUCxHQUFlLEtBQWY7Ozs7OztBQUh5RSxTQVN6RSxDQUFRLEdBQVIsQ0FBWSxtQkFBWixFQUFpQyxPQUFPLFFBQVAsQ0FBakMsQ0FUeUU7O0FBV3pFLFNBQU8sU0FBUCxHQUFtQixZQUFXO0FBQzVCLFFBQUcsT0FBTyxRQUFQLEVBQWdCO0FBQ2pCLFVBQUksVUFBVTtBQUNaLGNBQU0sT0FBTyxPQUFQLENBQWUsSUFBZjtBQUNOLGNBQU0sT0FBTyxPQUFQLENBQWUsSUFBZjtBQUNOLGVBQU8sT0FBTyxPQUFQLENBQWUsS0FBZjtPQUhMLENBRGE7QUFNakIsYUFBTyxLQUFQLENBQWEsSUFBYixDQUFrQixPQUFsQixFQU5pQjtBQU9qQixhQUFPLE9BQVAsR0FBaUIsRUFBakIsQ0FQaUI7S0FBbkI7R0FEaUIsQ0FYc0Q7Q0FBeEMsQ0FBbkM7Ozs7Ozs7Ozs7Ozs7QUNKQTs7QUFFQSxJQUFJLE1BQU0sUUFBUSxNQUFSLENBQWUsU0FBZixDQUFOOztBQUVKLElBQUksVUFBSixDQUFlLGFBQWYsRUFBZSxDQUFBLFFBQUEsRUFBQSxVQUFBLEVBQWUsVUFBUyxNQUFULEVBQWlCLFFBQWpCLEVBQTJCO0FBQ3ZELFVBQVEsR0FBUixDQUFZLGlCQUFaLEVBRHVEOztBQUd2RCxTQUFPLE9BQVAsR0FBaUIsU0FBUyxRQUFULEVBQWpCOztBQUh1RCxRQUt2RCxDQUFPLE9BQVAsQ0FBZSxPQUFmLEdBQXlCLElBQXpCLENBQThCLFVBQVMsT0FBVCxFQUFrQjtBQUM5QyxZQUFRLEdBQVIsQ0FBWSxlQUFaLEVBQThCLFFBQVEsQ0FBUixDQUE5QixFQUQ4QztHQUFsQixDQUE5QixDQUx1RDs7QUFTdkQsU0FBTyxTQUFQLEdBQW1CLFlBQVc7QUFDNUIsYUFBUyxNQUFULENBQWdCLE9BQU8sU0FBUCxDQUFpQixPQUFqQixDQUFoQjs7Ozs7OztBQUQ0QixVQVE1QixDQUFPLFNBQVAsR0FBbUIsRUFBbkIsQ0FSNEI7R0FBWCxDQVRvQztDQUEzQixDQUE5QjtBQ0pBOztBQUVBLElBQUksTUFBTSxRQUFRLE1BQVIsQ0FBZSxTQUFmLENBQU47O0FBRUosSUFBSSxPQUFKLENBQVksZ0JBQVosRUFBWSxDQUFBLGlCQUFBLEVBQUEsUUFBQSxFQUFrQixVQUFTLGVBQVQsRUFBMEIsTUFBMUIsRUFBa0M7QUFDOUQsU0FBTyxVQUFTLEdBQVQsRUFBYztBQUNuQixRQUFHLENBQUMsR0FBRCxFQUFNO0FBQ1AsYUFBTyxFQUFQLENBRE87S0FBVCxDQURtQjtBQUluQixRQUFJLGNBQWMsSUFBSSxRQUFKLENBQWEsU0FBUyxVQUFULENBQTNCLENBSmU7QUFLbkIsUUFBSSxVQUFVLFlBQVksS0FBWixDQUFrQixHQUFsQixDQUFWLENBTGU7QUFNbkIsV0FBTyxnQkFBZ0IsT0FBaEIsQ0FBUCxDQU5tQjtHQUFkLENBRHVEO0NBQWxDLENBQTlCOztBQVdBLElBQUksT0FBSixDQUFZLFNBQVosRUFBWSxDQUFBLGdCQUFBLEVBQUEsUUFBQSxFQUFXLFVBQVMsY0FBVCxFQUF5QixNQUF6QixFQUFpQztBQUN0RCxNQUFJLE1BQU0sSUFBSSxRQUFKLENBQWEsTUFBYixDQUFOLENBRGtEO0FBRXRELE1BQUksWUFBWSxJQUFJLEtBQUosQ0FBVSxRQUFWLENBQVosQ0FGa0Q7QUFHdEQsU0FBTyxlQUFlLFNBQWYsQ0FBUCxDQUhzRDtDQUFqQyxDQUF2Qjs7QUFNQSxJQUFJLE9BQUosQ0FBWSxVQUFaLEVBQVksQ0FBQSxlQUFBLEVBQUEsUUFBQSxFQUFZLFVBQVMsYUFBVCxFQUF3QixNQUF4QixFQUFnQztBQUN0RCxNQUFJLE1BQU0sSUFBSSxRQUFKLENBQWEsTUFBYixDQUFOLENBRGtEO0FBRXRELFNBQU8sY0FBYyxHQUFkLENBQVAsQ0FGc0Q7Q0FBaEMsQ0FBeEI7O0FBS0EsSUFBSSxPQUFKLENBQVksVUFBWixFQUFZLENBQUEsZ0JBQUEsRUFBQSxpQkFBQSxFQUFBLFFBQUEsRUFBWSxVQUFTLGNBQVQsRUFBeUIsZUFBekIsRUFBMEMsTUFBMUMsRUFBa0Q7QUFDeEUsTUFBSSxNQUFNLElBQUksUUFBSixDQUFhLE1BQWIsQ0FBTixDQURvRTtBQUV4RSxNQUFJLGFBQWEsSUFBSSxLQUFKLENBQVUsU0FBVixDQUFiOzs7O0FBRm9FLE1BTXhFLENBQUssUUFBTCxHQUFnQixZQUFVO0FBQ3hCLFdBQU8sZUFBZSxVQUFmLENBQVAsQ0FEd0I7R0FBVixDQU53RDtBQVN4RSxPQUFLLE1BQUwsR0FBYyxVQUFTLE9BQVQsRUFBa0I7QUFDOUIsV0FBTyxLQUFLLFFBQUwsR0FBZ0IsT0FBaEIsR0FDTCxJQURLLENBQ0EsVUFBUyxPQUFULEVBQWtCO0FBQ3RCLGFBQU8sUUFBUSxJQUFSLENBQWE7QUFDbEIsaUJBQVMsT0FBVDtPQURLLENBQVAsQ0FEc0I7S0FBbEIsQ0FEUCxDQUQ4QjtHQUFsQixDQVQwRDs7QUFrQnhFLE9BQUssU0FBTCxHQUFpQixVQUFTLFFBQVQsRUFBbUI7QUFDbEMsUUFBSSxrQkFBa0IsV0FBVyxLQUFYLENBQWlCLFFBQWpCLENBQWxCLENBRDhCO0FBRWxDLFdBQU8sZ0JBQWdCLGVBQWhCLENBQVAsQ0FGa0M7R0FBbkIsQ0FsQnVEOztBQXVCeEUsT0FBSyxRQUFMLEdBQWdCLFVBQVMsUUFBVCxFQUFtQjtBQUNqQyxRQUFJLFdBQVcsV0FBVyxLQUFYLENBQWlCLFFBQWpCLEVBQTJCLEtBQTNCLENBQWlDLE9BQWpDLENBQVgsQ0FENkI7QUFFakMsV0FBTyxlQUFlLFFBQWYsQ0FBUCxDQUZpQztHQUFuQixDQXZCd0Q7Q0FBbEQsQ0FBeEIiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZpcmVBcHAnLCBbJ2ZpcmViYXNlJywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJ10pO1xuXG5hcHAuY29uc3RhbnQoJ0ZCX1VSTCcsICdodHRwczovL21lc3NhZ2UxMDEtYXBwLmZpcmViYXNlaW8uY29tLycpO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbiAgJHN0YXRlUHJvdmlkZXJcbiAgICAuc3RhdGUoJ2hvbWUnLCB7IHVybDogJy8nLCB0ZW1wbGF0ZVVybDogJ2h0bWwvaG9tZS5odG1sJyB9KVxuICAgIC5zdGF0ZSgncHJvZmlsZScsIHtcbiAgICAgIHVybDogJy9wcm9maWxlJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnaHRtbC9wcm9maWxlLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ3Byb2ZpbGVDdHJsJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgcHJvZmlsZTogZnVuY3Rpb24oJGF1dGhPYmosIFByb2ZpbGVGYWN0b3J5KSB7XG4gICAgICAgICAgcmV0dXJuICRhdXRoT2JqLiRyZXF1aXJlQXV0aCgpLnRoZW4oKGF1dGhEYXRhKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gUHJvZmlsZUZhY3RvcnkoYXV0aERhdGEudWlkKS4kbG9hZGVkKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIC5zdGF0ZSgndGhyZWFkcycsIHtcbiAgICAgIHVybDogJy90aHJlYWRzJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnL2h0bWwvdGhyZWFkcy5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICd0aHJlYWRzQ3RybCdcbiAgICB9KVxuICAgIC5zdGF0ZSgndGhyZWFkLWRldGFpbCcsIHtcbiAgICAgIHVybDogJy90aHJlYWQtZGV0YWlsLzp0aHJlYWRJZCcsXG4gICAgICB0ZW1wbGF0ZVVybDogJy9odG1sL3RocmVhZERldGFpbC5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICd0aHJlYWREZXRhaWxDdHJsJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgdGhyZWFkOiBmdW5jdGlvbigkdGhyZWFkcywkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgICByZXR1cm4gJHRocmVhZHMuZ2V0VGhyZWFkKCRzdGF0ZVBhcmFtcy50aHJlYWRJZCkuJGxvYWRlZCgpOyAvLyAkZmlyZWJhc2VPYmplY3RcbiAgICAgICAgICAvLyByZXR1cm4gdGhlIHByb21pc2UgdGhhdCB3aWxsIHJlc29sdmUgaW50byBvdXIgbG9hZGVkIHRocmVhZFxuICAgICAgICB9LFxuICAgICAgICBwb3N0czogZnVuY3Rpb24oJHRocmVhZHMsJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgICAgcmV0dXJuICR0aHJlYWRzLmdldFBvc3RzKCRzdGF0ZVBhcmFtcy50aHJlYWRJZCkuJGxvYWRlZCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG59KTtcblxuYXBwLmZpbHRlcigncmV2ZXJzZScsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oaXRlbXMpIHtcbiAgICByZXR1cm4gaXRlbXMuc2xpY2UoKS5yZXZlcnNlKCk7XG4gIH07XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmaXJlQXBwJyk7XG5cbmFwcC5jb250cm9sbGVyKCdtYWluQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHR3ZWV0cywgJGF1dGhPYmosIFByb2ZpbGVGYWN0b3J5KSB7XG4gICRzY29wZS50d2VldHMgPSAkdHdlZXRzO1xuICAkc2NvcGUuYXV0aE9iaiA9ICRhdXRoT2JqO1xuXG4gICRzY29wZS5hdXRoT2JqLiRvbkF1dGgoZnVuY3Rpb24oYXV0aERhdGEpIHtcbiAgICAkc2NvcGUuYXV0aERhdGEgPSBhdXRoRGF0YTtcbiAgICAkc2NvcGUucHJvZmlsZSA9IFByb2ZpbGVGYWN0b3J5KGF1dGhEYXRhLnVpZCk7XG4gIH0pO1xuXG4gICRzY29wZS5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUuYXV0aE9iai4kdW5hdXRoKCk7XG4gIH07XG5cbiAgJHNjb3BlLnJlZ2lzdGVyID0gZnVuY3Rpb24odXNlcikge1xuICAgICRzY29wZS5hdXRoT2JqLiRjcmVhdGVVc2VyKHVzZXIpXG4gICAgLnRoZW4oZnVuY3Rpb24odXNlckRhdGEpIHtcbiAgICAgIGNvbnNvbGUubG9nKCd1c2VyIGNyZWF0ZWQ6JywgdXNlckRhdGEpO1xuICAgICAgcmV0dXJuICRzY29wZS5hdXRoT2JqLiRhdXRoV2l0aFBhc3N3b3JkKHVzZXIpO1xuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24oYXV0aERhdGEpIHtcbiAgICAgIGNvbnNvbGUubG9nKCd1c2VyIGxvZ2dlZCBpbjonLCBhdXRoRGF0YSk7XG4gICAgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnZXJyOicsIGVycik7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24odXNlcikge1xuICAgICRzY29wZS5hdXRoT2JqLiRhdXRoV2l0aFBhc3N3b3JkKHVzZXIpXG4gICAgLnRoZW4oZnVuY3Rpb24oYXV0aERhdGEpIHtcbiAgICAgIGNvbnNvbGUubG9nKCd1c2VyIGxvZ2dlZCBpbjonLCBhdXRoRGF0YSk7XG4gICAgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnZXJyOicsIGVycik7XG4gICAgfSk7XG4gIH07XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZpcmVBcHAnKTtcblxuYXBwLmNvbnRyb2xsZXIoJ3Byb2ZpbGVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkdWliTW9kYWwsICRsb2csIHByb2ZpbGUpIHtcbiAgJHNjb3BlLnByb2ZpbGUgPSBwcm9maWxlO1xuXG4gICRzY29wZS5vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICBhbmltYXRpb246IHRydWUsXG4gICAgICB0ZW1wbGF0ZVVybDogJ2h0bWwvZWRpdFByb2ZpbGVNb2RhbC5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdlZGl0UHJvZmlsZU1vZGFsQ3RybCcsXG4gICAgICBzaXplOiAnbGcnLFxuICAgICAgcmVzb2x2ZToge1xuICAgICAgICBwcm9maWxlVG9FZGl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KCRzY29wZS5wcm9maWxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24oZWRpdGVkUHJvZmlsZSkge1xuICAgICAgJHNjb3BlLnByb2ZpbGUubmFtZSA9IGVkaXRlZFByb2ZpbGUubmFtZTtcbiAgICAgICRzY29wZS5wcm9maWxlLmNvbG9yID0gZWRpdGVkUHJvZmlsZS5jb2xvcjtcbiAgICAgICRzY29wZS5wcm9maWxlLiRzYXZlKCk7XG4gICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAkbG9nLmluZm8oJ01vZGFsIGRpc21pc3NlZCBhdDogJyArIG5ldyBEYXRlKCkpO1xuICAgIH0pO1xuICB9O1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdlZGl0UHJvZmlsZU1vZGFsQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UsIHByb2ZpbGVUb0VkaXQpIHtcbiAgJHNjb3BlLmVkaXRQcm9maWxlID0gcHJvZmlsZVRvRWRpdDtcbiAgJHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSgkc2NvcGUuZWRpdFByb2ZpbGUpO1xuICB9O1xuICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygpO1xuICB9O1xufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZmlyZUFwcCcpO1xuXG5hcHAuY29udHJvbGxlcigndGhyZWFkRGV0YWlsQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCB0aHJlYWQsIHBvc3RzKSB7XG5cbiAgJHNjb3BlLnRocmVhZCA9IHRocmVhZDtcbiAgJHNjb3BlLnBvc3RzID0gcG9zdHM7IC8vIGFuIGFycmF5IG9mIHBvc3RzXG5cbiAgLy8gY29uc29sZS5sb2coJ3RocmVhZERldGFpbEN0cmwhISEnKVxuICAvLyBjb25zb2xlLmxvZygncGFyYW1zOiAnLCAkc3RhdGUucGFyYW1zKVxuICAvLyBjb25zb2xlLmxvZygndGhyZWFkczogJywgdGhyZWFkcylcblxuICBjb25zb2xlLmxvZygnJHNjb3BlLmF1dGhEYXRhOiAnLCAkc2NvcGUuYXV0aERhdGEpXG5cbiAgJHNjb3BlLmFkZFRocmVhZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmKCRzY29wZS5hdXRoRGF0YSl7XG4gICAgICB2YXIgbmV3UG9zdCA9IHtcbiAgICAgICAgdGV4dDogJHNjb3BlLm5ld1Bvc3QudGV4dCxcbiAgICAgICAgbmFtZTogJHNjb3BlLnByb2ZpbGUubmFtZSxcbiAgICAgICAgY29sb3I6ICRzY29wZS5wcm9maWxlLmNvbG9yXG4gICAgICB9O1xuICAgICAgJHNjb3BlLnBvc3RzLiRhZGQobmV3UG9zdCk7XG4gICAgICAkc2NvcGUubmV3UG9zdCA9IHt9O1xuICAgIH1cbiAgfTtcbn0pO1xuICAgIC8vIGNvbnNvbGUubG9nKCBcIm5ldyBwb3N0IVwiKVxuICAgIC8vICRzY29wZS5wb3N0cy4kYWRkKCRzY29wZS5uZXdQb3N0KTtcbiAgICAvLyAkc2NvcGUubmV3UG9zdCA9IHt9O1xuXG4gIC8vICRzY29wZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgLy8gICAkc2NvcGUudGhyZWFkLiRyZW1vdmUoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAvLyAgICAgJHN0YXRlLmdvKCd0aHJlYWRzJyk7XG4gIC8vICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gIC8vICAgICBhbGVydCgnaGV5LCBlcnJvciBpbiBjb25zb2xlJylcbiAgLy8gICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgLy8gICB9KVxuICAvLyB9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZpcmVBcHAnKTtcblxuYXBwLmNvbnRyb2xsZXIoJ3RocmVhZHNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkdGhyZWFkcykge1xuICBjb25zb2xlLmxvZygndGhyZWFkc0N0cmwhISEhJyk7XG5cbiAgJHNjb3BlLnRocmVhZHMgPSAkdGhyZWFkcy5nZXRBcnJheSgpOyAvLyB0aHJlZS13YXkgZGF0YS1iaW5kaW5nXG5cbiAgJHNjb3BlLnRocmVhZHMuJGxvYWRlZCgpLnRoZW4oZnVuY3Rpb24odGhyZWFkcykge1xuICAgIGNvbnNvbGUubG9nKCdmaXJzdCB0aHJlYWQ6JyAsIHRocmVhZHNbMF0pO1xuICB9KVxuXG4gICRzY29wZS5hZGRUaHJlYWQgPSBmdW5jdGlvbigpIHtcbiAgICAkdGhyZWFkcy5jcmVhdGUoJHNjb3BlLm5ld1RocmVhZC5zdWJqZWN0KVxuICAgIC8vIC50aGVuKGZ1bmN0aW9uKHJlZikge1xuICAgIC8vICAgY29uc29sZS5sb2coJ3JlZjogJywgcmVmKTtcbiAgICAvLyB9KVxuICAgIC8vIC5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgIC8vICAgY29uc29sZS5sb2coJ2VycjogJywgZXJyKTtcbiAgICAvLyB9KVxuICAgICRzY29wZS5uZXdUaHJlYWQgPSB7fVxuICB9O1xuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmaXJlQXBwJyk7XG5cbmFwcC5mYWN0b3J5KCdQcm9maWxlRmFjdG9yeScsIGZ1bmN0aW9uKCRmaXJlYmFzZU9iamVjdCwgRkJfVVJMKSB7XG4gIHJldHVybiBmdW5jdGlvbih1aWQpIHtcbiAgICBpZighdWlkKSB7XG4gICAgICByZXR1cm4ge307XG4gICAgfTtcbiAgICB2YXIgcHJvZmlsZXNSZWYgPSBuZXcgRmlyZWJhc2UoRkJfVVJMICsgJ3Byb2ZpbGVzJyk7XG4gICAgdmFyIHVzZXJSZWYgPSBwcm9maWxlc1JlZi5jaGlsZCh1aWQpO1xuICAgIHJldHVybiAkZmlyZWJhc2VPYmplY3QodXNlclJlZik7XG4gIH07XG59KTtcblxuYXBwLmZhY3RvcnkoJyR0d2VldHMnLCBmdW5jdGlvbigkZmlyZWJhc2VBcnJheSwgRkJfVVJMKSB7XG4gIHZhciByZWYgPSBuZXcgRmlyZWJhc2UoRkJfVVJMKTtcbiAgdmFyIHR3ZWV0c1JlZiA9IHJlZi5jaGlsZCgndHdlZXRzJyk7XG4gIHJldHVybiAkZmlyZWJhc2VBcnJheSh0d2VldHNSZWYpO1xufSk7XG5cbmFwcC5mYWN0b3J5KCckYXV0aE9iaicsIGZ1bmN0aW9uKCRmaXJlYmFzZUF1dGgsIEZCX1VSTCkge1xuICB2YXIgcmVmID0gbmV3IEZpcmViYXNlKEZCX1VSTCk7XG4gIHJldHVybiAkZmlyZWJhc2VBdXRoKHJlZik7XG59KTtcblxuYXBwLnNlcnZpY2UoJyR0aHJlYWRzJywgZnVuY3Rpb24oJGZpcmViYXNlQXJyYXksICRmaXJlYmFzZU9iamVjdCwgRkJfVVJMKSB7XG4gIHZhciByZWYgPSBuZXcgRmlyZWJhc2UoRkJfVVJMKTtcbiAgdmFyIHRocmVhZHNSZWYgPSByZWYuY2hpbGQoJ3RocmVhZHMnKTtcblxuICAvLyByZXR1cm4ge1xuICAvLyAgIGdldEFycmF5OiBmdW5jdGlvbigpIHtcbiAgdGhpcy5nZXRBcnJheSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICRmaXJlYmFzZUFycmF5KHRocmVhZHNSZWYpO1xuICB9O1xuICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uKHN1YmplY3QpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBcnJheSgpLiRsb2FkZWQoKVxuICAgICAudGhlbihmdW5jdGlvbih0aHJlYWRzKSB7XG4gICAgICAgcmV0dXJuIHRocmVhZHMuJGFkZCh7XG4gICAgICAgICBzdWJqZWN0OiBzdWJqZWN0XG4gICAgICAgfSk7XG4gICAgIH0pO1xuICB9XG5cbiAgdGhpcy5nZXRUaHJlYWQgPSBmdW5jdGlvbih0aHJlYWRJZCkge1xuICAgIHZhciBzaW5nbGVUaHJlYWRSZWYgPSB0aHJlYWRzUmVmLmNoaWxkKHRocmVhZElkKTtcbiAgICByZXR1cm4gJGZpcmViYXNlT2JqZWN0KHNpbmdsZVRocmVhZFJlZik7XG4gIH07XG5cbiAgdGhpcy5nZXRQb3N0cyA9IGZ1bmN0aW9uKHRocmVhZElkKSB7XG4gICAgdmFyIHBvc3RzUmVmID0gdGhyZWFkc1JlZi5jaGlsZCh0aHJlYWRJZCkuY2hpbGQoJ3Bvc3RzJyk7XG4gICAgcmV0dXJuICRmaXJlYmFzZUFycmF5KHBvc3RzUmVmKVxuICB9O1xufSk7XG5cblxuLy8gJHRocmVhZHMuY3JlYXRlKCdhcHJpbCBmb29scyEnKVxuLy8gLnRoZW4oZnVuY3Rpb24obmV3VGhyZWFkUmVmKSB7XG4vL1xuLy8gfSlcbi8vXG4vLyAkdGhyZWFkLmdldEFycmF5KClcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
