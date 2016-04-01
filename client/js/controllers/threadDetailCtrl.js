'use strict';

var app = angular.module('fireApp');

app.controller('threadDetailCtrl', function($scope, $state) {

  console.log('threadDetailCtrl!!!')
  console.log('params: ', $state.params)
})
