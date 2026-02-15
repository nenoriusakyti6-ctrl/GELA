// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Registration
async function register(){
  const email=document.getElementById('email').value;
  const password=document.getElementById('password').value;
  const role=document.getElementById('role').value;
  try{
    const userCredential = await createUserWithEmailAndPassword(auth,email,password);
    await setDoc(doc(db,"users",userCredential.user.uid),{email,role});
    alert("Registracija sėkminga");
  }catch(err){alert(err.message);}
}

// Login
async function login(){
  const email=document.getElementById('email').value;
  const password=document.getElementById('password').value;
  try{
    const userCredential = await signInWithEmailAndPassword(auth,email,password);
    const userDoc = await getDoc(doc(db,"users",userCredential.user.uid));
    document.getElementById('auth-section').style.display='none';
    document.getElementById('app-section').style.display='block';
    document.getElementById('user-name').innerText=email;
    document.getElementById('user-role').innerText=userDoc.data().role;
    loadDashboard(userDoc.data().role,userCredential.user.uid);
  }catch(err){alert(err.message);}
}

// Logout
async function logout(){
  await signOut(auth);
  document.getElementById('auth-section').style.display='block';
  document.getElementById('app-section').style.display='none';
}

// Dashboard
async function loadDashboard(role,uid){
  const dash=document.getElementById('dashboard');
  dash.innerHTML="";
  if(role==="admin"){
    dash.innerHTML+="<h3>Admin modulis</h3><button onclick='createClass()'>Kurti klasę</button><div id='classes-list'></div>";
    loadClasses();
  }else if(role==="teacher"){
    dash.innerHTML+="<h3>Mokytojo modulis</h3><div id='teacher-actions'></div>";
    loadTeacher(uid);
  }else if(role==="student"){
    dash.innerHTML+="<h3>Mokinio modulis</h3>";
    loadStudent(uid);
  }else if(role==="parent"){
    dash.innerHTML+="<h3>Tėvų modulis</h3>";
    loadParent(uid);
  }
}

// Admin functions
async function createClass(){
  const className=prompt("Įveskite klasės pavadinimą:");
  if(!className) return;
  await setDoc(doc(db,"classes",className),{name:className,students:[],teachers:[]});
  loadClasses();
}
async function loadClasses(){
  const snapshot = await getDocs(collection(db,"classes"));
  let html="<ul>";
  snapshot.forEach(doc=>{html+=`<li>${doc.id}</li>`});
  html+="</ul>";
  document.getElementById('classes-list').innerHTML=html;
}

// Teacher, Student, Parent stubs
async function loadTeacher(uid){ document.getElementById('teacher-actions').innerHTML="<p>Mokytojo funkcijos čia.</p>"; }
async function loadStudent(uid){ document.getElementById('dashboard').innerHTML+="<p>Mokinio funkcijos čia.</p>"; }
async function loadParent(uid){ document.getElementById('dashboard').innerHTML+="<p>Tėvų funkcijos čia.</p>"; }