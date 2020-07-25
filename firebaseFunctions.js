var ready = false;

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
    dbRefObject.on("child_removed", snap => {console.log("Removed!"); console.log(snap.val())});
    dbRefObject.on("child_changed", snap => {console.log("Changed!"); console.log(snap.val())});

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

    $('input[name="datetimes"]').daterangepicker({
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

    $("#event_save_button").on("click", function() {
        addEvent($("#event_name").val(), event_create_start, event_create_end, 0,0, $("#event_points_slide").val(), $("#event_description").val())
    });
});

var event_create_start = 0;
var event_create_end = 0;

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
    promise.catch(e => console.log(e.message)).then(() => {
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
            user_events: []
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

function checkInToEvent(eventKey){
    var user = firebase.auth().currentUser;
    return firebase.database().ref('/').once('value').then(function (snapshot) {
        var users = snapshot.val().users;
        var user_points = users[user.uid].points;
        var pointValue = snapshot.val().events[eventKey].point_value;
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
            generateAlert("#map_alerts", "success", "Success!\nYou gained " + points + "points!");
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
    $("#eventList").append("<li class=\"list-group-item\">\n" +
        "            <h3>" + obj.name + " <span style='color: #4e89ed'>" + obj.point_value + "pts</span></h3>\n" +
        "            <h5>" + obj.notes + "</h5>\n" +
        "            <h6>" + formatDate(start) + " to " + formatDate(end) + "</h6>\n" +    
        "            <button id=\"" + obj.key + "_button\" class='btn btn-primary'>Check In</button>" +
        "          </li>");

    var key = obj.key;
    var points = obj.point_value;
    $("#" + key + "_button").on("click", function() {
        checkInToEvent(key);
    });
    addMarker({lat: obj.latitude, lng: obj.longitude}, obj.name, obj.notes, start, end, obj.key);
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
      points = snapshot.val().points;
      events = snapshot.val().user_events;
      

      // ...
      localStorage.setItem("username", username);
      localStorage.setItem("points", points + "");
      //localStorage.setItem("events-attended", events.length + "");
      window.location.href = "welcome.html";
    });
    
}
