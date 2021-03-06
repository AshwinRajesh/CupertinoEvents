$( document ).ready(function() {
    
    var firebaseConfig = {
        apiKey: "AIzaSyDEaV7YhmgWMbWoW1G2JQpbqr-fO8380og",
        authDomain: "hackcupertinodb.firebaseapp.com",
        databaseURL: "https://hackcupertinodb.firebaseio.com",
        projectId: "hackcupertinodb",
        storageBucket: "hackcupertinodb.appspot.com",
        messagingSenderId: "175467986461",
        appId: "1:175467986461:web:559c1cb3998ac5b06b10f4"
    };
    firebase.initializeApp(firebaseConfig);

    const dbRefObject = firebase.database().ref().child("events");
    dbRefObject.on("child_added", snap => {console.log("Added!"); addEventElement(snap); console.log(snap.val())});
    dbRefObject.on("child_removed", snap => {console.log("Removed!"); removeEventElement(snap); console.log(snap.val())});
    dbRefObject.on("child_changed", snap => {console.log("Changed!"); removeEventElement(snap); addEventElement(snap); console.log(snap.val())});

    const prizeRef = firebase.database().ref().child("prizes");
    prizeRef.on("child_added", snap => {console.log("Added!"); loadPrize(snap); console.log(snap.val())});

    firebase.auth().onAuthStateChanged(firebaseUser => {
        if(firebaseUser){
            console.log("Logged in!");
            console.log(firebaseUser.displayName);
            //$("#logoutButton").show();
        }else{
            console.log("Logged out!");
            //$("#logoutButton").hide();
        }
    });

    //Login
    $("#login_button").on("click", function() {
        loginWithEmail($("#login_email").val(), $("#login_pwd").val());
    });
    $("#signup_button").on("click", function() {
        
        signupWithEmail($("#signup_username").val(),$("#signup_email").val(), $("#signup_pwd").val());
    });

    $("#sign_out").on("click", function() {
        logOut();
    });

    $('input[name="eventdatetimes"]').daterangepicker({
        timePicker: true,
        startDate: moment().startOf('hour'),
        endDate: moment().startOf('hour').add(32, 'hour'),
        locale: {
            format: 'M/DD/YYYY hh:mm A'
        }
    }, function(start, end, label) {
        event_create_start = start.valueOf();
        event_create_end = end.valueOf();
        console.log(event_create_start);
        console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
    });

    $('input[name="prizedatetimes"]').daterangepicker({
        startDate: moment().startOf('hour'),
        endDate: moment().startOf('hour').add(32, 'hour'),
        locale: {
            format: 'M/DD/YYYY'
        }
    }, function(start, end, label) {
        prize_create_start = start.valueOf();
        prize_create_end = end.valueOf();
        console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
    });

    $("#event_save_button").on("click", function() {
        if (localStorage.getItem("newEvent") == "true") {
            addEvent($("#event_name").val(), event_create_start, event_create_end, localStorage.getItem("newEventLat"), localStorage.getItem("newEventLng"), $("#event_points_slide").val(), $("#event_description").val());
            window.location.href = "admin-events.html";
        } else {
            saveEvent(localStorage.getItem("eventSelectedKey"), $("#event_name").val(), event_create_start, event_create_end, localStorage.getItem("eventSelectedLat"), localStorage.getItem("eventSelectedLng"), $("#event_points_slide").val(), $("#event_description").val());
            window.location.href = "admin-events.html";
        }
    });
    $("#prize_save_button").on("click", function() {
        if (localStorage.getItem("newPrize") == "true") {
            addPrize($("#prize_name").val(), prize_create_start, prize_create_end, $("#prize_points_slide").val());
            window.location.href = "admin-prizes.html";
        } else {
            savePrize(localStorage.getItem("prizeSelectedKey"), $("#prize_name").val(), prize_create_start, prize_create_end, $("#prize_points_slide").val());
            window.location.href = "admin-prizes.html";
        }
    });
    $("#event_filter_map").on('change', function() {
        console.log($("#event_filter_map").val());
        var filter = $("#event_filter_map").val();
        return firebase.database().ref('/events').once('value').then(function (snapshot) {
            var events = snapshot.val();
            $("#eventList").children("li").each(function (){
                console.log(this.id);
                var event = events[this.id.split("_main")[0]];
                //console.log(event);
                const now = Date.now();
                if(filter == "all") {
                    $("#" + this.id).show();
                }else if(filter == "upcoming"){
                    if(event.start_time > now && event.end_time > now){
                        $("#" + this.id).show();
                    }else{
                        $("#" + this.id).hide();
                    }
                }else if(filter == "past") {
                    if (event.start_time < now && event.end_time < now) {
                        $("#" + this.id).show();
                    } else {
                        $("#" + this.id).hide();
                    }
                }else{
                    if (event.start_time < now && event.end_time > now) {
                        $("#" + this.id).show();
                    } else {
                        $("#" + this.id).hide();
                    }
                }

            });
        });
    });
});

