// This is a manifest file that'll be compiled into including all the files listed below.
// Add new JavaScript/Coffee code in separate files in this directory and they'll automatically
// be included in the compiled file accessible from http://example.com/assets/application.js
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
//= require jquery
//= require jquery-ujs
//= require timeago

jQuery(document).ready(function() {
  jQuery("abbr.timeago").timeago();
	function RndRgb() {
		return parseInt(Math.random() * (0 - 255 + 1) + 255)
	}
<<<<<<< HEAD
    
});
=======
/*    $("*").css("background", 'rgb('+ RndRgb() +','+ RndRgb()+',' + RndRgb() +')')*/
});
>>>>>>> e5560a82d29d9971788c27e6cfc9149d7bd0e42b
