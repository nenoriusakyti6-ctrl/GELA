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

// Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const dashboardDiv = document.getElementById('dashboard');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', logout);

let currentUser=null;
let currentRole=null;
let currentUID=null;

function login(){
  const email=document.getElementById('email').value;
  const password=document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email,password)
    .then(uc=>{
      currentUID=uc.user.uid;
      db.collection('users').doc(currentUID).get().then(doc=>{
        if(!doc.exists){ alert("Vartotojas neegzistuoja"); auth.signOut(); return; }
        currentRole=doc.data().role;
        currentUser=email;
        loginSection.style.display="none";
        dashboardSection.style.display="block";
        loadDashboard();
      });
    }).catch(err=>alert("Neteisingas el. paštas arba slaptažodis"));
}

function logout(){
  auth.signOut();
  loginSection.style.display="block";
  dashboardSection.style.display="none";
  dashboardDiv.innerHTML="";
}

// ---------------- Dashboard loader ----------------
function loadDashboard(){
  dashboardDiv.innerHTML="";
  if(currentRole==="admin") loadAdminDashboard();
  else if(currentRole==="teacher") loadTeacherDashboard();
  else if(currentRole==="student") loadStudentDashboard();
  else if(currentRole==="parent") loadParentDashboard();
}

// ---------------- Admin ----------------
function loadAdminDashboard(){
  dashboardDiv.innerHTML=`
    <h2>Admin Dashboard</h2>
    <button onclick="addUser('teacher')">Pridėti mokytoją</button>
    <button onclick="addUser('student')">Pridėti mokinį</button>
    <button onclick="addUser('parent')">Pridėti tėvą</button>
    <button onclick="addClass()">Kurti klasę</button>
    <div id="users-table"></div>
    <div id="classes-table"></div>`;
  renderUsersTable();
  renderClassesTable();
}

function addUser(role){
  const email=prompt("El. paštas:");
  const password=prompt("Slaptažodis:");
  const className=prompt("Klasė (tik mokiniams/mokytojams):")||"";
  if(!email||!password) return;
  auth.createUserWithEmailAndPassword(email,password)
    .then(u=> db.collection('users').doc(u.user.uid).set({email,role,class:className}))
    .then(()=>renderUsersTable());
}

function addClass(){
  const name=prompt("Klasės pavadinimas:");
  if(!name) return;
  db.collection('classes').doc(name).set({students:[],teachers:[]})
    .then(()=>renderClassesTable());
}

function renderUsersTable(){
  db.collection('users').get().then(snap=>{
    let html="<h3>Vartotojai</h3><table><tr><th>Email</th><th>Role</th><th>Klasė</th><th>Veiksmai</th></tr>";
    snap.forEach(doc=>{
      const d=doc.data();
      html+=`<tr><td>${d.email}</td><td>${d.role}</td><td>${d.class||''}</td>
        <td><button onclick="deleteUser('${doc.id}')">Ištrinti</button></td></tr>`;
    });
    html+="</table>";
    document.getElementById('users-table').innerHTML=html;
  });
}

function renderClassesTable(){
  db.collection('classes').get().then(snap=>{
    let html="<h3>Klasės</h3><table><tr><th>Pavadinimas</th><th>Veiksmai</th></tr>";
    snap.forEach(doc=>html+=`<tr><td>${doc.id}</td>
      <td><button onclick="deleteClass('${doc.id}')">Ištrinti</button></td></tr>`);
    html+="</table>";
    document.getElementById('classes-table').innerHTML=html;
  });
}

function deleteUser(uid){
  if(!confirm("Ar tikrai ištrinti?")) return;
  db.collection('users').doc(uid).delete().then(()=>renderUsersTable());
}

function deleteClass(name){
  if(!confirm("Ar tikrai ištrinti?")) return;
  db.collection('classes').doc(name).delete().then(()=>renderClassesTable());
}

// ---------------- Teacher ----------------
function loadTeacherDashboard(){
  dashboardDiv.innerHTML="<h2>Mokytojo Dashboard</h2>Filtras: <select id='class-filter'></select> <select id='type-filter'><option value='all'>Tipas</option><option value='attendance'>Lankomumas</option><option value='grade'>Pažymys</option><option value='homework'>Namų darbas</option></select><button onclick='renderStudentsTableFiltered()'>Filtruoti</button><div id='students-table'></div>";
  populateClassFilter();
  renderStudentsTableFiltered();
}

function populateClassFilter(){
  const sel=document.getElementById('class-filter');
  db.collection('classes').get().then(snap=>{
    sel.innerHTML="<option value='all'>Visos klasės</option>";
    snap.forEach(doc=>sel.innerHTML+=`<option value='${doc.id}'>${doc.id}</option>`);
  });
}

function renderStudentsTableFiltered(){
  const selClass=document.getElementById('class-filter').value;
  const selType=document.getElementById('type-filter').value;
  let query=db.collection('users').where('role','==','student');
  if(selClass!=='all') query=query.where('class','==',selClass);
  query.get().then(snap=>{
    let html="<table><tr><th>Mokinys</th><th>Lankomumas</th><th>Pažymys</th><th>Namų darbas</th><th>Veiksmai</th></tr>";
    snap.forEach(doc=>{
      const uid=doc.id;
      html+=`<tr><td>${doc.data().email}</td>
        <td><input type='text' id='att-${uid}'></td>
        <td><input type='text' id='grade-${uid}'></td>
        <td><input type='text' id='home-${uid}'></td>
        <td><button onclick="saveStudentData('${uid}')">Išsaugoti</button></td>
      </tr>`;
    });
    html+="</table>";
    document.getElementById('students-table').innerHTML=html;
  });
}

function saveStudentData(uid){
  const att=document.getElementById(`att-${uid}`).value;
  const grade=document.getElementById(`grade-${uid}`).value;
  const homework=document.getElementById(`home-${uid}`).value;
  if(att) db.collection('attendance').add({studentUID:uid,status:att,date:new Date().toLocaleDateString()});
  if(grade) db.collection('grades').add({studentUID:uid,grade,date:new Date().toLocaleDateString()});
  if(homework) db.collection('homework').add({studentUID:uid,value:homework,date:new Date().toLocaleDateString()});
}

// ---------------- Student ----------------
function loadStudentDashboard(){
  dashboardDiv.innerHTML="<h2>Mokinio Dashboard</h2><div id='student-data'></div>";
  db.collection('grades').where('studentUID','==',currentUID).get().then(snap=>{
    let html="<table><tr><th>Data</th><th>Pažymys</th></tr>";
    snap.forEach(doc=>html+=`<tr><td>${doc.data().date}</td><td>${doc.data().grade}</td></tr>`);
    html+="</table>";
    document.getElementById('student-data').innerHTML=html;
  });
}

// ---------------- Parent ----------------
function loadParentDashboard(){
  dashboardDiv.innerHTML="<h2>Tėvų Dashboard</h2><div id='parent-data'></div>";
  db.collection('grades').get().then(snap=>{
    let html="<table><tr><th>Mokinys</th><th>Data</th><th>Pažymys</th></tr>";
    snap.forEach(doc=>html+=`<tr><td>${doc.data().studentUID}</td><td>${doc.data().date}</td><td>${doc.data().grade}</td></tr>`);
    html+="</table>";
    document.getElementById('parent-data').innerHTML=html;
  });
}