var event_create_start = 0;
var event_create_end = 0;
var prize_create_start = 0;
var prize_create_end = 0;

/*
function loginWithEmail(email, passowrd){
    $("#sign_out").on("click", function() {
        logOut();
    });
    $("#login_button").on("click", function() {
        loginWithEmail($("#login_email").val(), $("#login_pwd").val());

    });
});
*/



function loginWithEmail(email, password){
    //generateAlert("#login_alerts", "success", "bruhh");
    const auth = firebase.auth();
    const promise = auth.signInWithEmailAndPassword(email, password);
    promise.catch(e => {console.log(e.message); console.log("ISSUE"); generateAlert("#login_alerts", "danger", "There was an issue trying to log in.");})
        .then(() => {
        loadUser();
    });

    
}

function signupWithEmail(username, email, password){
    console.log(username);
    const auth = firebase.auth();
    const promise = auth.createUserWithEmailAndPassword(email, password);
    promise.catch(e => console.log(e.message)).then(() => {
        var user = firebase.auth().currentUser;
        user.updateProfile({
            displayName: username
        });

        firebase.database().ref("users/" + user.uid).set({
            name: username,
            uid: user.uid,
            points: 0,
            user_events: {placeholder: 0},
            prizes: {placeholder: 0}
        }, function(error) {
            if (error) {
                console.log(error.message);
            } else {
                console.log("Data saved successfully!");
                loadUser();
            }
        });
    });
}

function logOut(){
    firebase.auth().signOut();
    window.location.replace("./index.html");
}

function addEvent(name, start, end, lat, lon, value, notes){
    var newPostKey = firebase.database().ref().child('posts').push().key;

    firebase.database().ref("events/" + newPostKey).set({
        key: newPostKey,
        name: name,
        start_time: start,
        end_time: end,
        latitude: lat,
        longitude: lon,
        point_value: value,
        notes: notes,
    }, function(error) {
        if (error) {
            console.log(error.message);
        } else {
            console.log("Data saved successfully!");
        }
    });
}

function addPrize(title, start, end, points) {
    var newPostKey = firebase.database().ref().child('posts').push().key;
    firebase.database().ref("prizes/" + newPostKey).set({
        key: newPostKey,
        name: title,
        start_time: start,
        end_time: end,
        point_value: points
    }, function(error) {
        if (error) {
            console.log(error.message);
        } else {
            console.log("Data saved successfully!");
        }
    });
}

var distanceFromEvent = 0;
var userLon = 0;
var userLat = 0;

