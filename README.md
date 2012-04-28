City of Salisbury Fire Hydrants
===========

This is my first use of Leaflet to display CartoDB data using Cloudmade tiles as a basemap.  The hydrant data will soon be merged with vertical survey benchmarks to display benchmark elevation measurements in the City datum.

Functionality
-------------

The geocoder uses the MDiMap REST Service.  If the address is successfully geocoded, a Leaflet marker is drawn with a buffer (in meters) circle using the value in the jQuery slider.

The slider can be moved and the buffer will redraw and retreive the hydrants within the buffer.  The marker is also draggable and the retreival will be done on dragend.
