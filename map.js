const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

var map;

function initMap() {
	map = new google.maps.Map(
	  document.getElementById('map'), {
	  	center: {
            lat: 37.3230,
            lng: -122.0322
        },
        zoom: 14
	  }
	);
	addMarker({lat: 37.3230, lng: -122.0322}, "Sample Event", "Come join us at this sample event!", new Date("July 24 2020 12:00:00"), new Date("July 24 2020 15:00:00"));
}

function formatDate(date) {
	var hour = (date.getHours() % 12 == 0) ? 12 : date.getHours() % 12;
	var ampm = (date.getHours() > 11) ? "pm" : "am";
	var minute = (date.getMinutes() < 10) ? ("0" + date.getMinutes()) : date.getMinutes()
	var full = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ", " + hour + ":" + minute + ampm;
	return full;
}

function addMarker(position, title, description, start, end, id) {
	var marker = new google.maps.Marker({
	  	position: position, 
	  	map: map
  	});

  	/*var contentString = '<div id="content">'+
      '<div id="siteNotice">'+
      '</div>'+
      '<h4 id="firstHeading" class="firstHeading" style="margin-bottom: 15px">' + title + '</h4>'+
      '<div id="bodyContent">'+
      '<p>' + description +
      '<p>'+ month + ' ' + day + ', ' + year + '</p>'+
      '<p>'+ start + ' to ' + end + '</p>'+
      '</div>'+
      '</div>';*/
  	marker.addListener('click', function() {
    	var today = new Date();
    	var contentString = "";
    	if (start < today && today < end) {
    		contentString = '<div id="content">'+
		      '<div id="siteNotice">'+
		      '</div>'+
		      '<h4 id="firstHeading" class="firstHeading" style="margin-bottom: 15px">' + title + '</h4>'+
		      '<div id="bodyContent">'+
		      '<p style="font-size: 16px">' + description + '</p>'+ 
		      '<p style="font-size: 16px">' + 'Ongoing until ' + formatDate(end) + '</p>'+
		      '<button id=\"" + ' + id + ' + "_button\" class="btn btn-primary">Check In</button>' +
		      '</div>'+
		      '</div>';
    	} else {
    		contentString = '<div id="content">'+
		      '<div id="siteNotice">'+
		      '</div>'+
		      '<h4 id="firstHeading" class="firstHeading" style="margin-bottom: 15px">' + title + '</h4>'+
		      '<div id="bodyContent">'+
		      '<p style="font-size: 16px">' + description + '</p>' +
		      '<p style="font-size: 16px">' + formatDate(start) + ' to ' + formatDate(end) + '</p>' +
		      '<button id=\"" + ' + id + ' + "_button\" class="btn btn-primary">Check In</button>' +
		      '</div>'+
		      '</div>';
    	}
    	var infoWindow = new google.maps.InfoWindow({
	  		content: contentString
	  	});
    	infoWindow.open(map, marker);
		
  	});
}