function checkInToEvent(eventKey){
    var user = firebase.auth().currentUser;
    var current = new Date();
    return firebase.database().ref('/').once('value').then(function (snapshot) {
        var users = snapshot.val().users;
        var user_points = parseInt(users[user.uid].points);
        var pointValue = parseInt(snapshot.val().events[eventKey].point_value);
        userLat = parseFloat(snapshot.val().events[eventKey].lat);
        userLon = parseFloat(snapshot.val().events[eventKey].lng);
        var eventName = snapshot.val().events[eventKey].name;
        var start = new Date(parseInt(snapshot.val().events[eventKey].start_time));
        var end = new Date(parseInt(snapshot.val().events[eventKey].end_time));
        console.log(users[user.uid]);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(savePosition);
        } else { 
            console.log("Geolocation is not supported by this browser.");
        }
        if(eventKey in users[user.uid].user_events){
            console.log("Already checked in to this event");
            generateAlert("#map_alerts", "danger", "You have already checked in to this event!");
            return false;
        } else if (current < start) { 
            console.log("This event has not happened yet!");
            generateAlert("#map_alerts", "danger", "This event has not happened yet!");
            return false;
        } else if (current > end) {
            console.log("This event has finished already!");
            generateAlert("#map_alerts", "danger", "This event has finished already!");
            return false;
        } else {
            if(distanceFromEvent < 5) {
                obj = users[user.uid].user_events;
                obj[eventKey] = 0;
                firebase.database().ref("users/" + user.uid + "/user_events").set(obj, function(error) {
                    if (error) {
                        console.log(error.message);
                    } else {
                        console.log("Data saved successfully!");
                    }
                });
                firebase.database().ref("users/" + user.uid).update({points: user_points + pointValue}, function(error) {
                    if (error) {
                        console.log(error.message);
                    } else {
                        console.log("Data saved successfully!");
                    }
                });
                localStorage.setItem("points", parseInt(localStorage.getItem("points")) + pointValue);
                var event_list;
                try {
                    event_list = JSON.parse(localStorage.getItem("event_list"));
                } catch(error) {
                    event_list = [];
                }
                event_list.push(eventName);
                localStorage.setItem("event_list", JSON.stringify(event_list));
                generateAlert("#map_alerts", "success", "Success!\nYou gained " + pointValue + " points!");
            } else {
                console.log("You are too far from the event to check in.");
                generateAlert("#map_alerts", "danger", "You are too far from the event to check in!");
            }
        }
    });
}

function savePosition(position) {
    distanceFromEvent = findDistance(userLat, userLon, position);
}

function findDistance(lat, lng, position2){
    var lat1 = lat / (180 / (22/7));
    var long1 = lng / (180 / (22/7));
    var lat2 = position2.coords.latitude / (180 / (22/7));
    var long2 = position2.coords.longitude / (180 / (22/7));
    var distance = 3963.0 * Math.acos( (Math.sin(lat1) * Math.sin(lat2)) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(long2 - long1) );
    return distance;
}

function generateAlert(id, color, message){
    $(id).prepend("<div class=\"alert alert-" + color + " alert-dismissible fade show fixed-bottom\" role=\"alert\">\n" +
        message + "\n" +
        "  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">\n" +
        "    <span aria-hidden=\"true\">&times;</span>\n" +
        "  </button>\n" +
        "</div>"
    )
}

