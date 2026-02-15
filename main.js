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

// Init Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', logout);

// Login
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(uc => db.collection('users').doc(uc.user.uid).get())
    .then(doc => {
      if(!doc.exists) { alert("Vartotojas neegzistuoja"); auth.signOut(); return; }
      const role = doc.data().role;
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('app-section').style.display = 'block';
      document.getElementById('user-name').innerText = email;
      document.getElementById('user-role').innerText = role;
      loadDashboard(role, doc.id);
    })
    .catch(err => alert("Neteisingas el. paštas arba slaptažodis"));
}

function logout() {
  auth.signOut();
  document.getElementById('auth-section').style.display='block';
  document.getElementById('app-section').style.display='none';
}

// Dashboard loader
function loadDashboard(role, uid) {
  const dash = document.getElementById('dashboard');
  dash.innerHTML = "";
  if(role === "admin") {
    dash.innerHTML += `
      <h3>Admin modulis</h3>
      <button onclick='createUser("teacher")'>Pridėti mokytoją</button>
      <button onclick='createUser("student")'>Pridėti mokinį</button>
      <button onclick='createUser("parent")'>Pridėti tėvą</button>
      <button onclick='createClass()'>Kurti klasę</button>
      <div id='users-list'></div>
      <div id='classes-list'></div>`;
    loadUsers();
    loadClasses();
  } else if(role === "teacher") {
    dash.innerHTML += `
      <h3>Mokytojo modulis</h3>
      <div id='teacher-data'></div>`;
    showStudentsForTeacher(uid);
  } else if(role === "student") {
    dash.innerHTML += `<h3>Mokinio modulis</h3><div id='student-data'></div>`;
    viewStudentData(uid);
  } else if(role === "parent") {
    dash.innerHTML += `<h3>Tėvų modulis</h3><div id='parent-data'></div>`;
    viewParentData(uid);
  }
}

// ---------------- Admin Functions ----------------
function createUser(role){
  const email = prompt("El. paštas:");
  const password = prompt("Slaptažodis:");
  if(!email || !password) return;
  auth.createUserWithEmailAndPassword(email, password)
    .then(uc => db.collection('users').doc(uc.user.uid).set({email, role}))
    .then(() => loadUsers())
    .catch(err => alert(err.message));
}

function loadUsers(){
  db.collection('users').get().then(snap => {
    let html="<h4>Vartotojai</h4><table><tr><th>El. paštas</th><th>Rolė</th><th>Veiksmai</th></tr>";
    snap.forEach(doc => {
      const d = doc.data();
      html += `<tr><td>${d.email}</td><td>${d.role}</td>
        <td><button onclick='deleteUser("${doc.id}")'>Ištrinti</button></td></tr>`;
    });
    html += "</table>";
    document.getElementById('users-list').innerHTML = html;
  });
}

function deleteUser(uid){
  if(!confirm("Ar tikrai ištrinti?")) return;
  db.collection('users').doc(uid).delete().then(()=>loadUsers());
}

function createClass(){
  const name = prompt("Klasės pavadinimas:");
  if(!name) return;
  db.collection('classes').doc(name).set({name, students: [], teachers: []}).then(()=>loadClasses());
}

function loadClasses(){
  db.collection('classes').get().then(snap=>{
    let html="<h4>Klasės</h4><table><tr><th>Pavadinimas</th><th>Veiksmai</th></tr>";
    snap.forEach(doc => html += `<tr><td>${doc.id}</td><td><button onclick='deleteClass("${doc.id}")'>Ištrinti</button></td></tr>`);
    html += "</table>";
    document.getElementById('classes-list').innerHTML = html;
  });
}

function deleteClass(name){
  if(!confirm("Ar tikrai ištrinti klasę?")) return;
  db.collection('classes').doc(name).delete().then(()=>loadClasses());
}

// ---------------- Teacher Functions ----------------
function showStudentsForTeacher(teacherUID){
  db.collection('users').where('role','==','student').get().then(snap=>{
    let html="<h4>Mokiniai</h4><table><tr><th>Vardas</th><th>Lankomumas</th><th>Pažymys</th></tr>";
    snap.forEach(doc => {
      html += `<tr>
        <td>${doc.data().email}</td>
        <td><button onclick='markAttendance("${doc.id}")'>Žymėti</button></td>
        <td><button onclick='enterGrade("${doc.id}")'>Įvesti</button></td>
      </tr>`;
    });
    html += "</table>";
    document.getElementById('teacher-data').innerHTML = html;
  });
}

function markAttendance(studentUID){
  const status = prompt("Lankomumas: present/absent");
  if(!status) return;
  db.collection('attendance').add({studentUID, date:new Date().toLocaleDateString(), status});
}

function enterGrade(studentUID){
  const grade = prompt("Pažymys:");
  if(!grade) return;
  db.collection('grades').add({studentUID, date:new Date().toLocaleDateString(), grade});
}

// ---------------- Student Functions ----------------
function viewStudentData(uid){
  let html="<h4>Pažymiai</h4><table><tr><th>Data</th><th>Pažymys</th></tr>";
  db.collection('grades').where('studentUID','==',uid).get().then(snap=>{
    snap.forEach(doc => html += `<tr><td>${doc.data().date}</td><td>${doc.data().grade}</td></tr>`);
    html += "</table>";
    document.getElementById('student-data').innerHTML = html;
  });
}

// ---------------- Parent Functions ----------------
function viewParentData(uid){
  let html="<h4>Vaiko pažymiai</h4><table><tr><th>Data</th><th>Pažymys</th></tr>";
  db.collection('grades').get().then(snap=>{
    snap.forEach(doc => html += `<tr><td>${doc.data().date}</td><td>${doc.data().grade}</td></tr>`);
    html += "</table>";
    document.getElementById('parent-data').innerHTML = html;
  });
}
