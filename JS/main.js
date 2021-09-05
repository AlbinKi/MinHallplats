var departures = document.getElementById("departures");
var routes = document.getElementById("route");
var currentFocus;
var dataRecieved = false;
var arr;
var isDeparture = false;

window.onbeforeunload = function () {
  window.scrollTo(0, 0);
}
window.onscroll = function() {
  var scrollTop = document.documentElement.scrollTop;
  var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  var percentage =((maxScroll - scrollTop ) / maxScroll) -1;
  var percentage = percentage * -1;
  document.getElementById("btn-home").style.opacity = Math.lerp(0, 100, percentage) + "%";

    if(isDeparture){
      document.getElementById("departure-search").style.bottom = Math.lerp(50, 2.5, percentage) + "%";
      document.getElementById("departure-search").style.left = Math.lerp(15, 5, percentage) + "%";

    }
    else{
      document.getElementById("route-search").style.bottom = Math.lerp(30, 2.5, percentage) + "%";
      document.getElementById("route-search").style.left = Math.lerp(15, 5, percentage) + "%";

    }
}


addAutoComplete(departures);
addAutoComplete(routes);

function addAutoComplete(inp){
  inp.addEventListener("input", async function(e){
    if(inp.value.length == 3 && !dataRecieved) {

      if(inp.id == "departures"){

        var locationApi = 'https://cors-anywhere.herokuapp.com/http://api.sl.se/api2/typeahead.json?key=c3890f97c12344a6983823dacd0e2874&searchstring=' + inp.value + '&stationsonly=true&maxresults=50';   
        const response = await fetch(locationApi);
        var data = await response.json();
        arr = data.ResponseData;
      } else{
        var locationApi = "https://api.resrobot.se/v2/location.name?key=10960676-4c10-424b-ab0e-b68900228229&input=" + inp.value + "&format=json";     
        const response = await fetch(locationApi);
        var data = await response.json();
        arr = data.StopLocation;
      }
        dataRecieved = true;
    }
    if(inp.value.length < 3)
    dataRecieved = false;
    
    if(!dataRecieved)
    return;
    var a, b, c, i, val = this.value;
    closeAllLists();
    
    if (!val) { return false;}
    
    currentFocus = -1;
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    this.parentNode.appendChild(a);
    for (i = 0; i < arr.length; i++) {
      var name;
      if(inp.id == "departures"){
          name = arr[i].Name;
      }
      else{
        name = arr[i].name;
      }

      if (name.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        
        b = document.createElement("DIV");
        b.innerHTML = "<strong>" + name.substr(0, val.length) + "</strong>";
        b.innerHTML += name.substr(val.length);
        b.innerHTML += "<input type='hidden' value='" + name + "'>";
        if(inp.id == "departures"){
          b.innerHTML += "<input type='hidden' value='" + arr[i].SiteId + "'>";
        }
        else{
          b.innerHTML += "<input type='hidden' value='" + arr[i].id + "'>";
        }

                b.id = "values";

        b.addEventListener("click", async function(e) {
          
          if(inp.id == "departures"){
            isDeparture = true;
            inp.value = this.getElementsByTagName("input")[0].value;
            var departureApi = "https://cors-anywhere.herokuapp.com/https://api.sl.se/api2/realtimedeparturesV4.json?key=ab3d5a8b386e44b4bb2edc10e6112a8a&siteid=" + this.getElementsByTagName("input")[1].value + "&timewindow=10";
            const response = await fetch(departureApi);
            var departureData = await response.json();
            var departures = departureData.ResponseData;
            closeAllLists();
            
            
           
            
            document.getElementById("tables").textContent = '';                
            
            if(departures.Buses.length != 0)
            GenerateArray(departures.Buses, "Buss")
            
            if (departures.Trains.length != 0)
            GenerateArray(departures.Trains, "Tåg");
            
            if(departures.Trams.length != 0)
            GenerateArray(departures.Trams, "Spårvagn");
            
            if(departures.Ships.length != 0)
            GenerateArray(departures.Ships, "Färja");
            
            if(departures.Metros.length != 0){
              GenerateArray(departures.Metros, "Tunnelbana");
            } 
            document.getElementById("tables").scrollIntoView({
              behavior: 'smooth'
            }); 
            
          }
          if(inp.id == "route") {
            document.getElementById("tables").textContent = '';     
            isDeparture = false;
           

            var inputs = this.getElementsByTagName("input");
            inp.value = this.getElementsByTagName("input")[0].value;
            
            var options = {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            };
            watch = navigator.geolocation.getCurrentPosition(success, error, options);
            
            
            async function success(pos) {
              var apiURL = "https://api.resrobot.se/v2/location.name?key=10960676-4c10-424b-ab0e-b68900228229&input=" + inputs[0].value + "&format=json";
              var response = await fetch(apiURL);
              var data = await response.json();
              apiURL = "https://api.resrobot.se/v2/trip?key=10960676-4c10-424b-ab0e-b68900228229&originCoordLat=" + pos.coords.latitude + "&originCoordLong=" + pos.coords.longitude +"&destId="+ inputs[1].value + "&format=json";
              response = await fetch(apiURL);
              data = await response.json();
             
              GenerateRoute(data.Trip[0], "hej")
              document.getElementById("tables").scrollIntoView({
                behavior: 'smooth'
              }); 
   
            
            }
            
            function error(err) {
              console.warn(`ERROR(${err.code}): ${err.message}`);
            }
          }     
                            
        });
        a.appendChild(b);
      }
    }
  });
  inp.addEventListener("keydown", function(e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.key === 'ArrowDown') {
      currentFocus++;
      addActive(x);
    } else if (e.key === 'ArrowUp') { 
      currentFocus--;
      addActive(x);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFocus > -1) {
        if (x) x[currentFocus].click();
      }
    }
  });
  function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}
  
  
  Math.lerp = function (value1, value2, amount) {
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return value1 + (value2 - value1) * amount;
  };
  Math.setMax = function(value1, maxvalue){
    if (value1 <= maxvalue)
    return value1;
    else
    return maxvalue;
  }
  
  GenerateArray = function(array, header){
    var div = document.createElement("DIV");
    var maxDepartures = 8;
    div.className= "timetable";
    div.innerHTML += "<h2>"+ header +"</h2>";
    for(let i = 0; i < Math.setMax(array.length, maxDepartures); i ++)
    {
      var divInner = document.createElement("DIV");
      divInner.className = "timetable-inner";
      divInner.innerHTML += "<p class='line-number'>" + array[i].LineNumber + "</p>";
      divInner.innerHTML += "<p>" + array[i].Destination  + "<br><span class='display-time'>" + array[i].DisplayTime  + "</span></br>" + "</p>";
      div.appendChild(divInner);
    }
    document.getElementById("tables").appendChild(div);
    
  }

  GenerateRoute = function(route, header){
    
    
    var array = route.LegList.Leg;
    for (let i = 0; i < array.length; i++) {
      var verticalLine = document.createElement("DIV");
      verticalLine.className = "border-line";
      document.getElementById("tables").appendChild(verticalLine);
      var div = document.createElement("DIV");
      div.className = "route";
      if(i == 0){
        array[0].Origin.name = "Nuvarande position";
      }
        div.innerHTML += "<p>Från: " +array[i].Origin.name +
        "<br>Till: " + array[i].Destination.name +
        "<br>Avgång: "+ array[i].Origin.time +
        "<br>Ankomst: " + array[i].Destination.time
        + "</p>";
        if(i != array.length){
          var border = document.createElement("DIV");
          border.className = "border";
          if(array[i].type == "WALK"){
            border.innerHTML += "<p class='transport-mode'>Gång</p>"
          } else{
            border.innerHTML += "<p class='transport-mode'>"+ array[i].name + "</p>"
            
          }
          document.getElementById("tables").appendChild(div);
          document.getElementById("tables").appendChild(border);
          
        } else{
          document.getElementById("tables").appendChild(div);
        }
    }
  }
 
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

function resetText(x)
{
  x.value = "";
}