function addEventElement(snap){
    var uid = firebase.auth().currentUser.uid;
    obj = snap.val();
    console.log(obj);
    var start = new Date(obj.start_time);
    var end = new Date(obj.end_time);
    var contentString = "";
    var key = obj.key;
    var name = obj.name;
    var notes = obj.notes;
    var points = obj.point_value;
    var current = new Date();

    if (current < end) {
        addMarker(parseFloat(obj.latitude), parseFloat(obj.longitude), obj.name, obj.notes, start, end, obj.key);
    }

    return firebase.database().ref('/users/' + uid).once('value').then(function (snapshot) {
        //var events = snapshot.val().user_events;
        if(key in snapshot.val().user_events){
            contentString = "<li id=\"" + key + "_main\"class=\"list-group-item\">\n" +
        "            <h3>" + name + " <span style='color: #4e89ed'>" + points + "pts</span></h3>\n" +
        "            <h5>" + notes + "</h5>\n" +
        "            <h6>" + formatDate(start) + " to " + formatDate(end) + "</h6>\n" +    
        "            <button id=\"" + key + "_button\" disabled class='btn btn-secondary'>Checked In</button>" +
        "          </li>";
        } else {
            contentString = "<li id=\"" + key + "_main\"class=\"list-group-item\">\n" +
        "            <h3>" + name + " <span style='color: #4e89ed'>" + points + "pts</span></h3>\n" +
        "            <h5>" + notes + "</h5>\n" +
        "            <h6>" + formatDate(start) + " to " + formatDate(end) + "</h6>\n" +    
        "            <button id=\"" + key + "_button\" class='btn btn-primary'>Check In</button>" +
        "          </li>";
        }
        $("#eventList").append(contentString);

        $("#" + key + "_button").on("click", function() {
            checkInToEvent(key);

        });
        
        if (end < current) {
            $("#recent_events_admin").append("<li class=\"list-group-item list-group-item-action\">" + name + " (Complete)<button id=\"" + key + "_admin_button\" class=\"btn btn-primary\" style=\"float: right;\">Edit</button></li>");
        } else {
            $("#recent_events_admin").append("<li class=\"list-group-item list-group-item-action\">" + name + "<button id=\"" + key + "_admin_button\" class=\"btn btn-primary\" style=\"float: right;\">Edit</button></li>");
        }


        $("#" + key + "_admin_button").on("click", function() {
            editEvent(key);
            window.location.href = "event.html";
        });
    });
    /*$("#eventList").append("<li id=\"" + obj.key + "_main\"class=\"list-group-item\">\n" +
        "            <h3>" + obj.name + " <span style='color: #4e89ed'>" + obj.point_value + "pts</span></h3>\n" +
        "            <h5>" + obj.notes + "</h5>\n" +
        "            <h6>" + formatDate(start) + " to " + formatDate(end) + "</h6>\n" +    
        "            <button id=\"" + obj.key + "_button\" class='btn btn-primary'>Check In</button>" +
        "          </li>");*/

    
}

function removeEventElement(snap){
    obj = snap.val();
    console.log(obj);
    $("#" + obj.key + "_main").remove();
}

function buttonClick(){
    //console.log(getEventPointValue("-MD19BNlF5FpA-LO10pH"));
    checkInToEvent("-MD1fIe2sRSNZRA_XX4o");
    //logOut();
    //signupWithEmail("joe", "joe9@gmail.com", "bruhaps123");
    //addEvent("meetup at jopes", 1595483789, 1595570225, 37.319309, -122.029259, 100, "IDEKsdfBRO");
}

function loadUser() {
    var uid = firebase.auth().currentUser.uid;
    var db = firebase.database();
    var events;
    var username;
    var points;
    userEvents(uid);
    userPrizes(uid);

    db.ref('/users/' + uid).once('value').then(function(snapshot) {
      username = snapshot.val().name;
      points = parseInt(snapshot.val().points);
      events = snapshot.val().user_events;
      

      // ...
      localStorage.setItem("username", username);
      localStorage.setItem("points", points);
      //localStorage.setItem("events-attended", events.length + "");
      window.location.href = "welcome.html";
    });
    
}

