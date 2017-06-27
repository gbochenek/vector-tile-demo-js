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


      var checkViewPort = function(){
        console.log("Test");
        var vs = win.getBox();
        console.log(vs.w,vs.h);
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
                        {name:"LONDON, GB (LHR)",id:"LHR"},
                        {name:"LOS ANGELES CA, US (LAX)",id:"LAX"},
                        {name:"HONG KONG, HK (HKG)",id:"HKG"},
                        {name:"PARIS, FR (CDG)",id:"CDG"},
                        {name:"DALLAS/FORT WORTH TX, US (DFW)",id:"DFW"},
                        {name:"ISTANBUL, TR (IST)",id:"IST"},
                        {name:"FRANKFURT, DE (FRA)",id:"FRA"},
                        {name:"SHANGHAI, CN (PVG)",id:"PVG"},
                        {name:"AMSTERDAM, NL (AMS)",id:"AMS"},
                        {name:"NEW YORK NY, US (JFK)",id:"JFK"},
                        {name:"WASHINGTON D.C. (DCA)",id:"DCA"},
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
        basemap: 'dark-gray'
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
        value: "ALL_AIRPORTS",
      },"airportSelector");

      airportSelector.startup();

      airportSelector.on("change",function(value){
        setFilter(tileLayer,value);
      });

      var colorSelector = new ColorPicker({
        appendTo: document.getElementById("colorSelector"),
        color: colorMap.red,
        renderCallback: function(color,action){

          console.debug("ACTION",action);
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

          tileStyle.layers[0] = tileLayerStyle;

          tileLayer.loadStyle(tileStyle);
        }
      };

      var setFilter = function(tileLayer,airport){


        if (airport && airport.length > 0){
          var tileStyle = lang.clone(tileLayer.get("currentStyleInfo.style"));
          var tileLayerStyle = tileStyle.layers[0];

          if (airport === "ALL_AIRPORTS"){
            delete tileLayerStyle.filter;
          } else {
            tileLayerStyle.filter = ["any",["==", "Origin", airport],["==", "Dest", airport]];
          }

          tileStyle.layers[0] = tileLayerStyle;

          tileLayer.loadStyle(tileStyle);
        }
      }

      
    });
