require([
  "dojo/_base/lang",
  "dojo/query",
  "dojo/window",
  "dojo/dom-class",
  "dojo/store/Memory",
  "dojo/data/ObjectStore",
  "dijit/form/Select",
  "esri/Map",
  "esri/views/MapView",
  "esri/geometry/Extent",
  "esri/layers/VectorTileLayer",
], function(lang, query, win, domClass, Memory,  ObjectStore, FilteringSelect, Map, MapView, Extent, VectorTileLayer) {

  var singleColorStyle = null;
  var timeZoneStyle = {
    "line-color": {
      "property": "TZ_Delta",
      "default": "#000000",
      "stops": [[-13.7584, "rgba(45,0,75,0.8)"], [-10.9992, "rgba(84,39,136,0.8)"], [-8.23989, "rgba(128,115,172,0.8)"], [-5.48062, "rgba(178,171,210,0.8)"], [-2.72135, "rgba(216,218,235,0.8)"], [0.0379213, "rgba(247,247,247,0.8)"], [2.79719, "rgba(254,224,182,0.8)"], [5.55646, "rgba(253,184,99,0.8)"], [8.31573, "rgba(224,130,20,0.8)"], [11.075, "rgba(179,88,6,0.8)"], [13.8343, "rgba(127,59,8,0.8)"]]
    },
    "line-width": 1.33333
  };

  var checkViewPort = function(){
    var vs = win.getBox();
    if (vs.w < 600 || vs.h < 630 || (vs.h < 750 && vs.w < 1000)){
      domClass.add(document.body,"mobile");
    } else {
      domClass.remove(document.body,"mobile");
    }
  }
  window.onresize = checkViewPort;
  checkViewPort();
  
  var fromButton = true;

  var colorMap = {
    "red": "rgba(175,18,18,0.05)",
    "orange": "rgba(243,174,24,0.05)",
    "green": "rgba(108,236,62,0.05)",
    "blue": "rgba(96,205,255,0.05)",
    "pink": "rgba(255,127,255,0.05)",
    "white": "rgba(240,240,240,0.05)"
  };

  var airportStore = new Memory({data:[
                    {name:"All Airports",id:"ALL_AIRPORTS"},
                    {name:"ATLANTA GA, US (ATL)",id:"ATL"},
                    {name:"BEIJING, CN (PEK)",id:"PEK"},
                    {name:"DUBAI, AE (DXB)",id:"DXB"},
                    {name:"CHICAGO IL, US (ORD)",id:"ORD"},
                    {name:"TOKYO, JP (HND)",id:"HND"},
                    {name:"WASHINGTON D.C. (DCA)",id:"DCA"},
                    {name:"LOS ANGELES CA, US (LAX)",id:"LAX"},
                    {name:"HONG KONG, HK (HKG)",id:"HKG"},
                    {name:"PARIS, FR (CDG)",id:"CDG"},
                    {name:"DALLAS/FORT WORTH TX, US (DFW)",id:"DFW"},
                    {name:"ISTANBUL, TR (IST)",id:"IST"},
                    {name:"FRANKFURT, DE (FRA)",id:"FRA"},
                    {name:"SHANGHAI, CN (PVG)",id:"PVG"},
                    {name:"AMSTERDAM, NL (AMS)",id:"AMS"},
                    {name:"NEW YORK NY, US (JFK)",id:"JFK"},
                    {name:"LONDON, GB (LHR)",id:"LHR"},
                    {name:"SINGAPORE, SG (SIN)",id:"SIN"},
                    {name:"GUANGZHOU, CN (CAN)",id:"CAN"},
                    {name:"JAKARTA, ID (CGK)",id:"CGK"},
                    {name:"DENVER CO, US (DEN)",id:"DEN"},
                    {name:"BANGKOK, TH (BKK)",id:"BKK"},
                    {name:"SAN FRANCISCO CA, US (SFO)",id:"SFO"},
                    {name:"INCHEON, KR (ICN)",id:"ICN"},
                    {name:"KUALA LUMPUR, MY (KUL)",id:"KUL"},
                    {name:"MADRID, ES (MAD)",id:"MAD"},
                    {name:"NEW DELHI, IN (DEL)",id:"DEL"},
                    {name:"LAS VEGAS NV, US (LAS)",id:"LAS"},
                    {name:"CHARLOTTE NC, US (CLT)",id:"CLT"},
                    {name:"MIAMI FL, US (MIA)",id:"MIA"},
                    {name:"PHOENIX AZ, US (PHX)",id:"PHX"},
                    {name:"DETROIT MI, US (DTW)",id:"DTW"}
  ]});

  // Create a Map
  var map = new Map({
    basemap: 'dark-gray-vector'
  });

  // Make map view and bind it to the map
  var view = new MapView({
    container: "viewDiv",
    map: map,
    ui: {
      components: ["attribution"]
    },
    extent: new Extent({xmin: -13047304.484756596, ymin: 736470.7675274275, xmax: -9016321.361110613, ymax: 7898314.569733398,"spatialReference": 102100})
  });

  /********************************************************************  
   * Add a tile layer to the map
   * 
   * The url property must either point to the style or to the URL of a Vector Tile service 
   *********************************************************************/
  var tileLayer = new VectorTileLayer({
    url: "./vectorStyle.json",
    opacity: 0.7
  });
  map.add(tileLayer);

  window.tileLayer = tileLayer;
  window.map = map;
  window.view = view;

  var airportSelector = new FilteringSelect({
    store: new ObjectStore({objectStore: airportStore}),
    labelAttr: "name",
    value: "ALL_AIRPORTS"
  },"airportSelector");

  airportSelector.startup();

  airportSelector.on("change",function(value){
    setFilter(tileLayer,value);
  });

  var colorSelector = new ColorPicker({
    appendTo: document.getElementById("colorSelector"),
    color: colorMap.red,
    renderCallback: function(color,action){

      var rgb = color.rgb;

      var colorStr = "rgba(" + (rgb.r * 255) + "," + (rgb.g * 255) + "," + (rgb.b * 255) + "," + color.alpha + ")";

      if (setVectorColor){
        setVectorColor(tileLayer,colorStr);
      }
    }
  });

  query(".flight-style-btn").on("click",function(evt){

    var node = evt.target;

    if (domClass.contains(node,"active")){
      return;
    }

    query(".flight-style-btn").removeClass("active");
    for (var color in colorMap){
      if (domClass.contains(node,color)){
        colorSelector.color.setColor(colorMap[color],undefined,undefined,true);
        query(".cp-bres")[0].click();
        domClass.add(node,"active");
        break;
      }
    }

  });

  var setVectorColor = function(tileLayer,colorStr){

    var tileStyle = lang.clone(tileLayer.get("currentStyleInfo.style"));
    if (tileStyle !== undefined){
      var tileLayerStyle = tileStyle.layers[0];

      tileLayerStyle.paint["line-color"] = colorStr;

      singleColorStyle = tileLayerStyle.paint;

      tileStyle.layers[0] = tileLayerStyle;

      tileLayer.loadStyle(tileStyle);
    }
  };

  var setFilter = function(tileLayer,airport){


    if (airport && airport.length > 0){
      var tileStyle = lang.clone(tileLayer.get("currentStyleInfo.style"));
      var tileLayerStyle = tileStyle.layers[0];

      if (airport === "ALL_AIRPORTS"){
        query(".legend")[0].style.height = "0";

        if (singleColorStyle){
          tileLayerStyle.paint = singleColorStyle;
        } else {
          tileLayer.loadStyle("./vectorStyle.json")
          return;
        }

        delete tileLayerStyle.filter;
      } else {
        query(".legend")[0].style.height = "30px";
        tileLayerStyle.filter = ["==", "Origin", airport];
        tileLayerStyle.paint = timeZoneStyle;
      }

      tileStyle.layers[0] = tileLayerStyle;

      tileLayer.loadStyle(tileStyle);
    }
  }

  
});