function loadPrize(snap) {
    obj = snap.val();
    var start = new Date(obj.start_time);
    var end = new Date(obj.end_time);
    var prize_name = obj.name;
    var points = obj.point_value;
    var key = obj.key;

    var current = new Date();

    var prizeContainer = document.getElementById("prizes");
    var adminPrizeContainer = document.getElementById("admin-prizes");

    var row = document.createElement("div");
    row.className = "row p-5 my-4";
    row.style = "background-color: #4e89ed";

    var editrow = document.createElement("div");
    editrow.className = "row p-5 my-4";
    editrow.style = "background-color: #4e89ed";
    
    var col1 = document.createElement("div");
    col1.className = "col-sm-8";

    var editcol = document.createElement("div");
    editcol.className = "col-sm-8";
    
    var title = document.createElement("h2");
    title.className = "title";
    title.innerHTML = prize_name;

    var edittitle = document.createElement("h2");
    edittitle.className = "title";
    edittitle.innerHTML = prize_name;
    
    var date = document.createElement("p");
    date.className = "date";
    date.innerHTML = (start.getMonth() + 1) + "/" + start.getDate() + "/" + start.getFullYear() + " to " + (end.getMonth() + 1) + "/" + end.getDate() + "/" + end.getFullYear() + ".";
    
    var editdate = document.createElement("p");
    editdate.className = "date";
    editdate.innerHTML = (start.getMonth() + 1) + "/" + start.getDate() + "/" + start.getFullYear() + " to " + (end.getMonth() + 1) + "/" + end.getDate() + "/" + end.getFullYear() + ".";

    var col2 = document.createElement("div");
    col2.className = "col-sm-4";

    var editcol2 = document.createElement("div");
    editcol2.className = "col-sm-4";

    var pts = document.createElement("h1");
    pts.innerHTML = points + " pts";
    pts.className = "points";

    var editpts = document.createElement("h1");
    editpts.innerHTML = points + " pts";
    editpts.className = "points";

    col2.appendChild(pts);
    editcol2.appendChild(editpts);

    var button = document.createElement("button");
    var prize_list;
    try {
        prize_list = JSON.parse(localStorage.getItem("prize_list"));
    } catch(error) {
        prize_list = [];
    }
    if (prize_list.includes(prize_name)) {
        button.innerHTML = "Purchased";
        button.className = "btn btn-secondary";
        button.disabled = true;
    } else {
        button.innerHTML = "Purchase";
        button.className = "btn btn-light";
        button.type = "button";
        button.id = key;
        button.disabled = false;
        button.addEventListener("click", function() {
          purchase(this.id);
        });
    }

    var edit = document.createElement("button");
    edit.innerHTML = "Edit";
    edit.className = "btn btn-light";
    edit.type = "button";
    edit.id = key;
    edit.addEventListener("click", function() {
        editPrize(this.id);
        window.location.href = "edit-prize.html";
    });

    col1.appendChild(title);
    col1.appendChild(date);
    col1.appendChild(button);

    editcol.appendChild(edittitle);
    editcol.appendChild(editdate);
    editcol.appendChild(edit);

    row.appendChild(col1);
    row.appendChild(col2);

    editrow.appendChild(editcol);
    editrow.appendChild(editcol2);
    
    if (start < current && current < end) {
        $("#prizes").append(row);
    }
    $("#admin-prizes").append(editrow);
}


function purchase(prizeKey) {

    var user = firebase.auth().currentUser;
    return firebase.database().ref('/').once('value').then(function (snapshot) {
        var users = snapshot.val().users;
        var user_points = parseInt(users[user.uid].points);
        var pointValue = parseInt(snapshot.val().prizes[prizeKey].point_value);
        var prizeName = parseInt(snapshot.val().prizes[prizeKey].name);
    
        if(prizeKey in users[user.uid].prizes){
            generateAlert("#prize_alerts", "danger", "Already purchased this prize!");
            //generateAlert("#map_alerts", "danger", "You have already checked in to this event!");
            return false;
        } else if (user_points < pointValue) {
            generateAlert("#prize_alerts", "danger", "Not enough points to purchase this prize!");
        } else {
            obj = users[user.uid].prizes;
            obj[prizeKey] = 0;
            firebase.database().ref("users/" + user.uid + "/prizes").set(obj, function(error) {
                if (error) {
                    console.log(error.message);
                } else {
                    console.log("Data saved successfully!");
                }
            });
            firebase.database().ref("users/" + user.uid).update({points: user_points - pointValue}, function(error) {
                if (error) {
                    console.log(error.message);
                } else {
                    console.log("Data saved successfully!");
                }
            });
            var prize_list;
            try {
                prize_list = JSON.parse(localStorage.getItem("prize_list"));
            } catch(error) {
                prize_list = [];
            }
            prize_list.push(prizeName);
            localStorage.setItem("prize_list", JSON.stringify(prize_list));
            localStorage.setItem("points", parseInt(localStorage.getItem("points")) - pointValue);
            generateAlert("#prize_alerts", "success", "Success!\nYou purchased this prize for " + pointValue + " points!");
            document.getElementById("points-label").innerHTML = "Points: " + localStorage.getItem("points");
        }
    });
}

