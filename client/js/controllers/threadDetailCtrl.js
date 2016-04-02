'use strict';

var app = angular.module('fireApp');

app.controller('threadDetailCtrl', function($scope, $state, thread, posts) {

  $scope.thread = thread;
  $scope.posts = posts; // an array of posts

  // console.log('threadDetailCtrl!!!')
  // console.log('params: ', $state.params)
  // console.log('threads: ', threads)

  console.log('$scope.authData: ', $scope.authData)

  $scope.addThread = function() {
    
    console.log( "new post!")
    $scope.posts.$add($scope.newPost);
    // $scope.newPost = {};
  };

  // $scope.remove = function() {
  //   $scope.thread.$remove().then(function() {
  //     $state.go('threads');
  //   }, function(err) {
  //     alert('hey, error in console')
  //     console.error(err);
  //   })
  // };

});
