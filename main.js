// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAvkDsz6eAoPN2dMqvoTho5xv1yc490V7A",
  authDomain: "gela-34020.firebaseapp.com",
  projectId: "gela-34020",
  storageBucket: "gela-34020.firebasestorage.app",
  messagingSenderId: "668623580567",
  appId: "1:668623580567:web:cc1ea4582d3018978fa8d2",
  measurementId: "G-RNP6YBNGRM"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('logout-btn').addEventListener('click', logout);

// Login function
function login(){
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email,password)
    .then(userCredential=>{
      const uid = userCredential.user.uid;
      return db.collection('users').doc(uid).get();
    })
    .then(docSnap=>{
      if(!docSnap.exists){
        alert("Šio vartotojo nėra. Kreipkitės į administratorių.");
        auth.signOut();
        return;
      }
      const role = docSnap.data().role;
      document.getElementById('auth-section').style.display='none';
      document.getElementById('app-section').style.display='block';
      document.getElementById('user-name').innerText = email;
      document.getElementById('user-role').innerText = role;
      loadDashboard(role, docSnap.id);
    })
    .catch(err=>alert("Neteisingas el. paštas arba slaptažodis"));
}

function logout(){
  auth.signOut();
  document.getElementById('auth-section').style.display='block';
  document.getElementById('app-section').style.display='none';
}

// Dashboard loader
function loadDashboard(role,uid){
  const dash = document.getElementById('dashboard');
  dash.innerHTML="";
  if(role==="admin"){
    dash.innerHTML += `
      <h3>Admin modulis</h3>
      <button onclick='createUser("teacher")'>Pridėti mokytoją</button>
      <button onclick='createUser("student")'>Pridėti mokinį</button>
      <button onclick='createUser("parent")'>Pridėti tėvą</button>
      <button onclick='createClass()'>Kurti klasę</button>
      <div id='classes-list'></div>
      <div id='users-list'></div>`;
    loadClasses();
    loadUsers();
  } else if(role==="teacher"){
    dash.innerHTML += `
      <h3>Mokytojo modulis</h3>
      <button onclick='markAttendance()'>Žymėti lankomumą</button>
      <button onclick='enterGrades()'>Įvesti pažymius</button>
      <button onclick='addHomework()'>Namų darbai</button>
      <button onclick='addAssignment()'>Atsiskaitymai</button>
      <div id='teacher-data'></div>`;
  } else if(role==="student"){
    dash.innerHTML += `<h3>Mokinio modulis</h3><div id='student-data'></div>`;
    viewStudentData(uid);
  } else if(role==="parent"){
    dash.innerHTML += `<h3>Tėvų modulis</h3><div id='parent-data'></div>`;
    viewParentData(uid);
  }
}

// ---------------- Admin Functions ----------------
function createUser(role){
  const email = prompt("Įveskite el. paštą:");
  const password = prompt("Įveskite slaptažodį:");
  if(!email || !password) return;
  auth.createUserWithEmailAndPassword(email,password)
    .then(uc=>{
      return db.collection('users').doc(uc.user.uid).set({email,role});
    })
    .then(()=>{ alert(role+" sukurtas"); loadUsers(); })
    .catch(err=>alert(err.message));
}

function createClass(){
  const name = prompt("Įveskite klasės pavadinimą:");
  if(!name) return;
  db.collection('classes').doc(name).set({name,students:[],teachers:[]})
    .then(()=>loadClasses());
}

function loadClasses(){
  db.collection('classes').get().then(snapshot=>{
    let html="<ul>";
    snapshot.forEach(doc=>html+=`<li>${doc.id}</li>`);
    html+="</ul>";
    document.getElementById('classes-list').innerHTML = html;
  });
}

function loadUsers(){
  db.collection('users').get().then(snapshot=>{
    let html="<ul>";
    snapshot.forEach(doc=>{
      const data=doc.data();
      html+=`<li>${data.email} (${data.role})</li>`;
    });
    html+="</ul>";
    document.getElementById('users-list').innerHTML = html;
  });
}

// ---------------- Teacher Functions ----------------
function markAttendance(){ addData("attendance","Žymėjimas"); }
function enterGrades(){ addData("grades","Pažymys"); }
function addHomework(){ addData("homework","Namų darbas"); }
function addAssignment(){ addData("assignments","Atsiskaitymas"); }

function addData(collectionName,label){
  const value = prompt(`Įveskite ${label}`);
  if(!value) return;
  const email = document.getElementById('user-name').innerText;
  db.collection(collectionName).add({teacher: email,value,date: new Date().toLocaleDateString()})
    .then(()=>alert(label+" įrašytas"));
}

// ---------------- Student / Parent Functions ----------------
function viewStudentData(uid){
  let html="<h4>Pažymiai</h4><ul>";
  db.collection("grades").get().then(snap=>{
    snap.forEach(doc=>html+=`<li>${doc.data().value}</li>`);
    html+="</ul>";
    document.getElementById('student-data').innerHTML=html;
  });
}

function viewParentData(uid){
  let html="<h4>Vaiko pažymiai</h4><ul>";
  db.collection("grades").get().then(snap=>{
    snap.forEach(doc=>html+=`<li>${doc.data().value}</li>`);
    html+="</ul>";
    document.getElementById('parent-data').innerHTML=html;
  });
}
