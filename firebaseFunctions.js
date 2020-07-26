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
        addEvent($("#event_name").val(), event_create_start, event_create_end, localStorage.getItem("newEventLat"), localStorage.getItem("newEventLng"), $("#event_points_slide").val(), $("#event_description").val());
        window.location.href = "admin-events.html";
    });
    $("#prize_save_button").on("click", function() {
        addPrize($("#prize_name").val(), prize_create_start, prize_create_end, $("#event_points_slide").val());
        window.location.href = "admin-prizes.html";
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

function checkInToEvent(eventKey){
    var user = firebase.auth().currentUser;
    return firebase.database().ref('/').once('value').then(function (snapshot) {
        var users = snapshot.val().users;
        var user_points = parseInt(users[user.uid].points);
        var pointValue = parseInt(snapshot.val().events[eventKey].point_value);
        console.log(users[user.uid]);
        if(eventKey in users[user.uid].user_events){
            console.log("Already checked in to this event");
            generateAlert("#map_alerts", "danger", "You have already checked in to this event!");
            return false;
        }else{
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
            generateAlert("#map_alerts", "success", "Success!\nYou gained " + pointValue + "points!");
        }
    });
}

function generateAlert(id, color, message){
    $(id).prepend("<div class=\"alert alert-" + color + " alert-dismissible fade show\" role=\"alert\">\n" +
        message + "\n" +
        "  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">\n" +
        "    <span aria-hidden=\"true\">&times;</span>\n" +
        "  </button>\n" +
        "</div>"
    )
}

function addEventElement(snap){
    obj = snap.val();
    console.log(obj);
    var start = new Date(obj.start_time);
    var end = new Date(obj.end_time);
    $("#eventList").append("<li id=\"" + obj.key + "_main\"class=\"list-group-item\">\n" +
        "            <h3>" + obj.name + " <span style='color: #4e89ed'>" + obj.point_value + "pts</span></h3>\n" +
        "            <h5>" + obj.notes + "</h5>\n" +
        "            <h6>" + formatDate(start) + " to " + formatDate(end) + "</h6>\n" +    
        "            <button id=\"" + obj.key + "_button\" class='btn btn-primary'>Check In</button>" +
        "          </li>");

    var key = obj.key;
    var points = obj.point_value;
    addMarker(obj.latitude, obj.longitude, obj.name, obj.notes, start, end, obj.key);

    $("#" + key + "_button").on("click", function() {
        checkInToEvent(key);
    });

    $("#recent_events_admin").append("<li class=\"list-group-item list-group-item-action\">" + obj.name + "<button id=\"" + obj.key + "_admin_button\" class=\"btn btn-primary\" style=\"float: right;\">Edit</button></li>");
    
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
    button.innerHTML = "Purchase";
    button.className = "btn btn-light";
    button.type = "button";
    button.id = key;
    button.addEventListener("click", function() {
      purchase(this.id);
    });

    var edit = document.createElement("button");
    edit.innerHTML = "Edit";
    edit.className = "btn btn-light";
    edit.type = "button";
    button.addEventListener("click", function() {
        localStorage.setItem()
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

    $("#prizes").append(row);
    $("#admin-prizes").append(editrow);

}


function purchase(prizeKey) {

    var user = firebase.auth().currentUser;
    return firebase.database().ref('/').once('value').then(function (snapshot) {
        var users = snapshot.val().users;
        var user_points = parseInt(users[user.uid].points);
        var pointValue = parseInt(snapshot.val().prizes[prizeKey].point_value);
        console.log(users[user.uid]);
        if (user_points < pointValue) {
            console.log("Not enough points to purchase this prize!");
        }
        else if(prizeKey in users[user.uid].prizes){
            console.log("Already purchased this prize!");
            //generateAlert("#map_alerts", "danger", "You have already checked in to this event!");
            return false;
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
            localStorage.setItem("points", parseInt(localStorage.getItem("points")) - pointValue);
            generateAlert("#map_alerts", "success", "Success!\nYou purchased this prize for " + pointValue + "points!");
            document.getElementById("points-label").innerHTML = "Points: " + localStorage.getItem("points");
        }
    });
}
