$(function() {
	
	var map, zoom = 15;
	var markers = {};
	var collections = {};
	var hotelsData;
	var selectedCollection  = null;
	var usersdict={}
    var apiKey = 'AIzaSyC7P3VT_kGCxV0PZsR7aRK4BLLFlr0Q9po';
    var myrepo={}
    var infodata={}
    
	$( "#tabs" ).tabs();
	$( "#accordion" ).accordion();
	$( "#selectable" ).selectable();
	
    function handleClientLoad(usid) {
        gapi.client.setApiKey(apiKey);
        makeApiCall(usid);
    }
    function makeApiCall(usid) {
        gapi.client.load('plus', 'v1', function() {
          var request = gapi.client.plus.people.get({
              
            'userId':  usid,
          });
          request.execute(function(resp) {

          
          $(".list-users").append("<div class='list-group-item'>"+resp.displayName+"</div>")
          usersdict[usid].user=resp.displayName;
          if( resp.image != undefined ){
            $(".list-users").append("<img src="+resp.image.url+" height='60' width='60' ></img>")
            usersdict[usid].avatar=resp.image.url
            
          }
        
          });
        });
      }  
	function findHotelById(id, data) {
		var hotel;
		$.each( data.serviceList.service, function( key, val ) {
			var images = [];
			if(val.multimedia) {
				images = val.multimedia.media
			};
			if(val['@id'] === id){
				hotel = {
					id: val['@id'],
					lat: val.geoData.latitude, 
					long:val.geoData.longitude, 
					title: val.basicData.title,
					url: val.basicData.web,
					body: val.basicData.body,
					address: val.geoData.address,
					images: images
				}
			}
		});
		return hotel;
	}
	
	function loadAllHotels(data) {
		hotelsData = data;
		$.each(data.serviceList.service, function(key, val) {
			$("#hotels").append("<div class='list-group-item hotel-item' id=" + val['@id'] + ">"+val.basicData.title+"</div>")
			$("#hotels-draggable-list").append("<div class='hotel-draggable panel panel-default col-md-2' hotel='" + val['@id'] + "'>"
					+ "<div class='panel-body text-center'><span class='h6'>" + val.basicData.title + "</span></div></div>");
			$(".hotel-draggable").draggable({revert: "invalid", helper: "clone"});
		});
	}
	
	function createMap(hotel) {
		if(!map) {
			map = L.map('map').setView([hotel.lat , hotel.long], zoom);
			L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <ahref="http://osm.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(map);
		};
	}
	
	function setMarkers(hotel) {
		if(!markers[hotel.id]) {
			var mark = new L.marker([hotel.lat, hotel.long])
			.addTo(map)
			.bindPopup("<span class='mr-5'>" + hotel.title + "</span>" + 
				 "<a class='marker-delete-button' href='#' hotel='" + hotel.id + 
				 "'><span class='glyphicon glyphicon-trash text-danger'></span></a>")
			.openPopup();
			mark.on('click', function () {
			$("#" + hotel.id).click();
			});
			markers[hotel.id] = mark;
			
		}
	}
	
	function removeMarker(hotel) {
		$(".marker-delete-button").click(function () {					
			var id = $(this).attr("hotel");
			$('#'+id).removeClass("active")
			map.removeLayer(markers[id]);
			markers[hotel.id] = null;
			
		});
	}
	
	function addImages(hotel) {
		$("#images").empty();
		$.each(hotel.images, function (index, image) {
			if(image) {
				$("#images").append("<div class='col-md-2'>" +
									"<a href='#' class='thumbnail hotel-image' url='" + image.url + "'>" +
									"<img src='" + image.url + "'/></a></div>");
			}
		});
	}
	
	function bindImageModals() {
		$(".hotel-image").click(function () {
			$("#image-large").attr("src", $(this).attr("url"));
			$("#image-modal").modal();
		});
	}
	
	function displayHotelInfo(hotel) {
		if(!hotel.body) {
			hotel.body = "";
		}
		$("#info").html("<div class='contentinfo'>" +
				"<h3>" + hotel.title + "</h3>" + 
				"<p>" + hotel.body + "</p>" + 
				"<p>" + hotel.address + "</p>")
        $("#info-hotelsel").html("<div class='contentinfo'>" +
				"<h3>" + hotel.title + "</h3>" + 
				"<p>" + hotel.body + "</p>" + 
				"<p>" + hotel.address + "</p>")
	}
	
	function loadMainInfo(data) {
        
		loadAllHotels(data);
		$(".hotel-item").click(function () {
			var hotel = findHotelById(this.id, data);
            $("#hotel-select").html("<div class='hotel-selected panel panel-default ' hotel='"+hotel.id+"'name='"
                                   +hotel.title+"'></div>"+"<h3>"+hotel.title+"</h3>")
            
			createMap(hotel);
			setMarkers(hotel)
			$(this).addClass("active");
			removeMarker(hotel);
			addImages(hotel);
			bindImageModals();
			displayHotelInfo(hotel);
		});
	}
	

	// Main tab	
	$("#get-hotels").click(function(){
		// progressbar()
	
		var data = JSON.parse(localStorage.getItem("hotels-data"));
		if(!data) {
			$.getJSON("hotels.json", function(data) {
				localStorage.setItem("hotels-data", JSON.stringify(data));
				loadMainInfo(data);
			});
		} else {
			loadMainInfo(data);
		}
	
		$("#jumbotron").hide();
		$("#tabs-container").removeClass("hidden");
		$("#tabs-1").removeClass("hidden");
		
		$("#add-new-collection").click(function () {
			var collectionName = $("#new-collection").val();
			if(collectionName.trim() && !collections[collectionName]) {
				collections[collectionName] = {
						name: collectionName,
						hotels: []
				};
				selectedCollection = collectionName;
				$("#collections-accordion").replaceWith($("#collections-accordion"));
				$("#collections-accordion").append("<h3 class='accordion-tab' collection='" + collectionName + "'>" + collectionName + "</h3><div class='collection-droppable'></div>");
				$("#collections-accordion").accordion();
                
                
				$(".accordion-tab").click(function () {
                    $("#collections-accordion-selected").replaceWith($("#collections-accordion-selected"));
					selectedCollection = $(this).attr("collection");
                    $("#collections-accordion-selected").empty()
                    var len =collections[selectedCollection].hotels.length
                    var aria =$(".accordion-tab ").attr("aria-expanded")
                    
                    if( aria){
                        $("#collections-accordion-selected").append("<h3>"+selectedCollection+"</h3>")   
                        for (var i=0; i< len ; i++){
                        
                        $("#collections-accordion-selected").append("<div>"+collections[selectedCollection].hotels[i].title+"</div>")
                    }
                    
                    }
                     
                
                    
				});
				$(".collection-droppable").droppable({
					drop: function( event, ui ) {
                        $("#collections-accordion-selected").empty()
						$(this).append(ui.draggable);
						var hotelId = ui.draggable.attr("hotel");
						var hotel = findHotelById(hotelId, hotelsData);
						collections[selectedCollection].hotels.push(hotel);
						console.log(collections);
                        var aria =$(".accordion-tab ").attr("aria-expanded") 
                        var len =collections[selectedCollection].hotels.length
                        if( aria){
                            $("#collections-accordion-selected").append("<h3>"+selectedCollection+"</h3>")   
                            for (var i=0; i< len ; i++){    
                                $("#collections-accordion-selected").append("<div class='list-group-item'>"+collections[selectedCollection].hotels[i].title+"</div>")
                            }
                        }
					}
				});
			}
		});
		
        $("#add-user").click(function(){
            var userid = $("#userplus").val()
            var idhotel= $(".hotel-selected").attr('hotel')
            var title=$(".hotel-selected").attr('name');
            console.log(title)
            usersdict[userid]={
                    idhot: idhotel,
                    name : title,
                    user: "",
                    avatar: "",
            }
        })
        $("#get-users").click(function(){ 
            $(".list-users").empty()
            var idhotel= $(".hotel-selected").attr('hotel')
            $.each( usersdict, function( key, val ) {
                
                if( val.idhot === idhotel){
                    console.log(key)
                    handleClientLoad(key)     
                }
                
                
            })
        })
        
		//Boton para guardar coleccion de hoteles
		$("#save").click(function(){
            var form = "<div id='formgit' class='form-group'><h2>Formulario Github </h2><div class='input-group'>"
                form+=  "<input class='form-control' placeholder='Nick' id='user-nick'/>"
                form+= "<input class='form-control' placeholder='Token' id='user-tok'/>"
                form += "<input class='form-control' placeholder='Repo' id='user-repo'/>"
                form+="<input class='form-control' placeholder='File' id='user-file'/>"
                form+= "<a class='input-group-addon btn btn-default' href='#' id='add-git'>"
                form+="<span class='glyphicon glyphicon-plus'></span></a> </div></div>"
                
            var id=$(".ui-tabs-nav li[aria-expanded=true]").attr("id")
            console.log(id)
            $("#form"+id).append(form)
            $("#add-git").click(function(){
                   data = {
                       usuarios:usersdict,
                       colecciones: collections
                   }
                   console.log(data)
                   var token = $("#user-tok").val() 
                   var nick = $("#user-nick").val() 
	               var repo = $("#user-repo").val()
	               var file = $("#user-file").val()
                    console.log(token)
                   myrepo={
                       'token': token,
                       'nick' : nick,
                       'repo': repo,
                       'file' : file
                   }
	               github = new Github({
		              token: token,
		              auth: "oauth"
    	           })
                   repo = github.getRepo(nick, repo)
                   console.log(repo)
	               repo.write(
        		      'master',			
        		      file, 			
			         JSON.stringify (data ),	
			         "Push...", function(err) {	
			         console.log (err)
		          });
                 $("#formgit").hide()
                }) 
             
        })
        
        $("#load").click(function(){
            github = new Github({
		              token: myrepo.token,
		              auth: "oauth"
    	           })
            repo = github.getRepo(myrepo.nick, myrepo.repo)
            repo.read('master', myrepo.file, function(err, data) {
		    var dataobject = JSON.parse(data)
		    console.log(dataobject)
           
            $.each(dataobject.usuarios, function (key, val) {
                    console.log(val)
                    $(".addusers").append("<h3> Usuarios: "+val.name+"</h3>"+"<div class='list-group-item'>"+val.user+"</div><img src="+val.avatar+" height='60' width='60'></img>")
             })
            $.each(dataobject.colecciones, function (key, val) {
                 console.log(val)
                $(".addcol").append("<h3> Colecciones: "+val.name+"</h3>");
                var len =val.hotels.length           
                for (var i=0; i< len ; i++){
                    $(".addcol").append("<div class='list-group-item'>"+val.hotels[i].title+"</div>")       
                }
                 
                
            });
           
    	   });

        })
    })				

    
});


	