function editPrize(prizeKey) {
    return firebase.database().ref('/prizes/' + prizeKey).once('value').then(function (snapshot) {
        var name = snapshot.val().name;
        var points = parseInt(snapshot.val().point_value);
        var start = parseInt(snapshot.val().start_time);
        var end = parseInt(snapshot.val().end_time);

        localStorage.setItem("prizeSelectedName", name);
        localStorage.setItem("prizeSelectedPoints", points);
        localStorage.setItem("prizeSelectedStart", start);
        localStorage.setItem("prizeSelectedEnd", end);
        localStorage.setItem("prizeSelectedKey", prizeKey);
        localStorage.setItem("newPrize", false);
    });
}

function savePrize(prizeKey, name, start, end, points) {
    firebase.database().ref("prizes/" + prizeKey).set({
        key: prizeKey,
        name: name,
        point_value: parseInt(points),
        start_time: start,
        end_time: end
        
    }, function(error) {
        if (error) {
            console.log(error.message);
        } else {
            console.log("Data saved successfully!");
        }
    });
}

function editEvent(eventKey) {
    return firebase.database().ref('/events/' + eventKey).once('value').then(function (snapshot) {
        var name = snapshot.val().name;
        var points = parseInt(snapshot.val().point_value);
        var start = parseInt(snapshot.val().start_time);
        var end = parseInt(snapshot.val().end_time);
        var notes = snapshot.val().notes;
        var lng = parseFloat(snapshot.val().longitude);
        var lat = parseFloat(snapshot.val().latitude);

        localStorage.setItem("eventSelectedLat", lat);
        localStorage.setItem("eventSelectedLng", lng);
        localStorage.setItem("eventSelectedName", name);
        localStorage.setItem("eventSelectedPoints", points);
        localStorage.setItem("eventSelectedStart", start);
        localStorage.setItem("eventSelectedEnd", end);
        localStorage.setItem("eventSelectedKey", eventKey);
        localStorage.setItem("eventSelectedNotes", notes);
        localStorage.setItem("newEvent", false);
    });
}

function saveEvent(eventKey, name, start, end, lat, lng, points, notes) {
    firebase.database().ref("events/" + eventKey).set({
        key: eventKey,
        notes: notes,
        name: name,
        point_value: parseInt(points),
        start_time: start,
        end_time: end,
        longitude: lng,
        latitude: lat
        
    }, function(error) {
        if (error) {
            console.log(error.message);
        } else {
            console.log("Data saved successfully!");
        }
    });
}

function userEvents(uid) {
    localStorage.setItem("event_list", "");
    return firebase.database().ref('/users/' + uid).once('value').then(function (snapshot) {
        var events = snapshot.val().user_events;
        var event_list = [];
        for (var key in events) {
            firebase.database().ref('/events/' + key).once('value').then(function (snapshot) {
                var name = snapshot.val().name;
                event_list.push(name);
                localStorage.setItem("event_list", JSON.stringify(event_list));
            });
        }
    });
}

function userPrizes(uid) {
    localStorage.setItem("prize_list", "");
    return firebase.database().ref('/users/' + uid).once('value').then(function (snapshot) {
        var prizes = snapshot.val().prizes;
        var prize_list = [];
        for (var key in prizes) {
            firebase.database().ref('/prizes/' + key).once('value').then(function (snapshot) {
                var name = snapshot.val().name;
                prize_list.push(name);
                localStorage.setItem("prize_list", JSON.stringify(prize_list));
            });
        }
    });
}

