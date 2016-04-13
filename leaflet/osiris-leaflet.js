/**
 * This funcions creates a geometry from a result obtained from Osisris.Depending on the type of the space, generates a polygon or a polyline
 **/        
function createGeometry(space){
    var geometry=null;
    if (space.hasOwnProperty("geometryDTO") && typeof(space.properties) !== 'undefined'){
        if (typeof(space.geometryDTO.collectionPointDTO) !== 'undefined'){
            
            // We need to process the points of this collectionPointDTO and convert them to leaflet LantLng    
            var points=space.geometryDTO.collectionPointDTO;
            var point, pointList=[];
            for (j = 0; j < points.length; j++){
                point = new L.LatLng(points[j].latitude,points[j].longitude);
                pointList[j]=point;
            }
            
            // The label to use in the popup. Preferably the name of the space
            var label = "";
            if (typeof(space.properties.name) !== 'undefined'){                              
                label = space.properties.name;
            }
            else if (typeof(space.properties.ref) !== 'undefined'){ 
                label = space.properties.ref;
            }
            
            // Geometry creation. Depending of its type we will assign a different style                    
            if (typeof(space.properties.stairs) !== 'undefined'){ // Stairs
                var geometry = new L.Polygon(pointList, {color: '#efe3d6',fillColor: '#d6d3d6', opacity: 1, fillOpacity:1, smoothFactor: 1 });
                label = 'stairs'
            }   
            else if (space.properties.indoor==="level" ){ // Level outline                
                var geometry = new L.Polygon(pointList, {stroke: false, fillColor: 'white', opacity: 1, fillOpacity:1 });
            } 
            else if (space.properties.indoor==="room" ){  // Room              
                var geometry = new L.Polygon(pointList, {color: '#efe3d6', weight:2, fillColor: '#fffbef', opacity: 1, fillOpacity:1,  smoothFactor: 1 });
            }   
            else if (space.properties.indoor==="corridor" ){ //Corridor                
                var geometry = new L.Polygon(pointList, {stroke: false, fillColor: 'white', opacity: 1, fillOpacity:1 });
                if (label.length ==0)
                    label='corridor'
            }    
            else if (space.properties.indoor==="elevator" ){ // Elevator              
                var geometry = new L.Polygon(pointList, {color: '#efe3d6',fillColor: '#d6d3d6', opacity: 1, fillOpacity:1,  smoothFactor: 1 });
                label = 'elevator'
            }   
            else if (space.properties.indoor=="wall" ){ // Wall                                    
                var geometry = new L.Polyline(pointList, {color: '#efe3d6', opacity: 1, weight:2, fillOpacity:1, smoothFactor: 1});
            } 
            geometry.bindPopup(label);
        }
    }
    return geometry
}

/**
 * We have created the layers of the layer group in order of appearance. Probably they are not ordered. This function performs a numerical order
 **/
function orderLevels(levels){           
    var levelGroups={}
    keys = Object.keys(levels),
    i, len = keys.length;
    
    keys.sort(function(a,b){return a - b});
    
    for (var i in keys) {  
        levelGroups["Level " +keys[i]]= levels[keys[i]];
    }
    levelGroups[Object.keys(levelGroups)[0]].addTo(mymap); // We add the first level found in the group as the default level viewed 
    L.control.layers(levelGroups).addTo(mymap); // levelGroups is an ordered copy of levels
    
}

/**
 * Creates the levels of the building in or layer group. Secondly, adds the level polygon to the created level layer to be sure that it is at the bottom at the time of drawing all the shapes
 **/
function createLevels(data){   
    var spaces = data// JSON.parse(data);
    for (i = 0; i < spaces.length; i++){    
        var geometry = createGeometry(spaces[i]);
        if (typeof(geometry)!== 'undefined' && typeof(spaces[i].properties.level) !== 'undefined'){    
            if (typeof(levels[spaces[i].properties.level]) === 'undefined'){ 
                levels[spaces[i].properties.level]= new L.layerGroup;
            }
        }
        levels[spaces[i].properties.level].addLayer(geometry); // We need the level geometry to be draw at the bottom, so it should be the firs layer of its group
    }   
    
    orderLevels(levels); 
    
}

/** 
 * This function creates the geometry of all the items contained in data. Each one geometry is added to the appropriate layer (in other words to its level LayerGroup
 **/
function drawIndoor(data){
    var spaces = data// JSON.parse(data);
    for (i = 0; i < spaces.length; i++){    
        var geometry = createGeometry(spaces[i]);
        if ( typeof(spaces[i].properties.level) !== 'undefined' && geometry!== null){    
            if (typeof(levels[spaces[i].properties.level]) !== 'undefined'){                         
                levels[spaces[i].properties.level].addLayer(geometry); // The geometry is assigned to its level layer
            }
        }
    }
}   

/**
 * Performs an AJAX call using JQuery
 **/
function queryMap(api_key, query, callbackFunc){
    $.ajax({
        url:"http://localhost:8020/osiris/geolocation/territory/search?layer=MAP&pageSize=1000",   // Osiris server URL
        type:"POST",
        headers:  {"api_key" : api_key},     
        data: query, 
        dataType: "json",
        contentType: 'application/json',              
        success: callbackFunc,
        error:function(jqXHR,textStatus,errorThrown)
        {
            alert("There is an error: "+errorThrown );
        }
    });         
}