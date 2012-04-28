$("document").ready(function() {

	var map = new L.Map('map'),
		cloudmadeUrl = 'http://{s}.tile.cloudmade.com/903a54a369114f6580f12400d931ece6/997/256/{z}/{x}/{y}.png',
		cloudmadeAttrib = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',
		cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttrib}),
		salisbury = new L.LatLng(38.36627, -75.60006);
	var	bldgTileURL = 'http://nickchamberlain.cartodb.com/tiles/buildings/{z}/{x}/{y}.png',
		bldgTiles = new L.TileLayer(bldgTileURL);
	var markerGroup = new L.LayerGroup();
		overlayGroup = new L.LayerGroup();
	
function refreshMap () {
	map.setView(salisbury, 13)
	.addLayer(cloudmade)
	.addLayer(bldgTiles);
	markerGroup.clearLayers();
	overlayGroup.clearLayers();
}//resets map zoom and center, clears all markers
refreshMap();

$("form").submit(function(event) {
	event.preventDefault();
	if ($("#street").val() != "") {
		//refreshMap();
		markerGroup.clearLayers();
		overlayGroup.clearLayers();
		var street = $("#street").val();
		var zip = $("#zip").val();
		var geocode_url = 'http://mdimap.towson.edu/ArcGIS/rest/services/GeocodeServices/MD.State.MDStatewideLocator_LatLong/GeocodeServer/findAddressCandidates?Street=' + street + '&Zone=' + zip + '&outFields=&f=json&callback=?';
		var xhr = $.getJSON(geocode_url, function (data) {
			if (data.candidates[0]) {
				var x = data.candidates[0].location.x;
				var y = data.candidates[0].location.y;
				var loc = new L.LatLng(y,x);
				var locMarker = new L.Marker(loc, {draggable: true});
					markerGroup.addLayer(locMarker);
					map.addLayer(markerGroup);
					map.setView(loc,16);
				var rad = 350;
					drawCircle(loc);
					getHydrantGeoJSON(loc);
				// listeners for .distance range input and dragging the marker
				locMarker.on('drag', function(e) {
					mrkLatLng = locMarker.getLatLng();
					loc = new L.LatLng(mrkLatLng.lat, mrkLatLng.lng);
					overlayGroup.clearLayers();
					drawCircle(loc);
					var rad = $(".distance").val();
					getHydrantGeoJSON(loc,rad);
				});
				$("#slider").bind("slide", function() {
					overlayGroup.clearLayers();
					drawCircle(loc);
				});
				$("#slider").bind("slidestop", function() {
					var rad = $("#slider").slider("value");
					overlayGroup.clearLayers();
					getHydrantGeoJSON(loc,rad);
					drawCircle(loc);
				});

			} else {
				refreshMap();
				$('#street').val('Address Invalid');
			};//test address and geocode it if a location is returned by the iMap service
		}).error(function() {refreshMap();}); //get geocoding JSON
	} else {
		refreshMap();
	};//if something is in #street field, do geocoding else reset the map
});//geocode address on submit

function getBldgJSON() {
	map.on('click', onMapClick);
	function onMapClick(e) {
		var latlngStr = 'ST_Point(' + e.latlng.lng + ',' + e.latlng.lat + ')';
		var bldgQryURL = 'http://nickchamberlain.cartodb.com/api/v1/sql/?q=SELECT bldg_type FROM buildings WHERE ST_Contains(buildings.the_geom,ST_SetSRID(' + latlngStr + ',4326))&format=json&callback=?';
		$.getJSON(bldgQryURL, function(data) {
			var items = [];
			if ($.type(data.rows[0]) !== "undefined") {
				//console.log(data.rows[0]);
				$.each(data.rows[0], function(key, val) {
						items.push('<li id="' + key + '"><strong>' + key + '</strong>: ' + val + '</li>');
				});
				var popupHTML = $('<ul/>', {
					'id': 'my-new-list',
					html: items.join('')
				})//.appendTo(popupHTML);
				//console.log(popupHTML)
				//console.log(e.latlng);
				$.each(popupHTML, function(index) {
					console.log(popupHTML.text());
				});
				var popup = new L.Popup();
					popup.setLatLng(e.latlng);
					popup.setContent(popupHTML.html());
				map.openPopup(popup);
			};//if the user clicks a feature make the popup
		});//populates popup with cartodb JSON
	};
}
getBldgJSON();

function drawCircle(loc) {
	//var rad = $(".distance").val()
	var rad = $("#slider").slider("value");
	var circleOptions = {
		color: '#509123',
		fillColor: '#c3eaa7',
		fillOpacity: 0.25
	};
	var buff = new L.Circle(loc, rad, circleOptions);
	overlayGroup.addLayer(buff);
	map.addLayer(overlayGroup);
}

function getHydrantsCartoDB(loc,rad) {
	var cartodbHyd = new L.CartoDBLayer({
		map_canvas: 'map',
		map: map,
		user_name: 'nickchamberlain',
		table_name: 'hydrants',
		query: 'SELECT * FROM hydrants WHERE ST_Contains(ST_Buffer(ST_Transform(ST_SetSRID(ST_Point(' + loc.lng + ',' + loc.lat + '),4326),26985),' + rad + '),ST_Transform(ST_SetSRID(hydrants.the_geom,4326),26985))'
	});
}//saved, but not used because JSON was easier to clear the layer out on .distance change

function getHydrantGeoJSON(loc) {
	//var hydLayer = new L.GeoJSON();
	//var rad = $(".distance").val();
	var rad = $("#slider").slider("value");
	var hydLayer = new L.GeoJSON(null, {
		    pointToLayer: function (latlng){
		        return new L.CircleMarker(latlng, {
		            radius: 3,
		            fillColor: "#cd2105",
		            color: "#000",
		            weight: 1,
		            opacity: 1,
		            fillOpacity: 0.75
		        });
		    }
		});
	$.getJSON('http://nickchamberlain.cartodb.com/api/v1/sql/?q=SELECT * FROM hydrants WHERE ST_Contains(ST_Buffer(ST_Transform(ST_SetSRID(ST_Point(' + loc.lng + ',' + loc.lat + '),4326),26985),' + rad + '),ST_Transform(ST_SetSRID(hydrants.the_geom,4326),26985))&format=geojson&callback=?',
		function(geojson) {
			$.each(geojson.features, function(i, feature) {
			hydLayer.addGeoJSON(feature);
			})
		});
	overlayGroup.addLayer(hydLayer);
}

$(function() {
		$("#slider").slider({
		min: 0, 
		max: 2000, 
		value: 500,
		slide: function( event, ui ) {
				$( "#buffAmt" ).val(ui.value + " meters");
			}
		});
		$( "#buffAmt" ).val($( "#slider" ).slider( "value" ) + " meters");
});

});